-- ============================================================================
-- ADD PUSH SUBSCRIPTIONS TABLE TO ACADEMISTHAN DATABASE
-- ============================================================================

USE `antigravty-academisthan`;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  UNIQUE INDEX idx_endpoint (endpoint)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
