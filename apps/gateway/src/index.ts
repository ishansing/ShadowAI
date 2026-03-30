import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { desc, eq, and, sql, gte, lte } from "drizzle-orm";
import crypto from "crypto";

import { scanAndRedact, defaultPolicy } from "@shadow/core";
import { db, auditLogs, apiKeys, policies, gatewaySettings } from "@shadow/db";
import { auth, type AuthUser, type AuthSession } from "@shadow/auth";
import { rateLimitMiddleware } from "./middleware/ratelimit";

type Variables = {
  user: AuthUser;
  session: AuthSession;
};

const app = new Hono<{ Variables: Variables }>();

// ─── DATA RETENTION CRON JOB ─────────────────────────────────────────────
// Runs every day at midnight to delete logs older than 90 days
// @ts-ignore - Bun.cron is available in Bun runtime
if (typeof Bun !== "undefined" && Bun.cron) {
  Bun.cron({
    name: "data-retention",
    cron: "0 0 * * *",
    async run() {
      console.log("[CRON] Running data retention job...");
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      try {
        await db.delete(auditLogs).where(lte(auditLogs.timestamp, ninetyDaysAgo));
        console.log(`[CRON] Retention job complete.`);
      } catch (err) {
        console.error("[CRON] Retention job failed:", err);
      }
    },
  });
}

// Middleware
app.use("*", logger());
app.use("*", cors({ 
  origin: ["http://localhost:3001", "http://127.0.0.1:3001"], 
  credentials: true 
}));

// Helper to resolve provider
const resolveProvider = (modelName: string, settings: any) => {
  const rules = settings.routingRules || {};
  for (const [pattern, provider] of Object.entries(rules)) {
    if (modelName.toLowerCase().includes(pattern.toLowerCase())) {
      if (provider === "openai") return openai(modelName);
      if (provider === "anthropic") return anthropic(modelName);
      if (provider === "gemini") return google(modelName);
    }
  }
  if (modelName.startsWith("gpt-") || modelName.startsWith("o1-")) return openai(modelName);
  if (modelName.startsWith("claude-")) return anthropic(modelName);
  if (modelName.includes("gemini")) return google(modelName);
  const def = settings.defaultProvider || "gemini";
  if (def === "openai") return openai(modelName);
  if (def === "anthropic") return anthropic(modelName);
  return google(modelName);
};

// 1. Mount Better Auth Handler
app.on(["GET", "POST"], "/api/auth/**", (c) => auth.handler(c.req.raw));

// 2. Auth Middleware
app.use("/v1/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer sk-shadow-")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      const [keyRecord] = await db.select().from(apiKeys).where(eq(apiKeys.key, token)).limit(1);
      if (keyRecord) {
        // @ts-ignore
        c.set("user", { id: keyRecord.userId, email: `api-key-user (${keyRecord.name})` });
        return await next();
      }
    }
  }
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (session) {
    c.set("user", session.user);
    c.set("session", session.session);
    return await next();
  }
  return c.json({ error: "Unauthorized. Invalid API Key or Session." }, 401);
});

app.use("/v1/*", rateLimitMiddleware);

