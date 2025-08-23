-- Add email field to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add index for better performance on email queries
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email);

-- Add comment to document the field
COMMENT ON COLUMN businesses.email IS 'Business email address for notifications and communications'; 