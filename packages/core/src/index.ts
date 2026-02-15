export * from "./pii"; // Export everything from pii.ts

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  prompt: string;
  wasRedacted: boolean;
  redactedFields: string[]; // e.g. ["EMAIL", "PHONE"]
  provider: "openai" | "anthropic";
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface RedactionResult {
  original: string;
  redacted: string;
  foundPII: boolean;
  piiTypes: string[];
}
