CREATE TABLE IF NOT EXISTS "sms_opt_in" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"business" text,
	"email" text NOT NULL,
	"phone" text,
	"message" text,
	"sms_consent" boolean DEFAULT false NOT NULL,
	"consent_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
