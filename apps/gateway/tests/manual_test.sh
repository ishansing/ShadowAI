#!/bin/bash

# --- SHADOW AI GATEWAY MANUAL TEST SUITE ---
# Ensure the server is running (e.g., bun dev) before executing.
# Default PORT is 3000 unless changed in Hono config.

PORT=${1:-3000}
URL="http://localhost:$PORT/v1/chat/completions"

echo "Using Gateway URL: $URL"
echo "----------------------------------------"

# 1. Simple Prompt (No PII)
echo "TEST 1: Simple Prompt (No PII)"
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -N \
  -d '{
    "messages": [
      { "role": "user", "content": "What is the capital of France?" }
    ]
  }'

echo -e "\n\n----------------------------------------"

# 2. Prompt with PII (Triggers Redaction)
echo "TEST 2: Prompt with PII (Redaction Check)"
echo "Checking: My email is test@example.com and my secret key is sk-1234567890abcdef1234567890abcdef"
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -N \
  -d '{
    "messages": [
      { "role": "user", "content": "My email is test@example.com and my secret key is sk-1234567890abcdef1234567890abcdef" }
    ]
  }'

echo -e "\n\n----------------------------------------"

# 3. Custom Model Specification
echo "TEST 3: Custom Model (gemini-1.5-pro)"
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -N \
  -d '{
    "model": "gemini-1.5-pro",
    "messages": [
      { "role": "user", "content": "Write a 2-line poem about security." }
    ]
  }'

echo -e "\n\nTests Complete."
