import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: "http://localhost:8079",
  token: "local_dev_token",
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), 
  analytics: true, 
  prefix: "shadow_ai_ratelimit",
});

async function run() {
  for(let i=0; i<8; i++) {
    const res = await ratelimit.limit("test_user");
    console.log(`Req ${i+1}: success=${res.success} remaining=${res.remaining}`);
  }
}
run();
