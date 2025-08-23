-- Production Schema Update Migration
-- Run this script on your production database to update it to the latest schema
-- This script handles the transition from the old reward schema to the new one

-- ====================================================================================
-- 1. Add missing columns to existing tables (if they don't exist)
-- ====================================================================================

-- Add redeemable_points to customer_loyalty if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customer_loyalty' AND column_name = 'redeemable_points'
    ) THEN
        ALTER TABLE "customer_loyalty" ADD COLUMN "redeemable_points" numeric(10,2) DEFAULT 0.00 NOT NULL;
    END IF;
END $$;

-- Add missing timestamp fields to missions if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'missions' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE "missions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
    END IF;
END $$;

-- Add missing timestamp fields to loyalty_programs if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loyalty_programs' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE "loyalty_programs" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loyalty_programs' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE "loyalty_programs" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
    END IF;
END $$;

-- Add missing timestamp fields to mission_registry if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mission_registry' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE "mission_registry" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mission_registry' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE "mission_registry" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
    END IF;
END $$;

-- ====================================================================================
-- 2. Update existing loyalty program tiers to remove usage_limit field
-- ====================================================================================

-- Function to update existing reward schema
CREATE OR REPLACE FUNCTION update_reward_schema_to_latest()
RETURNS void AS $$
DECLARE
    business_record RECORD;
    tier_record JSONB;
    updated_tiers JSONB;
    updated_rewards JSONB;
    reward_record JSONB;
    i INTEGER;
    j INTEGER;
BEGIN
    -- Loop through all businesses with loyalty programs
    FOR business_record IN
        SELECT id FROM businesses
        WHERE id IN (SELECT business_id FROM loyalty_programs)
    LOOP
        -- Get current tiers for this business
        SELECT tiers INTO updated_tiers
        FROM loyalty_programs
        WHERE business_id = business_record.id;

        IF updated_tiers IS NOT NULL AND jsonb_array_length(updated_tiers) > 0 THEN
            -- Create new tiers array
            updated_tiers := '[]'::jsonb;

            -- Loop through each tier
            FOR i IN 0..jsonb_array_length(updated_tiers) - 1 LOOP
                tier_record := updated_tiers->i;
                updated_rewards := '[]'::jsonb;

                -- Loop through each reward in the tier
                IF tier_record->'rewards' IS NOT NULL AND jsonb_array_length(tier_record->'rewards') > 0 THEN
                    FOR j IN 0..jsonb_array_length(tier_record->'rewards') - 1 LOOP
                        reward_record := tier_record->'rewards'->j;

                        -- Remove 'usage_limit' field if it exists
                        IF reward_record ? 'usage_limit' THEN
                            reward_record := reward_record - 'usage_limit';
                        END IF;

                        -- Ensure reward has proper structure
                        IF reward_record->>'reward_type' = 'limited_usage' THEN
                            -- Ensure limited_usage rewards have usage_limit_per_month
                            IF NOT (reward_record ? 'usage_limit_per_month') THEN
                                reward_record := jsonb_set(reward_record, '{usage_limit_per_month}', '1');
                            END IF;
                        END IF;

                        updated_rewards := updated_rewards || reward_record;
                    END LOOP;
                END IF;

                -- Update the tier with modified rewards
                tier_record := jsonb_set(tier_record, '{rewards}', updated_rewards);
                updated_tiers := updated_tiers || tier_record;
            END LOOP;

            -- Update the business's loyalty program with new tier structure
            UPDATE loyalty_programs
            SET tiers = updated_tiers
            WHERE business_id = business_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to update all existing data
SELECT update_reward_schema_to_latest();

-- Drop the function after use
DROP FUNCTION update_reward_schema_to_latest();

-- ====================================================================================
-- 3. Add comments to explain the new structure
-- ====================================================================================

COMMENT ON COLUMN loyalty_programs.tiers IS 'JSONB array of tiers with rewards. Limited usage rewards use usage_limit_per_month instead of the old usage_limit field.';
COMMENT ON COLUMN customer_loyalty.redeemable_points IS 'Points earned from cashback rewards that can be redeemed as discounts on future visits.';

-- ====================================================================================
-- 4. Verify the update was successful
-- ====================================================================================

-- Check if any loyalty programs still have the old usage_limit field
SELECT 
    business_id,
    COUNT(*) as rewards_with_old_field
FROM loyalty_programs,
LATERAL jsonb_array_elements(tiers) AS tier,
LATERAL jsonb_array_elements(tier->'rewards') AS reward
WHERE reward ? 'usage_limit'
GROUP BY business_id;

-- If the above query returns any results, the migration needs to be re-run
-- If it returns no results, the migration was successful 