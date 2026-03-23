ALTER TABLE "recharges" ADD COLUMN "amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "recharges" ADD COLUMN "validity_days" integer DEFAULT 28 NOT NULL;