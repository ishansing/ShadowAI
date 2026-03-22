# Project Structure & Data Flow

This monorepo follows a clean separation between the **Data Plane** (AI Proxy) and the **Control Plane** (Admin Dashboard), connected via a shared core and database layer.

```text
/shadow-ai-gateway
├── package.json              # Root workspace configuration
├── docker-compose.yml        # Infrastructure: Postgres, Redis, SRH Proxy
│
├── /apps
│   ├── /web                  # (Vite + React) - The "Control Plane"
│   │   ├── /src/routes       # TanStack Router: /dashboard, /keys, /policies
│   │   ├── /src/lib/api.ts   # Hono RPC Client (Type-safe)
│   │   └── /src/components   # Shadcn UI + TanStack Table
│   │
│   └── /gateway              # (Hono + Bun) - The "Data Plane"
│       ├── /src/index.ts     # Main router & AI Proxy logic
│       ├── /src/middleware   # Dual Auth, Rate Limit (Upstash)
│       └── server.log        # Dev logs
│
├── /packages
│   ├── /core                 # Business Logic (Shared)
│   │   ├── /src/pii.ts       # Dynamic PII Redaction Engine
│   │   └── /src/index.ts     # Shared types
│   │
│   ├── /db                   # Database Layer (@shadow/db)
│   │   ├── /src/schema.ts    # Drizzle ORM definitions (Audit, Keys, Policies)
│   │   └── /drizzle          # SQL migration files
│   │
│   └── /auth                 # Auth Configuration (@shadow/auth)
│       └── /src/index.ts     # Better Auth singleton & Drizzle adapter
```

## Core Data Flows

### 1. The Proxy Flow (Security First)

When an employee sends a message through the Gateway:

1. **Dual Auth Middleware:** Validates either a Virtual API Key (programmatic) or a Browser Cookie (dashboard).
2. **Rate Limit Middleware:** Checks Upstash Redis (local proxy) to see if the user has exceeded their 1-minute window.
3. **Policy Fetch:** Retrieves the Admin's granular DLP preferences from Postgres.
4. **PII Scanning:** The prompt is scanned by the `@shadow/core` engine. Sensitive fields are masked based on the active policy.
5. **AI Forwarding:** The **safe, redacted prompt** is sent to Google Gemini 2.5 Flash via the Vercel AI SDK.
6. **Async Logging:** A record of the interception is saved to the `audit_logs` table in the background (fire-and-forget).
7. **Streaming Response:** The AI's reply is streamed back to the employee instantly.

### 2. The Management Flow (Type-Safe RPC)

When an Admin uses the Dashboard:

1. **Hono RPC Client:** The Vite app uses the `AppType` exported from the Gateway to perform API calls.
2. **State Management:** TanStack Query handles caching and optimistic updates for API Keys and Policies.
3. **Real-time Config:** Changing a toggle in `/policies` instantly updates the database, affecting all subsequent Proxy Flow requests.

## Technical Stack

| Layer             | Technology                             |
| :---------------- | :------------------------------------- |
| **Runtime**       | Bun                                    |
| **Gateway**       | Hono                                   |
| **Dashboard**     | Vite + React + TanStack Router/Query   |
| **UI**            | Tailwind CSS v4 + Shadcn UI            |
| **AI SDK**        | Vercel AI SDK (Google Gemini Provider) |
| **Auth**          | Better Auth                            |
| **Database**      | PostgreSQL + Drizzle ORM               |
| **Rate Limiting** | Upstash Ratelimit + Redis              |

## Key Advancements

- **Programmatic Access:** Employees can use the gateway in CLI tools or IDEs like Cursor using `sk-shadow-` keys.
- **Local-First Dev:** Using the **Upstash SRH Proxy** allows developers to test production-grade rate limiting without a cloud dependency.
- **Dynamic DLP:** The PII engine is no longer a static filter; it is a policy-driven engine that adapts to user needs.
