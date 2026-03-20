import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

import { scanAndRedact, type AuditLog } from "@shadow/core";
import { db, auditLogs } from "@shadow/db";
import { auth, type AuthUser, type AuthSession } from "@shadow/auth";

type Variables = {
  user: AuthUser;
  session: AuthSession;
};

const app = new Hono<{ Variables: Variables }>();

// Middleware
app.use("*", logger());
app.use("*", cors({ origin: "http://localhost:3001", credentials: true }));

// 1. Mount Better Auth Handler
app.on(["GET", "POST"], "/api/auth/**", (c) => auth.handler(c.req.raw));

// 2. Auth Middleware (Protect Routes Below This)
app.use("/v1/*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: "Unauthorized. Please sign in." }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

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

export default app;
