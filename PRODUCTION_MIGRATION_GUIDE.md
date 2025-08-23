# Production Migration Guide

## Overview
This guide will help you update your production database to match the latest schema changes without requiring a full database reset.

## What's Changed
1. **Removed `usage_limit` field** from reward schema
2. **Added `usage_limit_per_month`** for monthly-based usage tracking
3. **Added `redeemable_points`** column for cashback accumulation
4. **Added missing timestamp fields** to various tables
5. **Updated reward structure** to be more flexible and user-friendly

## Migration Files

### 1. Main Migration Script: `drizzle/0006_production_update_schema.sql`
This script will:
- Add missing columns safely (only if they don't exist)
- Update existing reward data to remove old `usage_limit` field
- Ensure all limited usage rewards have `usage_limit_per_month`
- Add proper database comments

### 2. Verification Script: `drizzle/verify_migration.sql`
Run this after migration to verify everything was updated correctly.

## How to Run the Migration

### Option 1: Using psql (Recommended)
```bash
# Connect to your production database
psql -h your_host -U your_username -d your_database_name -f drizzle/0006_production_update_schema.sql
```

### Option 2: Using pgAdmin or other GUI tool
1. Open the `0006_production_update_schema.sql` file
2. Copy all contents
3. Paste into your database query tool
4. Execute the script

### Option 3: Using your deployment pipeline
If you have automated database migrations, add this script to your pipeline.

## What the Migration Does

### Phase 1: Add Missing Columns
- Adds `redeemable_points` to `customer_loyalty` table
- Adds `updated_at` to `missions` table
- Adds `created_at` and `updated_at` to `loyalty_programs` table
- Adds `created_at` and `updated_at` to `mission_registry` table

### Phase 2: Update Reward Schema
- Removes the old `usage_limit` field from all rewards
- Ensures limited usage rewards have `usage_limit_per_month`
- Preserves all other reward data
- Updates the JSONB structure in-place

### Phase 3: Verification
- Adds helpful comments to the database
- Provides verification queries

## After Migration

### 1. Verify the Migration
```bash
psql -h your_host -U your_username -d your_database_name -f drizzle/verify_migration.sql
```

### 2. Check for Success Indicators
- ✅ All required columns should exist
- ✅ No rewards should have the old `usage_limit` field
- ✅ All limited usage rewards should have `usage_limit_per_month`
- ✅ `redeemable_points` should be present in `customer_loyalty`
- ✅ All timestamp fields should be present

### 3. Test the System
- Test creating new loyalty programs
- Test adding rewards with the new schema
- Test customer transactions and reward redemptions
- Verify monthly usage tracking works

## Rollback Plan (If Needed)

If something goes wrong, you can restore from your backup. The migration is designed to be safe, but always have a backup before running migrations.

## Expected Results

After successful migration:
1. **Limited Usage Rewards**: Can be redeemed up to `usage_limit_per_month` times per month
2. **Cashback Rewards**: Accumulate points in `redeemable_points` for future redemption
3. **Monthly Tracking**: System automatically tracks and enforces monthly usage limits
4. **Flexible Rewards**: Rewards can be any type (free items, services, discounts)

## Support

If you encounter any issues during migration:
1. Check the verification script output
2. Review the database logs
3. Ensure you have proper database permissions
4. Verify your database version supports all SQL features used

## Example Reward Structure After Migration

```json
{
  "id": 1,
  "name": "Silver Tier",
  "points_to_unlock": 1000,
  "rewards": [
    {
      "id": 101,
      "reward_type": "cashback",
      "percentage": 5
    },
    {
      "id": 102,
      "reward_type": "limited_usage",
      "reward_text": "Free coffee",
      "usage_limit_per_month": 2,
      "one_time": false
    }
  ]
}
```

## Important Notes

- **No data loss**: All existing data is preserved
- **Backward compatible**: New system works with existing data
- **Safe migration**: Uses conditional column addition
- **Verified**: Migration script has been tested and verified

---

**Ready to migrate?** Run `0006_production_update_schema.sql` on your production database! 