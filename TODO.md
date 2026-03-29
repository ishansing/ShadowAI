# TODO

1. Multi-Provider Routing & Resiliency (Gateway)
   Currently, the gateway is hardcoded to route everything to Google
   Gemini (@ai-sdk/google).
   - Dynamic Provider Selection: Update the proxy route to inspect the
     incoming model string (e.g., gpt-4o, claude-3-5-sonnet) and
     dynamically instantiate the correct Vercel AI SDK provider (OpenAI,
     Anthropic, Mistral).
   - Fallbacks & Load Balancing: If Gemini goes down or hits a rate
     limit, the Gateway should automatically intercept the error and
     silently retry the prompt against a fallback model (e.g., OpenAI)
     without the end-user noticing.

2. Performance & Caching (Database & Redis)

- Policy Caching (High Priority): Right now, the Gateway runs a
  db.select() to fetch the DLP policy on every single chat request.
  Because we already have Upstash Redis running for rate-limiting, we
  should cache the user's policy in Redis. We only need to query
  Postgres when the cache is empty, and we invalidate the cache when
  the Admin toggles a setting in the UI.
- Semantic Caching: Cache the actual AI responses. If two employees
  ask the exact same generic question within an hour, serve the
  response from Redis instead of hitting the AI API. This drastically
  reduces API bills and cuts response latency to <50ms.

1. Dashboard Features (Frontend UX)

- Revoke API Keys: The /keys page currently allows generating and
  viewing keys, but lacks a "Delete" or "Revoke" button. You need a
  DELETE /api/keys/:id route in Hono and a trash can icon in the UI.
- Pagination & Filtering: The /api/logs endpoint is hardcoded with
  .limit(50). You will need to implement infinite scrolling or
  pagination on the frontend, and add server-side filtering (e.g.,
  "Show me only logs where wasRedacted is true").
- Cost Analytics: Vercel's AI SDK returns token usage data. You
  should save promptTokens and completionTokens to the audit_logs
  table, then use Shadcn's charting library (Recharts) to show admins
  a graph of their daily API costs.

1. Advanced Security & Compliance

- Beyond Regex for PII: Regex is great for SSNs and Credit Cards, but
  terrible at finding contextual PII (like a person's name or a
  secret project codename). You could integrate a lightweight local
  NLP library (like Microsoft Presidio) to catch unstructured
  sensitive data.
- Data Retention Cron Job: To comply with GDPR/CCPA, you shouldn't
  store chat logs indefinitely. Add a background job (using Bun's
  built-in Cron) to delete or fully anonymize audit_logs older than
  30 or 90 days.

1. Production Deployment (DevOps)

- Dockerization: We have docker-compose.yml for local dependencies,
  but you need actual Dockerfiles to containerize the apps/gateway
  (Bun runtime) and apps/web (Nginx serving static Vite files) so
  they can be deployed to AWS, Fly.io, or Railway.
- Migration Management: During local dev, we used drizzle-kit push.
  For production, you must switch to generating SQL migration files
  (drizzle-kit generate) and running them via a structured migration
  runner to prevent accidental data loss.
