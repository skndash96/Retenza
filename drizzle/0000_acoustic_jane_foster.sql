CREATE TABLE "businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"hashed_password" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"business_type" varchar(50),
	"contact_number_1" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"applicable_tiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_loyalty" (
	"customer_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"current_tier_name" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_loyalty_customer_id_business_id_pk" PRIMARY KEY("customer_id","business_id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
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
CREATE TABLE "loyalty_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"points_rate" integer DEFAULT 1 NOT NULL,
	"tiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "loyalty_programs_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"bill_amount" integer NOT NULL,
	"points_awarded" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
