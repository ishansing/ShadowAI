CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"user_email" text NOT NULL,
	"prompt" text NOT NULL,
	"was_redacted" boolean DEFAULT false NOT NULL,
	"redacted_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"provider" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
