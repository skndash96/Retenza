-- Fix contact_number constraint issue in production
-- This migration handles the case where contact_number might be NULL

-- First, ensure all businesses have a contact_number value
UPDATE businesses 
SET contact_number = COALESCE(contact_number, phone_number, 'N/A')
WHERE contact_number IS NULL;

-- Now make contact_number NOT NULL
ALTER TABLE businesses 
ALTER COLUMN contact_number SET NOT NULL;

-- Also ensure user_id is set
UPDATE businesses 
SET user_id = COALESCE(user_id, id)
WHERE user_id IS NULL;

ALTER TABLE businesses 
ALTER COLUMN user_id SET NOT NULL; 