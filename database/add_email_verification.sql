-- Add email verification fields to users table
-- Date: June 24, 2026

USE academisthan;

-- Add email verification columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(100),
ADD COLUMN IF NOT EXISTS verification_token_expires DATETIME;

-- Add index for faster token lookup
CREATE INDEX IF NOT EXISTS idx_verification_token ON users(verification_token);

-- Show updated structure
DESCRIBE users;

SELECT 'Email verification columns added successfully!' as Status;
