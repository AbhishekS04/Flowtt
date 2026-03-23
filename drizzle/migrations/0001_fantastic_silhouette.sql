CREATE TABLE IF NOT EXISTS "incomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"source" text NOT NULL,
	"date" date NOT NULL,
	"note" text,
	"payment_method" text DEFAULT 'online' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "payment_method" text DEFAULT 'online' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "initial_cash_balance" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "initial_online_balance" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "incomes" ADD CONSTRAINT "incomes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
