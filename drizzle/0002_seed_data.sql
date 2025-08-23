-- Seed Data Migration
-- This adds sample data for testing purposes

-- ====================================================================================
-- Sample Business Data
-- ====================================================================================

INSERT INTO "businesses" (
    "phone_number", 
    "hashed_password", 
    "name", 
    "address", 
    "business_type", 
    "description",
    "user_id",
    "is_setup_complete"
) VALUES 
(
    '+919876543210',
    '$2b$10$hashedpassword123', -- Replace with actual hashed password
    'Sample Restaurant',
    '123 Main Street, City',
    'Restaurant',
    'A cozy restaurant serving delicious food',
    1,
    true
),
(
    '+919876543211',
    '$2b$10$hashedpassword456', -- Replace with actual hashed password
    'Sample Cafe',
    '456 Park Avenue, City',
    'Cafe',
    'A trendy cafe with great coffee',
    2,
    true
);

-- ====================================================================================
-- Sample Customer Data
-- ====================================================================================

INSERT INTO "customers" (
    "phone_number", 
    "hashed_password", 
    "name", 
    "gender", 
    "is_setup_complete"
) VALUES 
(
    '+919876543212',
    '$2b$10$hashedpassword789', -- Replace with actual hashed password
    'John Doe',
    'Male',
    true
),
(
    '+919876543213',
    '$2b$10$hashedpassword012', -- Replace with actual hashed password
    'Jane Smith',
    'Female',
    true
);

-- ====================================================================================
-- Sample Loyalty Programs
-- ====================================================================================

INSERT INTO "loyalty_programs" (
    "business_id", 
    "points_rate", 
    "description", 
    "tiers"
) VALUES 
(
    1,
    1,
    'Restaurant Loyalty Program',
    '[
        {
            "id": 1,
            "name": "Bronze",
            "points_to_unlock": 0,
            "rewards": [
                {
                    "id": 1,
                    "reward_type": "cashback",
                    "percentage": 5,
                    "description": "5% cashback on all orders"
                }
            ]
        },
        {
            "id": 2,
            "name": "Silver",
            "points_to_unlock": 100,
            "rewards": [
                {
                    "id": 2,
                    "reward_type": "cashback",
                    "percentage": 10,
                    "description": "10% cashback on all orders"
                }
            ]
        }
    ]'
),
(
    2,
    2,
    'Cafe Loyalty Program',
    '[
        {
            "id": 1,
            "name": "Bronze",
            "points_to_unlock": 0,
            "rewards": [
                {
                    "id": 1,
                    "reward_type": "cashback",
                    "percentage": 3,
                    "description": "3% cashback on coffee"
                }
            ]
        }
    ]'
);

-- ====================================================================================
-- Sample Missions
-- ====================================================================================

INSERT INTO "missions" (
    "business_id", 
    "title", 
    "description", 
    "offer", 
    "applicable_tiers", 
    "filters", 
    "expires_at"
) VALUES 
(
    1,
    'First Order Bonus',
    'Complete your first order to earn bonus points',
    '20% cashback on first order',
    '["Bronze"]',
    '{}',
    NOW() + INTERVAL '30 days'
),
(
    2,
    'Coffee Lover',
    'Order coffee 5 times this month',
    'Free coffee on 6th order',
    '["Bronze"]',
    '{}',
    NOW() + INTERVAL '30 days'
);

-- ====================================================================================
-- Sample Customer Loyalty
-- ====================================================================================

INSERT INTO "customer_loyalty" (
    "customer_id", 
    "business_id", 
    "points", 
    "current_tier_name"
) VALUES 
(
    1,
    1,
    50,
    'Bronze'
),
(
    2,
    1,
    120,
    'Silver'
),
(
    1,
    2,
    30,
    'Bronze'
);

-- ====================================================================================
-- Sample Transactions
-- ====================================================================================

INSERT INTO "transactions" (
    "customer_id", 
    "business_id", 
    "bill_amount", 
    "points_awarded"
) VALUES 
(
    1,
    1,
    500.00,
    50
),
(
    2,
    1,
    1200.00,
    120
),
(
    1,
    2,
    300.00,
    30
); 