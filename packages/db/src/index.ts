import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// We will pass the DB URL from the apps using this package
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://shadow_admin:shadow_password@127.0.0.1:5432/shadow_ai";

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export * from "./schema";
