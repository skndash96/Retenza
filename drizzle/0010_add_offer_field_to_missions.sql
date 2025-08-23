-- Rename campaigns table to missions
ALTER TABLE "campaigns" RENAME TO "missions";

-- Add missing columns to missions table
ALTER TABLE "missions" 
ADD COLUMN "offer" TEXT NOT NULL DEFAULT 'Special reward for completing this mission',
ADD COLUMN "filters" JSONB DEFAULT '{}',
ADD COLUMN "is_active" BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN "updated_at" TIMESTAMP DEFAULT now() NOT NULL;

-- Update existing records to have proper default values
UPDATE "missions" 
SET "offer" = 'Special reward for completing this mission',
    "filters" = '{}',
    "is_active" = true,
    "updated_at" = now()
WHERE "offer" IS NULL OR "filters" IS NULL OR "is_active" IS NULL OR "updated_at" IS NULL;

-- Add comment for the offer field
COMMENT ON COLUMN "missions"."offer" IS 'Description of what the mission offers (e.g., cashback, discount, free item)';