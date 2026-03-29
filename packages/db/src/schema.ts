import {
  pgTable,
  uuid,
  text,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  userEmail: text("user_email").notNull(),
  prompt: text("prompt").notNull(),
  wasRedacted: boolean("was_redacted").default(false).notNull(),
  // Store the array of redacted types (e.g., ["EMAIL", "CREDIT_CARD"])
  redactedFields: jsonb("redacted_fields")
    .$type<string[]>()
    .default([])
    .notNull(),
  provider: text("provider").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // Links to the Admin who created it
  name: text("name").notNull(),      // e.g., "Cursor IDE Key", "Marketing Team"
  key: text("key").notNull().unique(), // The actual sk-shadow-... key
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const policies = pgTable("policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(), // One policy profile per Admin/Workspace
  blockEmails: boolean("block_emails").default(true).notNull(),
  blockCreditCards: boolean("block_credit_cards").default(true).notNull(),
  blockSSN: boolean("block_ssn").default(true).notNull(),
  blockApiKeys: boolean("block_api_keys").default(true).notNull(),
  blockPhones: boolean("block_phones").default(false).notNull(),
  ruleActions: jsonb("rule_actions")
    .$type<Record<string, "redact" | "block">>()
    .default({})
    .notNull(),
  overrides: jsonb("overrides")
    .$type<Array<{ role: string; type: string }>>()
    .default([])
    .notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export * from "./auth-schema";

