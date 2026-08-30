ALTER TABLE "sms_opt_in" ADD COLUMN "marketing_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sms_opt_in" ADD COLUMN "marketing_consent_text" text;