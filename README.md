# Shadow AI Gateway

A high-performance, edge-ready AI proxy built with **Bun**, **Hono**, and the **Vercel AI SDK**. It provides automatic PII (Personally Identifiable Information) detection and redaction to ensure secure LLM interactions.

## Project Structure

- `apps/gateway`: The Hono-based proxy server (Data Plane).
- `packages/core`: Shared library containing the PII redaction engine and audit logging types.
- `apps/web`: (Planned) Control Plane dashboard.

## Features

- **PII Redaction:** Automatically detects and masks Emails, API Keys, Phone Numbers, Credit Cards, SSNs, and IP Addresses.
- **Provider Agnostic:** Powered by Vercel AI SDK (defaulting to Google Gemini).
- **Audit Logging:** Logs all requests, detections, and redaction status (Async/Non-blocking).
- **Edge Ready:** Built on Hono for deployment to Bun, Cloudflare Workers, or AWS Lambda.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed (v1.1.0 or higher recommended).
- A Google Generative AI (Gemini) API Key.

### Installation

```bash
# Install dependencies for all workspaces
bun install
```

### Environment Setup

Create a `.env` file in `apps/gateway/` (or set in your shell):

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

### Running the Gateway

```bash
# Start the gateway in development mode
bun run dev
```
The server will start on `http://localhost:3000`.

## Testing

### Automated Tests (Integration)
We use `bun:test` for integration testing of the core engine and the gateway routes.

```bash
# Run tests from the gateway directory
cd apps/gateway
bun test
```

### Manual Tests (CURL)
A script is provided to test the gateway's response and redaction logic manually.

```bash
# Run the manual test suite (requires server to be running)
./apps/gateway/tests/manual_test.sh
```

## API Usage

The gateway mimics the OpenAI-compatible chat completion format:

**Endpoint:** `POST /v1/chat/completions`

**Example Request:**
```json
{
  "model": "gemini-1.5-flash",
  "messages": [
    { "role": "user", "content": "My email is test@example.com" }
  ]
}
```
*Note: The email will be redacted before being sent to the LLM.*
