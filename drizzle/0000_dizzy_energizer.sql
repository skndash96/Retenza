CREATE TABLE IF NOT EXISTS "businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"hashed_password" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"business_type" varchar(50),
	"description" text,
	"email" varchar(255),
	"contact_number" varchar(20),
	"contact_number_2" varchar(20),
	"gmap_link" varchar(500),
	"logo_url" varchar(500),
	"additional_info" jsonb DEFAULT '{}'::jsonb,
	"is_setup_complete" boolean DEFAULT false,
	"approved" boolean DEFAULT false NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_loyalty" (
	"customer_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"redeemable_points" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"current_tier_name" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_loyalty_customer_id_business_id_pk" PRIMARY KEY("customer_id","business_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"hashed_password" text NOT NULL,
	"name" text,
	"gender" varchar(10),
	"dob" timestamp,
	"anniversary" timestamp,
	"is_setup_complete" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"points_rate" integer DEFAULT 1 NOT NULL,
	"description" text,
	"tiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_programs_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mission_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"mission_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"discount_percentage" numeric(5, 2) DEFAULT '0',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"offer" text NOT NULL,
	"applicable_tiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"is_read" boolean DEFAULT false,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reward_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"reward_id" text NOT NULL,
	"reward_type" varchar(50) NOT NULL,
	"reward_value" numeric(10, 2) NOT NULL,
	"transaction_id" integer NOT NULL,
	"redeemed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"bill_amount" numeric(10, 2) NOT NULL,
	"points_awarded" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
