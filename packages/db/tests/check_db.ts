import { db, auditLogs } from "../src/index";
import { desc } from "drizzle-orm";

const latestLogs = await db
  .select()
  .from(auditLogs)
  .orderBy(desc(auditLogs.timestamp))
  .limit(1);

if (latestLogs.length > 0) {
  console.log(JSON.stringify(latestLogs[0], null, 2));
} else {
  console.log("No logs found in DB.");
}

process.exit(0);
