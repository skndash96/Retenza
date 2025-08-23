-- Add redeemable_points field to customer_loyalty table
-- This field stores points that can be redeemed as discounts on future visits

ALTER TABLE "customer_loyalty" 
ADD COLUMN "redeemable_points" decimal(10,2) DEFAULT 0.00 NOT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN "customer_loyalty"."redeemable_points" IS 'Points that can be redeemed as discounts on future visits (cashback rewards)'; 