import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@shadow/db";
import * as schema from "@shadow/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [
    "http://localhost:3001", // Next.js Dashboard
  ],
  emailAndPassword: {
    enabled: true,
  },
});

// Export the inferred types for use in Hono context
export type AuthUser = typeof auth.$Infer.Session.user;
export type AuthSession = typeof auth.$Infer.Session.session;
