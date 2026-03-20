import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

import { scanAndRedact, type AuditLog } from "@shadow/core";
import { db, auditLogs } from "@shadow/db";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

app.post("/v1/chat/completions", async (c) => {
  try {
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
    // We do NOT use 'await' here. We let the promise resolve in the background.
    db.insert(auditLogs)
      .values({
        userId: "user_demo_123", // Hardcoded for now until Phase 5
        userEmail: "demo@company.com",
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
    // We use the modified 'messages' array
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
