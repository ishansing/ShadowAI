import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { streamText } from "hono/streaming";
import OpenAI from "openai";
import { scanAndRedact, type AuditLog } from "@shadow/core";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Initialize OpenAI Client (Server-side only)
const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // 3. LOGGING (Async - Fire and Forget)
    // In a real app, push to Queue/DB here.
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      userId: "user_demo", // We'll add Auth later
      userEmail: "demo@company.com",
      prompt: scanResult.original, // Save original for compliance audit? (Dangerous but often required)
      wasRedacted: wasRedacted,
      redactedFields: scanResult.matches.map((m) => m.type),
      provider: "openai",
      timestamp: new Date(),
    };
    console.log("Saving Audit Log:", JSON.stringify(auditLog, null, 2));

    // 4. FORWARD TO OPENAI
    // We use the modified 'messages' array
    const model = body.model || "gemini-1.5-flash";
    console.log(`Forwarding request to provider with model: ${model}`);
    
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      stream: true, // Important for chat UX!
    });

    // 5. STREAM RESPONSE BACK TO CLIENT
    // Hono helper to stream SSE (Server-Sent Events)
    return streamText(c, async (stream) => {
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          await stream.write(content);
        }
      }
    });
  } catch (error: any) {
    console.error("Gateway Error:", error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
