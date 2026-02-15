# Project Structure

We will use a **Turborepo** (or Bun Workspaces) structure. This is the industry standard for high-quality TypeScript monorepos.

```text
/shadow-ai-gateway
├── package.json              # Root config
├── turbo.json                # Turborepo pipeline config
│
├── /apps
│   ├── /web                  # (Next.js 14) - The "Control Plane" Dashboard
│   │   ├── /app              # App Router: /dashboard, /settings, /logs
│   │   └── /components       # Shadcn UI components
│   │
│   └── /gateway              # (Hono + Bun) - The "Data Plane" Proxy
│       ├── /src
│       │   ├── index.ts      # Server entry
│       │   ├── /middleware   # Auth, RateLimit
│       │   └── /providers    # OpenAI, Anthropic adapters
│       ├── Dockerfile        # Optimized for Bun
│       └── wrangler.toml     # (Optional) Deploy to Cloudflare Workers
│
├── /packages
│   ├── /core                 # The Business Logic (Shared)
│   │   ├── /pii              # Redaction logic (RegEx + NLP)
│   │   ├── /guard            # The "Pipeline" engine
│   │   └── /types            # Zod schemas & TypeScript interfaces
│   │
│   ├── /db                   # Database Layer
│   │   ├── /schema           # Drizzle ORM definitions
│   │   └── client.ts         # Connection pooling
│   │
│   └── /logger               # Async Logging Service
│       └── index.ts          # Pushes logs to ClickHouse/Postgres
│
└── /docker
    ├── compose.yml           # Runs Postgres, Redis, and the Apps
    └── prometheus.yml        # Metrics configuration
```

### Key Technical Advancements (TypeScript Edition)

#### 1. The "Pipeline" Pattern (The Trylon Inspiration)

Instead of a monolithic function, we build a composable pipeline using a generic **`Guard`** interface. This makes your code clean and plugin-ready.

```typescript
// packages/core/guard/types.ts
export interface GuardContext {
  prompt: string;
  userId: string;
  metadata: Record<string, any>;
}

export interface GuardResult {
  allowed: boolean;
  modifiedPrompt?: string;
  reason?: string;
}

export abstract class BaseGuard {
  abstract execute(ctx: GuardContext): Promise<GuardResult>;
}
```

**Implementation:**

```typescript
// apps/gateway/src/pipeline.ts
const pipeline = new GuardPipeline([
  new RateLimitGuard(),
  new PiiRedactionGuard({ strict: true }), // Stops emails/CCs
  new SecretKeyGuard(), // Blocks AWS keys or API tokens
]);

// In your Hono route:
const result = await pipeline.run({ prompt: userMessage, userId });
if (!result.allowed) return c.json({ error: result.reason }, 403);
```

#### 2. "Edge-Ready" Design (Hono)

By using **Hono**, your Gateway isn't just a Node.js server. It allows you to deploy the _exact same code_ to:

- **Bun** (on a \$5 VPS or your Raspberry Pi)
- **Cloudflare Workers** (Global Edge Network - lowest latency)
- **AWS Lambda**
  This is a huge selling point. A client in London hits your London edge node, not a server in Virginia.

#### 3. Async Logging with "Fire-and-Forget"

To keep the chat snappy, we don't await the database write. We use a non-blocking patterns.

```typescript
// apps/gateway/src/index.ts
app.post("/v1/chat/completions", async (c) => {
  // ... process request ...

  // 🚀 Fire-and-forget: Don't await this!
  // In Bun/Node, this runs in the background.
  // Ideally, push to a Redis queue here.
  auditLogger.log({
    prompt: originalPrompt,
    redacted: wasRedacted,
    user: userId,
    timestamp: Date.now(),
  });

  return streamResponse(openaiStream);
});
```

#### 4. Unified Types (`@repo/db`)

You define your database schema **once** using **Drizzle ORM** in `packages/db`.

- The **Gateway** imports it to log chats.
- The **Dashboard** imports it to _view_ chats.
- If you change a column name, TypeScript breaks _both_ apps at build time, preventing runtime bugs.

### Recommended Stack for You

- **Runtime:** Bun (Super fast startup, great for dev)
- **Framework:** Hono (Standard for modern TS APIs)
- **Database:** Postgres (Reliable) + Drizzle ORM (Best TS DX)
- **Frontend:** Next.js + Shadcn UI (Beautiful, fast admin panels)
- **Queue:** Redis (for robust async logging, optional for MVP)

<div align="center">⁂</div>