app.use("/api/*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

// 3. Admin API Routes
const routes = app
  .get("/api/logs", async (c) => {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "50");
    const redactedOnly = c.req.query("redactedOnly") === "true";
    const offset = (page - 1) * limit;

    let query = db.select().from(auditLogs);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(auditLogs);

    if (redactedOnly) {
      // @ts-ignore
      query = query.where(eq(auditLogs.wasRedacted, true));
      // @ts-ignore
      countQuery = countQuery.where(eq(auditLogs.wasRedacted, true));
    }

    const [logs, total] = await Promise.all([
      query.orderBy(desc(auditLogs.timestamp)).limit(limit).offset(offset),
      countQuery
    ]);

    return c.json({
      data: logs,
      pagination: {
        page,
        limit,
        total: total[0]?.count || 0,
        totalPages: Math.ceil((total[0]?.count || 0) / limit)
      }
    });
  })
  .get("/api/stats/usage", async (c) => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const stats = await db
      .select({
        date: sql<string>`DATE(${auditLogs.timestamp})`,
        totalTokens: sql<number>`SUM(${auditLogs.promptTokens} + ${auditLogs.completionTokens})`,
        violations: sql<number>`SUM(CASE WHEN ${auditLogs.wasRedacted} THEN 1 ELSE 0 END)`,
        count: sql<number>`count(*)`
      })
      .from(auditLogs)
      .where(gte(auditLogs.timestamp, fourteenDaysAgo))
      .groupBy(sql`DATE(${auditLogs.timestamp})`)
      .orderBy(sql`DATE(${auditLogs.timestamp})`);

    return c.json(stats);
  })
  .get("/api/keys", async (c) => {
    const user = c.get("user");
    return c.json(await db.select().from(apiKeys).where(eq(apiKeys.userId, user.id)));
  })
  .post("/api/keys", async (c) => {
    const user = c.get("user");
    const { name } = await c.req.json();
    const randomString = crypto.randomBytes(24).toString("hex");
    const newKeyString = `sk-shadow-${randomString}`;
    const [newKey] = await db.insert(apiKeys).values({ userId: user.id, name, key: newKeyString }).returning();
    return c.json(newKey);
  })
  .delete("/api/keys/:id", async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)));
    return c.json({ success: true });
  })
  .get("/api/policies", async (c) => {
    const user = c.get("user");
    let [policy] = await db.select().from(policies).where(eq(policies.userId, user.id));
    if (!policy) [policy] = await db.insert(policies).values({ userId: user.id }).returning();
    return c.json(policy);
  })
  .post("/api/policies", async (c) => {
    const user = c.get("user");
    const updates = await c.req.json();
    const [updatedPolicy] = await db.insert(policies).values({ userId: user.id, ...updates }).onConflictDoUpdate({ target: policies.userId, set: updates }).returning();
    return c.json(updatedPolicy);
  })
  .get("/api/settings", async (c) => {
    const user = c.get("user");
    let [settings] = await db.select().from(gatewaySettings).where(eq(gatewaySettings.userId, user.id));
    if (!settings) [settings] = await db.insert(gatewaySettings).values({ userId: user.id }).returning();
    return c.json(settings);
  })
  .post("/api/settings", async (c) => {
    const user = c.get("user");
    const updates = await c.req.json();
    const [updatedSettings] = await db.insert(gatewaySettings).values({ userId: user.id, ...updates }).onConflictDoUpdate({ target: gatewaySettings.userId, set: updates }).returning();
    return c.json(updatedSettings);
  });

// 5. Chat Completions Route
app.post("/v1/chat/completions", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const messages = body.messages || [];
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content) return c.json({ error: "Invalid request" }, 400);

    const [policyRecord] = await db.select().from(policies).where(eq(policies.userId, user.id));
    const [settings] = await db.select().from(gatewaySettings).where(eq(gatewaySettings.userId, user.id));
    const currentPolicy = policyRecord || defaultPolicy;
    const currentSettings = settings || { defaultProvider: "gemini", fallbackProvider: "openai", routingRules: {} };

    const scanResult = scanAndRedact(lastMessage.content, currentPolicy);

    const [logRecord] = await db.insert(auditLogs).values({
      userId: user.id,
      userEmail: user.email,
      prompt: scanResult.original,
      wasRedacted: scanResult.wasRedacted || scanResult.shouldBlock,
      redactedFields: scanResult.matches.map(m => m.type),
      provider: body.model || "unknown",
    }).returning();

    if (scanResult.shouldBlock) {
      return c.json({ error: "Policy Violation", message: "Blocked by security policy." }, 403);
    }

    if (scanResult.wasRedacted) messages[messages.length - 1].content = scanResult.redacted;
    const modelName = body.model || "gemini-2.5-flash";

    try {
      const result = streamText({
        model: resolveProvider(modelName, currentSettings),
        messages: messages,
        onFinish: async ({ usage }) => {
          if (logRecord) {
            await db.update(auditLogs)
              .set({ 
                promptTokens: usage.inputTokens || 0, 
                completionTokens: usage.outputTokens || 0 
              })
              .where(eq(auditLogs.id, logRecord.id));
          }
        }
      });
      return result.toTextStreamResponse();
    } catch (primaryError) {
      console.error("[FAILOVER] Primary failed, attempting fallback:", primaryError);
      const fallbackProvider = currentSettings.fallbackProvider || "openai";
      const fallbackModel = fallbackProvider === "openai" ? "gpt-4o-mini" : "gemini-1.5-flash";
      const result = streamText({
        model: resolveProvider(fallbackModel, { defaultProvider: fallbackProvider }),
        messages: messages,
        onFinish: async ({ usage }) => {
          if (logRecord) {
            await db.update(auditLogs)
              .set({ 
                promptTokens: usage.inputTokens || 0, 
                completionTokens: usage.outputTokens || 0,
                provider: `${modelName} -> ${fallbackModel} (Failover)`
              })
              .where(eq(auditLogs.id, logRecord.id));
          }
        }
      });
      return result.toTextStreamResponse();
    }
  } catch (error: any) {
    console.error("Gateway Error:", error);
    return c.json({ error: error.message }, 500);
  }
});

export type AppType = typeof routes;
export default app;
