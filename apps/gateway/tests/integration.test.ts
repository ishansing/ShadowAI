import { expect, test, describe, mock } from "bun:test";
import { scanAndRedact } from "@shadow/core";

// Capture the last messages sent to the mock to verify redaction
let lastMessages: any[] = [];

// Mock AI SDK before importing app
mock.module("ai", () => {
  return {
    streamText: mock((options: any) => {
      lastMessages = options.messages; // Capture the messages passed to streamText
      return {
        toTextStreamResponse: () => new Response("Mocked stream response"),
      };
    }),
  };
});

mock.module("@ai-sdk/google", () => {
  return {
    google: (modelName: string) => `mocked-model:${modelName}`,
  };
});

mock.module("@shadow/auth", () => {
  return {
    auth: {
      handler: () => new Response("Mocked Auth Handler"),
      api: {
        getSession: async () => {
          return {
            session: { id: "sess_123" },
            user: { id: "test_user_id", email: "test@example.com" }
          };
        }
      }
    }
  };
});

// Import the app AFTER mocking
import app from "../src/index";

describe("Core PII Redaction Engine", () => {
  test("Redacts API keys", () => {
    const result = scanAndRedact("My key is sk-1234567890abcdef1234567890abcdef");
    expect(result.matches.length).toBe(1);
    expect(result.matches[0].type).toBe("API_KEY");
    expect(result.redacted).toContain("[REDACTED_API_KEY]");
  });

  test("Redacts Emails", () => {
    const result = scanAndRedact("Contact me at user@example.com.");
    expect(result.matches.length).toBe(1);
    expect(result.matches[0].type).toBe("EMAIL");
    expect(result.redacted).toContain("[REDACTED_EMAIL]");
  });

  test("Calculates risk score correctly", () => {
    const result = scanAndRedact("Email: a@b.com, Key: sk-1234567890abcdef1234567890abcdef");
    expect(result.riskScore).toBe(40);
  });
});

describe("Gateway API Router", () => {
  test("Returns 400 on empty messages", async () => {
    const req = new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await app.request(req);
    expect(res.status).toBe(400);
  });

  test("Processes a clean message", async () => {
    lastMessages = [];
    const req = new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "What is the capital of France?" }]
      }),
    });
    const res = await app.request(req);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Mocked stream response");
    expect(lastMessages[0].content).toBe("What is the capital of France?");
  });

  test("Processes and redacts a message with PII before forwarding", async () => {
    lastMessages = [];
    const req = new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "My phone number is 123-456-7890" }]
      }),
    });
    const res = await app.request(req);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Mocked stream response");
    expect(lastMessages[0].content).toContain("[REDACTED_PHONE]");
  });
});
