import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { desc, eq } from "drizzle-orm";
import crypto from "crypto";

import { scanAndRedact } from "@shadow/core";
import { db, auditLogs, apiKeys } from "@shadow/db";
import { auth, type AuthUser, type AuthSession } from "@shadow/auth";
import { rateLimitMiddleware } from "./middleware/ratelimit";

type Variables = {
  user: AuthUser;
  session: AuthSession;
};

const app = new Hono<{ Variables: Variables }>();

// Middleware
app.use("*", logger());
app.use("*", cors({ 
  origin: ["http://localhost:3001", "http://127.0.0.1:3001"], 
  credentials: true 
}));

// 1. Mount Better Auth Handler
app.on(["GET", "POST"], "/api/auth/**", (c) => auth.handler(c.req.raw));

// 2. Auth Middleware (Protect Routes Below This)
app.use("/v1/*", async (c, next) => {
  // 1. Check for Virtual API Key (Programmatic Access)
  const authHeader = c.req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer sk-shadow-")) {
    const token = authHeader.split(" ")[1]; // Extract the token
    
    // Look up the key in the database
    const [keyRecord] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, token))
      .limit(1);
    
    if (keyRecord) {
      // Key is valid! Inject a "virtual" user session
      // @ts-ignore - Injecting a partial user for API key access
      c.set("user", { 
        id: keyRecord.userId, 
        email: `api-key-user (${keyRecord.name})` 
      });
      return await next(); // Proceed to AI proxy
    }
  }

  // 2. Fallback to Browser Session (Dashboard Access)
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (session) {
    c.set("user", session.user);
    c.set("session", session.session);
    return await next();
  }

  return c.json({ error: "Unauthorized. Invalid API Key or Session." }, 401);
});

// 2.5 Inject Rate Limiter Middleware
app.use("/v1/*", rateLimitMiddleware);

app.use("/api/logs", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    console.warn("[AUTH] Unauthorized attempt to access /api/logs");
    return c.json({ error: "Unauthorized. Please sign in." }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

// 3. GET Logs Route (Protected)
const routes = app
  .get("/api/logs", async (c) => {
    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(50);
    return c.json(logs);
  })
  .use("/api/keys/*", async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    c.set("user", session.user);
    await next();
  })
  .get("/api/keys", async (c) => {
    const user = c.get("user");
    const keys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, user.id));
    return c.json(keys);
  })
  .post("/api/keys", async (c) => {
    const user = c.get("user");
    const { name } = await c.req.json();

    // Generate a secure, random string
    const randomString = crypto.randomBytes(24).toString("hex");
    const newKeyString = `sk-shadow-${randomString}`;

    const [newKey] = await db
      .insert(apiKeys)
      .values({
        userId: user.id,
        name: name,
        key: newKeyString,
      })
      .returning();

    return c.json(newKey);
  });

// 5. Chat Completions Route (Protected by Dual Auth)
app.post("/v1/chat/completions", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const messages = body.messages || [];
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || !lastMessage.content) {
      return c.json({ error: "Invalid request format" }, 400);
    }

    // 1. THE AUDIT STEP: Scan the user's prompt
    const scanResult = scanAndRedact(lastMessage.content);
    const wasRedacted = scanResult.matches.length > 0;

    // 2. THE ACTION: Modify the request if needed
    if (wasRedacted) {
      console.log(
        `[AUDIT] Redacting ${scanResult.matches.length} items from user.`,
      );
      // Replace the content in the array
      messages[messages.length - 1].content = scanResult.redacted;
    }

    // 3. LOGGING (Async Fire-and-Forget)
    db.insert(auditLogs)
      .values({
        userId: user.id,
        userEmail: user.email,
        prompt: scanResult.original,
        wasRedacted: wasRedacted,
        redactedFields: scanResult.matches.map((m) => m.type),
        provider: "gemini",
      })
      .execute()
      .catch((err) => {
        console.error("[DB ERROR] Failed to save audit log:", err);
      });

    // 4. FORWARD TO GEMINI
    const modelName = body.model || "gemini-2.5-flash";

    console.log(`Forwarding request to provider with model: ${modelName}`);

    const result = streamText({
      model: google(modelName),
      messages: messages,
    });

    // 5. STREAM RESPONSE BACK TO CLIENT
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Gateway Error:", error);
    return c.json({ error: error.message }, 500);
  }
});

export type AppType = typeof routes;
export default app;

