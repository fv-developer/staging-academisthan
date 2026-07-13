-- Migration Script: Fellow Registration and Email Change request fields
-- Date: June 24, 2026

-- 1. Add country and work_email columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
ADD COLUMN IF NOT EXISTS work_email VARCHAR(255) DEFAULT NULL;

-- 2. Create email_change_requests table
CREATE TABLE IF NOT EXISTS email_change_requests (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  old_email VARCHAR(255) NOT NULL,
  new_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Migration completed successfully!' as Status;
