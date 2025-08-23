-- Migration Verification Script
-- Run this after applying the production migration to verify it was successful

-- ====================================================================================
-- 1. Check if all required columns exist
-- ====================================================================================

SELECT 'Checking required columns...' as status;

-- Check customer_loyalty table
SELECT 
    'customer_loyalty' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'customer_loyalty' 
ORDER BY column_name;

-- Check missions table
SELECT 
    'missions' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'missions' 
ORDER BY column_name;

-- Check loyalty_programs table
SELECT 
    'loyalty_programs' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'loyalty_programs' 
ORDER BY column_name;

-- Check mission_registry table
SELECT 
    'mission_registry' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'mission_registry' 
ORDER BY column_name;

-- ====================================================================================
-- 2. Verify reward schema update
-- ====================================================================================

SELECT 'Checking reward schema...' as status;

-- Check if any rewards still have the old usage_limit field
SELECT 
    'Rewards with old usage_limit field' as check_type,
    COUNT(*) as count
FROM loyalty_programs,
LATERAL jsonb_array_elements(tiers) AS tier,
LATERAL jsonb_array_elements(tier->'rewards') AS reward
WHERE reward ? 'usage_limit';

-- Check if limited_usage rewards have usage_limit_per_month
SELECT 
    'Limited usage rewards with usage_limit_per_month' as check_type,
    COUNT(*) as count
FROM loyalty_programs,
LATERAL jsonb_array_elements(tiers) AS tier,
LATERAL jsonb_array_elements(tier->'rewards') AS reward
WHERE reward->>'reward_type' = 'limited_usage' 
  AND reward ? 'usage_limit_per_month';

-- ====================================================================================
-- 3. Sample data verification
-- ====================================================================================

SELECT 'Checking sample data...' as status;

-- Show sample tier structure
SELECT 
    business_id,
    jsonb_pretty(tiers) as sample_tiers
FROM loyalty_programs 
LIMIT 3;

-- Show sample customer loyalty data
SELECT 
    customer_id,
    business_id,
    points,
    redeemable_points,
    current_tier_name
FROM customer_loyalty 
LIMIT 5;

-- ====================================================================================
-- 4. Migration success indicators
-- ====================================================================================

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'customer_loyalty' AND column_name = 'redeemable_points'
        ) THEN '✅ redeemable_points column exists'
        ELSE '❌ redeemable_points column missing'
    END as check_redeemable_points,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'missions' AND column_name = 'updated_at'
        ) THEN '✅ missions.updated_at column exists'
        ELSE '❌ missions.updated_at column missing'
    END as check_missions_updated_at,
    
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM loyalty_programs,
            LATERAL jsonb_array_elements(tiers) AS tier,
            LATERAL jsonb_array_elements(tier->'rewards') AS reward
            WHERE reward ? 'usage_limit'
        ) THEN '✅ All rewards updated (no usage_limit field)'
        ELSE '❌ Some rewards still have usage_limit field'
    END as check_reward_schema;

-- ====================================================================================
-- Expected Results:
-- ====================================================================================
-- 1. All required columns should exist
-- 2. No rewards should have the old 'usage_limit' field
-- 3. All limited_usage rewards should have 'usage_limit_per_month'
-- 4. redeemable_points should be present in customer_loyalty
-- 5. All timestamp fields should be present 