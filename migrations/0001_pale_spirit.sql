ALTER TABLE "organization" ADD COLUMN "plan" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "subscription_status" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "token_balance" integer DEFAULT 100 NOT NULL;