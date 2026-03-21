# Shadow AI Gateway

A high-performance, edge-ready AI proxy built with **Bun**, **Hono**, and the **Vercel AI SDK**. It provides automatic PII (Personally Identifiable Information) detection, granular security policies, and programmatic access via Virtual API Keys.

## Architecture

```mermaid
graph TD
    Client[Employees / Chat Apps] -->|sk-shadow-xxx| Gateway
    Client -->|Browser Session| Gateway
    
    subgraph "Data Plane (Gateway)"
        Gateway[Hono Proxy]
        Auth[Dual Auth: API Keys + Better Auth]
        Limit[Upstash Rate Limiting]
        DLP[PII Redaction Engine]
        Policy[Granular Policy Check]
        
        Gateway --> Auth
        Auth --> Limit
        Limit --> Policy
        Policy --> DLP
    end
    
    DLP -->|Redacted Prompt| Gemini[Google Gemini 2.5 Flash]
    
    subgraph "Control Plane (Dashboard)"
        Dashboard[Vite + TanStack Router]
        RPC[Hono RPC Client]
        Dashboard --> RPC
    end
    
    RPC -->|Manage Keys / Policies| Gateway
    Gateway -->|Async Audit Log| Postgres[(PostgreSQL)]
    Limit -->|Window State| Redis[(Local Redis Proxy)]
```

## Features

- **PII Redaction:** Automatically detects and masks Emails, API Keys, Phone Numbers, Credit Cards, SSNs, and IP Addresses.
- **Granular DLP Policies:** Admins can toggle specific redaction rules (e.g., allow Emails for Marketing, block for Devs).
- **Virtual API Keys:** Generate `sk-shadow-...` keys for programmatic access in IDEs (Cursor) or CLI tools.
- **Dual Authentication:** Supports both Better Auth (browser sessions) and Bearer Token (API keys).
- **Edge-Ready Rate Limiting:** Powered by Upstash Redis with a local SRH Docker proxy for offline development.
- **Type-Safe RPC:** End-to-end type safety between Gateway and Dashboard using Hono RPC.
- **Audit Logging:** Non-blocking, asynchronous logging of all violations to PostgreSQL.

## Project Structure

- `apps/gateway`: Hono-based proxy server.
- `apps/web`: Vite + React SPA dashboard.
- `packages/core`: PII engine and shared business logic.
- `packages/db`: Drizzle ORM schema and migrations.
- `packages/auth`: Shared Better Auth configuration.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) installed.
- Docker (for Postgres and Redis).
- Google Gemini API Key.

### 1. Setup Infrastructure
```bash
docker compose up -d
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Environment Configuration
Create a `.env` in `apps/gateway/`:
```bash
DATABASE_URL="postgresql://shadow_admin:shadow_password@localhost:5432/shadow_ai"
GOOGLE_GENERATIVE_AI_API_KEY="your_key"
BETTER_AUTH_URL="http://localhost:3000"
UPSTASH_REDIS_REST_URL="http://localhost:8079"
UPSTASH_REDIS_REST_TOKEN="local_dev_token"
```

### 4. Run the Stack
```bash
# Start Gateway (Port 3000) and Web Dashboard (Port 3001)
bun run dev
```

## Testing

### Automated Integration Tests
```bash
cd apps/gateway && bun test
```

### Manual Rate Limit Test
```bash
./apps/gateway/tests/test_ratelimit.sh sk-shadow-YOUR_KEY
```

## API Usage

**Endpoint:** `POST /v1/chat/completions`  
**Auth:** `Authorization: Bearer sk-shadow-xxx`

```json
{
  "model": "gemini-2.5-flash",
  "messages": [
    { "role": "user", "content": "My email is test@example.com" }
  ]
}
```
