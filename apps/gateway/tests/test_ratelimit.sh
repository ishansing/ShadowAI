#!/bin/bash

# Ensure the server is running and a valid API key is passed as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <sk-shadow-your-api-key>"
  exit 1
fi

API_KEY=$1
echo "Testing Rate Limits with API Key: $API_KEY"
echo "----------------------------------------"

for i in {1..25}; do
  echo -n "Request $i: "
  curl -X POST http://localhost:3000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d '{
      "model": "gemini-2.5-flash",
      "messages": [{"role": "user", "content": "Hello"}]
    }' \
    -w " - HTTP %{http_code}\n" -s -o /dev/null
done

echo "----------------------------------------"
echo "Test Complete. Requests 21-25 should have returned HTTP 429."
