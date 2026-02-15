import { scanAndRedact } from "./src/pii";

const sensitiveInput =
  "Hey, my email is boss@company.com and my API key is sk-1234567890abcdef1234567890abcdef.";

const result = scanAndRedact(sensitiveInput);

console.log("--- ORIGINAL ---");
console.log(result.original);
console.log("\n--- REDACTED ---");
console.log(result.redacted);
console.log("\n--- FOUND ---");
console.log(result.matches.map((m) => m.type));
console.log("Risk Score:", result.riskScore);
