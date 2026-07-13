-- ============================================================================
-- ADD NOTIFICATIONS TABLE TO ACADEMISTHAN DATABASE
-- Run this SQL in phpMyAdmin to add notifications support
-- ============================================================================

USE academisthan;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type),
  CHECK (type IN ('institution_status', 'certificate', 'event', 'course', 'general'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample notifications for testing (optional)
-- Replace 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' with actual user ID
INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'certificate', 'New certificate available', 'Your API Score certificate is ready', '/dashboard/certificates', FALSE, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'course', 'Course completed', 'AI for Educators Batch 4', '/dashboard/courses', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'event', 'Upcoming event', 'Teacher Awards 2026 in 3 days', '/upcoming-events', FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Done! Notifications table created successfully
