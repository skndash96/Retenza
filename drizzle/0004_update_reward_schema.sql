-- Update reward schema: remove time_window, add usage_limit_per_month
-- This migration updates the existing loyalty program tiers to use the new reward structure

-- First, let's create a function to update existing JSONB data
CREATE OR REPLACE FUNCTION update_reward_schema()
RETURNS void AS $$
DECLARE
    business_record RECORD;
    tier_record RECORD;
    updated_tiers JSONB;
    updated_rewards JSONB;
    reward_record RECORD;
BEGIN
    -- Loop through all businesses with loyalty programs
    FOR business_record IN 
        SELECT id FROM businesses 
        WHERE id IN (SELECT business_id FROM loyalty_programs)
    LOOP
        -- Get current tiers for this business
        SELECT tiers INTO tier_record.tiers 
        FROM loyalty_programs 
        WHERE business_id = business_record.id;
        
        IF tier_record.tiers IS NOT NULL AND jsonb_array_length(tier_record.tiers) > 0 THEN
            updated_tiers := '[]'::jsonb;
            
            -- Loop through each tier
            FOR i IN 0..jsonb_array_length(tier_record.tiers) - 1 LOOP
                tier_record := tier_record.tiers->i;
                updated_rewards := '[]'::jsonb;
                
                -- Loop through each reward in the tier
                IF tier_record->'rewards' IS NOT NULL AND jsonb_array_length(tier_record->'rewards') > 0 THEN
                    FOR j IN 0..jsonb_array_length(tier_record->'rewards') - 1 LOOP
                        reward_record := tier_record->'rewards'->j;
                        
                        -- Create updated reward structure
                        IF reward_record->>'reward_type' = 'limited_usage' THEN
                            -- For limited_usage rewards, remove time_window and add usage_limit_per_month
                            updated_rewards := updated_rewards || jsonb_build_object(
                                'id', reward_record->'id',
                                'reward_type', reward_record->>'reward_type',
                                'reward_text', reward_record->'reward_text',
                                'percentage', reward_record->'percentage',
                                'usage_limit', reward_record->'usage_limit',
                                'usage_limit_per_month', 1.0, -- Default to monthly
                                'one_time', reward_record->'one_time'
                            );
                        ELSIF reward_record->>'reward_type' = 'cashback' THEN
                            -- For cashback rewards, keep existing structure
                            updated_rewards := updated_rewards || jsonb_build_object(
                                'id', reward_record->'id',
                                'reward_type', reward_record->>'reward_type',
                                'percentage', reward_record->'percentage'
                            );
                        ELSIF reward_record->>'reward_type' = 'custom' THEN
                            -- For custom rewards, keep existing structure
                            updated_rewards := updated_rewards || jsonb_build_object(
                                'id', reward_record->'id',
                                'reward_type', reward_record->>'reward_type',
                                'name', reward_record->'name',
                                'reward', reward_record->'reward'
                            );
                        END IF;
                    END LOOP;
                END IF;
                
                -- Create updated tier with updated rewards
                updated_tiers := updated_tiers || jsonb_build_object(
                    'id', tier_record->'id',
                    'name', tier_record->>'name',
                    'points_to_unlock', tier_record->'points_to_unlock',
                    'rewards', updated_rewards
                );
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
SELECT update_reward_schema();

-- Drop the function after use
DROP FUNCTION update_reward_schema();

-- Add comment to explain the new structure
COMMENT ON COLUMN loyalty_programs.tiers IS 'JSONB array of tiers with rewards. Limited usage rewards now use usage_limit_per_month instead of time_window.'; 