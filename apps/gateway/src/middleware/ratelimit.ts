import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { Context, Next } from "hono";

// 1. Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 2. Configure the Rate Limiter Algorithm
// We allow 5 requests per 1 minute per API Key using a sliding window
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), 
  analytics: true, 
  prefix: "shadow_ai_ratelimit",
});

export const rateLimitMiddleware = async (c: Context, next: Next) => {
  // We identify the user by the ID injected during the Auth phase
  const user = c.get('user');
  
  // If there's no user, fallback to IP address (for unauthenticated routes if any)
  const identifier = user?.id || c.req.header('x-forwarded-for') || "anonymous";

  // 3. Check the limit
  const { success, pending, limit, remaining, reset } = await ratelimit.limit(identifier);
  
  console.log(`[RateLimit] User: ${identifier}, Success: ${success}, Remaining: ${remaining}`);

  // 4. Attach standard rate limit headers to the response
  c.header('X-RateLimit-Limit', limit.toString());
  c.header('X-RateLimit-Remaining', remaining.toString());
  c.header('X-RateLimit-Reset', reset.toString());

  // 5. Block the request if limit is exceeded
  if (!success) {
    console.warn(`[RATE LIMIT] Blocked user: ${identifier}`);
    return c.json({ 
      error: "Too Many Requests", 
      message: "You have exceeded your API quota. Please try again later." 
    }, 429);
  }

  // 6. Proceed to the next middleware/route
  await next();
};
