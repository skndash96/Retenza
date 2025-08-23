-- Add approved field to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE;

-- Update existing businesses to be approved (for backward compatibility)
UPDATE businesses SET approved = TRUE WHERE approved IS NULL;

-- Add index for better performance on approval queries
CREATE INDEX IF NOT EXISTS idx_businesses_approved ON businesses(approved); 