import { db, user, auditLogs } from "../src/index";
import { desc } from "drizzle-orm";

console.log("--- CHECKING REGISTERED USERS ---");
const users = await db.select().from(user);
console.log(JSON.stringify(users, null, 2));

console.log("\n--- CHECKING LATEST AUDIT LOGS ---");
const logs = await db
  .select()
  .from(auditLogs)
  .orderBy(desc(auditLogs.timestamp))
  .limit(2);
console.log(JSON.stringify(logs, null, 2));

process.exit(0);
