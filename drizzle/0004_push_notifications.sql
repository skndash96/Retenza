-- Migration: Add push notification tables
-- Created: 2024-01-01

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id" serial PRIMARY KEY,
    "customer_id" integer NOT NULL,
    "business_id" integer NOT NULL,
    "endpoint" text NOT NULL,
    "p256dh" text NOT NULL,
    "auth" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" serial PRIMARY KEY,
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "push_subscriptions_customer_business_idx" ON "push_subscriptions" ("customer_id", "business_id");
CREATE INDEX IF NOT EXISTS "push_subscriptions_endpoint_idx" ON "push_subscriptions" ("endpoint");
CREATE INDEX IF NOT EXISTS "notifications_customer_business_idx" ON "notifications" ("customer_id", "business_id");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" ("type");
CREATE INDEX IF NOT EXISTS "notifications_sent_at_idx" ON "notifications" ("sent_at");
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" ("is_read");

-- Add foreign key constraints
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION; 