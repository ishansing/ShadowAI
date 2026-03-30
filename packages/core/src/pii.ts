import { z } from "zod";

// Define the shape of our findings
export const PiiTypeSchema = z.enum([
  "API_KEY", // Important for developers!
  "EMAIL",
  "PHONE",
  "CREDIT_CARD",
  "SSN",
  "IPV4",
]);

export type PiiType = z.infer<typeof PiiTypeSchema>;

export interface PiiMatch {
  type: PiiType;
  value: string;
  index: number;
}

export interface RedactionResult {
  original: string;
  redacted: string;
  matches: PiiMatch[];
  wasRedacted: boolean;
  riskScore: number; // 0-100
  shouldBlock: boolean; // True if any match has a 'block' action
}

// ------------------------------------------------------------------
// THE PATTERNS (The Secret Sauce)
// ------------------------------------------------------------------
const PATTERNS: Record<PiiType, RegExp> = {
  // 1. API Keys (Specific prefixes like sk-, gh-, aws-)
  API_KEY: /(sk-[a-zA-Z0-9]{20,}|gh[pousr]-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16})/g,

  // 2. Credit Cards (Luhn-like 13-19 digits, requires word boundaries)
  CREDIT_CARD: /\b(?:\d[ -]*?){13,19}\b/g,

  // 3. Emails (Standard)
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // 4. SSN (Strict format XXX-XX-XXXX)
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,

  // 5. IP Addresses
  IPV4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,

  // 6. Phone Numbers (Improved: Requires at least 1 separator or specific format)
  // Matches: 123-456-7890, (123) 456-7890, +1-123-456-7890
  // Does NOT match: 1234567890 (raw string of numbers)
  PHONE: /(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g,
};

export interface PolicyConfig {
  blockEmails: boolean;
  blockCreditCards: boolean;
  blockSSN: boolean;
  blockApiKeys: boolean;
  blockPhones: boolean;
  ruleActions?: Record<string, "redact" | "block">;
}

// Default strict policy
export const defaultPolicy: PolicyConfig = {
  blockEmails: true,
  blockCreditCards: true,
  blockSSN: true,
  blockApiKeys: true,
  blockPhones: true,
  ruleActions: {},
};

// ------------------------------------------------------------------
// THE ENGINE
// ------------------------------------------------------------------
export function scanAndRedact(
  text: string,
  policy: PolicyConfig = defaultPolicy,
): RedactionResult {
  let redactedText = text;
  const matches: PiiMatch[] = [];
  let riskScore = 0;
  let shouldBlock = false;

  // Map the policy flags to our PII types
  const activeTypes = new Set<string>();
  if (policy.blockApiKeys) activeTypes.add("API_KEY");
  if (policy.blockCreditCards) activeTypes.add("CREDIT_CARD");
  if (policy.blockEmails) activeTypes.add("EMAIL");
  if (policy.blockSSN) activeTypes.add("SSN");
  if (policy.blockPhones) activeTypes.add("PHONE");

  // Iterate over each PII type
  for (const [type, regex] of Object.entries(PATTERNS)) {
    // Only scan if the policy says we should block this type!
    if (!activeTypes.has(type)) continue;

    // Reset regex state
    regex.lastIndex = 0;


    const found = text.match(regex);

    if (found) {
      // Check if this specific type is set to 'block'
      const action = policy.ruleActions?.[type] || "redact";
      if (action === "block") {
        shouldBlock = true;
      }

      // Calculate risk (arbitrary weights)
      const weight = type === "CREDIT_CARD" || type === "API_KEY" ? 30 : 10;
      riskScore += found.length * weight;

      // Replace in text
      // We use a replacement function to handle multiple matches correctly
      redactedText = redactedText.replace(regex, (match) => {
        // Log the match (but don't store the value in DB later!)
        matches.push({
          type: type as PiiType,
          value: match, // We keep this here for debugging, but will strip it before logging
          index: 0, // Simplification for now
        });
        return `[REDACTED_${type}]`;
      });
    }
  }

  return {
    original: text,
    redacted: redactedText,
    matches,
    wasRedacted: matches.length > 0,
    riskScore: Math.min(riskScore, 100),
    shouldBlock,
  };
}
