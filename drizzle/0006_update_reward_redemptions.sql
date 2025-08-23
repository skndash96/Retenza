DROP TABLE IF EXISTS "reward_redemptions";

CREATE TABLE IF NOT EXISTS "reward_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"reward_id" text NOT NULL,
	"reward_type" varchar(50) NOT NULL,
	"reward_value" integer NOT NULL,
	"transaction_id" integer NOT NULL,
	"redeemed_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "reward_redemptions_customer_business_idx" ON "reward_redemptions" ("customer_id", "business_id");
CREATE INDEX IF NOT EXISTS "reward_redemptions_reward_id_idx" ON "reward_redemptions" ("reward_id");
CREATE INDEX IF NOT EXISTS "reward_redemptions_transaction_id_idx" ON "reward_redemptions" ("transaction_id");
CREATE INDEX IF NOT EXISTS "reward_redemptions_redeemed_at_idx" ON "reward_redemptions" ("redeemed_at");