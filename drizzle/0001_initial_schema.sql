-- Initial Schema Migration
-- This creates all tables from scratch with proper structure matching your local DB
-- Updated to include latest changes: redeemable_points, new reward schema, etc.

-- ====================================================================================
-- A. User Tables (Phone/Password Auth)
-- ====================================================================================

CREATE TABLE "businesses" (
    "id" serial PRIMARY KEY NOT NULL,
    "phone_number" varchar(20) NOT NULL UNIQUE,
    "hashed_password" text NOT NULL,
    "name" text NOT NULL,
    "address" text,
    "business_type" varchar(50),
    "contact_number_2" varchar(20),
    "email" varchar(255),
    "is_setup_complete" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "description" text,
    "contact_number" varchar(20),
    "gmap_link" varchar(500),
    "logo_url" varchar(500),
    "additional_info" jsonb DEFAULT '{}',
    "user_id" integer NOT NULL
);

CREATE TABLE "customers" (
    "id" serial PRIMARY KEY NOT NULL,
    "phone_number" varchar(20) NOT NULL UNIQUE,
    "hashed_password" text NOT NULL,
    "name" text,
    "gender" varchar(10),
    "dob" timestamp,
    "anniversary" timestamp,
    "is_setup_complete" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ====================================================================================
-- B. Loyalty Program & Rewards
-- ====================================================================================

CREATE TABLE "loyalty_programs" (
    "id" serial PRIMARY KEY NOT NULL,
    "business_id" integer NOT NULL UNIQUE,
    "description" text,
    "tiers" jsonb DEFAULT '[]' NOT NULL,
    "points_rate" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Tiers JSONB Structure (Updated Schema):
-- Each tier contains:
-- {
--   "id": number,
--   "name": string,
--   "points_to_unlock": number,
--   "rewards": [
--     {
--       "id": number,
--       "reward_type": "cashback" | "limited_usage" | "custom",
--       "percentage": number,           // For cashback rewards
--       "reward_text": string,         // For limited_usage rewards
--       "usage_limit_per_month": number, // For limited_usage rewards (e.g., 2 = twice per month, 0.5 = bi-monthly)
--       "one_time": boolean,           // For limited_usage rewards
--       "name": string,                // For custom rewards
--       "reward": string               // For custom rewards
--     }
--   ]
-- }
-- 
-- Note: The old "usage_limit" field has been removed. Limited usage rewards now use
-- "usage_limit_per_month" to determine how many times they can be redeemed per month.

-- ====================================================================================
-- C. Customer Loyalty Status
-- ====================================================================================

CREATE TABLE "customer_loyalty" (
    "customer_id" integer NOT NULL,
    "business_id" integer NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "redeemable_points" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "current_tier_name" varchar(50),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    PRIMARY KEY ("customer_id", "business_id")
);

-- ====================================================================================
-- D. Missions & Campaigns
-- ====================================================================================

CREATE TABLE "missions" (
    "id" serial PRIMARY KEY NOT NULL,
    "business_id" integer NOT NULL,
    "title" text NOT NULL,
    "description" text NOT NULL,
    "applicable_tiers" jsonb DEFAULT '[]' NOT NULL,
    "filters" jsonb DEFAULT '{}',
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "expires_at" timestamp NOT NULL,
    "offer" text NOT NULL
);

-- ====================================================================================
-- E. Mission Registry (Customer Progress)
-- ====================================================================================

CREATE TABLE "mission_registry" (
    "id" serial PRIMARY KEY NOT NULL,
    "customer_id" integer NOT NULL,
    "mission_id" integer NOT NULL,
    "business_id" integer NOT NULL,
    "status" text DEFAULT 'in_progress' NOT NULL,
    "started_at" timestamp DEFAULT now(),
    "completed_at" timestamp,
    "discount_amount" numeric(10,2) DEFAULT 0,
    "discount_percentage" numeric(5,2) DEFAULT 0,
    "notes" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ====================================================================================
-- F. Transactions & Rewards
-- ====================================================================================

CREATE TABLE "transactions" (
    "id" serial PRIMARY KEY NOT NULL,
    "customer_id" integer NOT NULL,
    "business_id" integer NOT NULL,
    "bill_amount" numeric(10,2) NOT NULL,
    "points_awarded" integer NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "reward_redemptions" (
    "id" serial PRIMARY KEY NOT NULL,
    "customer_id" integer NOT NULL,
    "business_id" integer NOT NULL,
    "reward_id" text NOT NULL,
    "reward_type" varchar(50) NOT NULL,
    "reward_value" numeric(10,2) NOT NULL,
    "redeemed_at" timestamp DEFAULT now() NOT NULL,
    "transaction_id" integer NOT NULL
);

-- ====================================================================================
-- G. Sessions & Authentication
-- ====================================================================================

CREATE TABLE "sessions" (
    "id" varchar(255) PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "role" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL
);

-- ====================================================================================
-- H. Push Notifications
-- ====================================================================================

CREATE TABLE "push_subscriptions" (
    "id" serial PRIMARY KEY NOT NULL,
    "customer_id" integer NOT NULL,
    "business_id" integer NOT NULL,
    "endpoint" text NOT NULL,
    "p256dh" text NOT NULL,
    "auth" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "notifications" (
    "id" serial PRIMARY KEY NOT NULL,
    "customer_id" integer NOT NULL,
    "business_id" integer NOT NULL,
    "type" varchar(50) NOT NULL,
    "title" text NOT NULL,
    "body" text NOT NULL,
    "data" jsonb DEFAULT '{}',
    "is_read" boolean DEFAULT false,
    "sent_at" timestamp DEFAULT now() NOT NULL,
    "read_at" timestamp
);

-- ====================================================================================
-- I. Foreign Key Constraints
-- ====================================================================================

-- Loyalty Programs
ALTER TABLE "loyalty_programs" ADD CONSTRAINT "loyalty_programs_business_id_fkey" 
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;

-- Customer Loyalty
ALTER TABLE "customer_loyalty" ADD CONSTRAINT "customer_loyalty_customer_id_fkey" 
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;
ALTER TABLE "customer_loyalty" ADD CONSTRAINT "customer_loyalty_business_id_fkey" 
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;

-- Missions
ALTER TABLE "missions" ADD CONSTRAINT "missions_business_id_fkey" 
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;

-- Mission Registry
ALTER TABLE "mission_registry" ADD CONSTRAINT "mission_registry_customer_id_fkey" 
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;
ALTER TABLE "mission_registry" ADD CONSTRAINT "mission_registry_mission_id_fkey" 
    FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE;
ALTER TABLE "mission_registry" ADD CONSTRAINT "mission_registry_business_id_fkey" 
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;

-- Transactions
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_fkey" 
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_business_id_fkey" 
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;

-- Reward Redemptions
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_customer_id_fkey" 
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_business_id_fkey" 
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;

-- Push Subscriptions
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_customer_id_fkey" 
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_business_id_fkey" 
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;

-- Notifications
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_id_fkey" 
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_fkey" 
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;

-- ====================================================================================
-- J. Indexes for Performance
-- ====================================================================================

CREATE INDEX "idx_businesses_phone_number" ON "businesses"("phone_number");
CREATE INDEX "idx_customers_phone_number" ON "customers"("phone_number");
CREATE INDEX "idx_mission_registry_customer_business" ON "mission_registry"("customer_id", "business_id");
CREATE INDEX "idx_mission_registry_status" ON "mission_registry"("status");
CREATE INDEX "idx_transactions_customer_business" ON "transactions"("customer_id", "business_id");
CREATE INDEX "idx_notifications_customer_business" ON "notifications"("customer_id", "business_id");
CREATE INDEX "idx_push_subscriptions_customer_business" ON "push_subscriptions"("customer_id", "business_id"); 