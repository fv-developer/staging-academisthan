-- ============================================================================
-- ACADEMISTHAN - MySQL Database Schema
-- Run this in phpMyAdmin after creating database 'academisthan'
-- ============================================================================

-- Create database (run this first in phpMyAdmin)
CREATE DATABASE IF NOT EXISTS academisthan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE academisthan;

-- ============================================================================
-- 1. USERS TABLE (replaces Supabase auth.users)
-- ============================================================================

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at DATETIME,
  reset_token VARCHAR(255),
  reset_token_expires DATETIME,
  last_sign_in_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. PROFILES TABLE
-- ============================================================================

CREATE TABLE profiles (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255),
  work_email VARCHAR(255),
  full_name VARCHAR(255),
  phone VARCHAR(20),
  designation VARCHAR(255),
  department VARCHAR(255),
  institution VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  address TEXT,
  pincode VARCHAR(20),
  country VARCHAR(100),
  specialization TEXT,
  experience_years INT,
  avatar_url TEXT,
  membership_id VARCHAR(50) UNIQUE,
  membership_status VARCHAR(50) DEFAULT 'pending',
  bio TEXT,
  linkedin_url TEXT,
  google_scholar_url TEXT,
  teacher_type VARCHAR(50),
  email_verified BOOLEAN DEFAULT FALSE,
  verified_at DATETIME,
  status VARCHAR(50) DEFAULT 'pending',
  rejection_reason TEXT,
  suspension_reason TEXT,
  institution_id CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_membership_id (membership_id),
  INDEX idx_status (status),
  INDEX idx_institution_id (institution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. INSTITUTIONS TABLE
-- ============================================================================

CREATE TABLE institutions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  institute_code VARCHAR(100),
  type VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  pincode VARCHAR(20),
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  website TEXT,
  established_year INT,
  student_count INT,
  faculty_count INT,
  accreditation TEXT,
  document_url TEXT,
  logo_url TEXT,
  description TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  registered_by CHAR(36),
  admin_approved BOOLEAN DEFAULT FALSE,
  approved_by CHAR(36),
  approved_at DATETIME,
  rejection_reason TEXT,
  suspension_reason TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  membership_status VARCHAR(50) DEFAULT 'inactive',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_email_verified (email_verified),
  INDEX idx_admin_approved (admin_approved),
  INDEX idx_approved_by (approved_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. ADMIN_ROLES TABLE
-- ============================================================================

CREATE TABLE admin_roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL,
  permissions JSON,
  assigned_by CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_role (role),
  CHECK (role IN ('super_admin', 'admin', 'moderator'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. APPROVAL_LOGS TABLE
-- ============================================================================

CREATE TABLE approval_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  institution_id CHAR(36) NOT NULL,
  admin_id CHAR(36) NOT NULL,
  action VARCHAR(50) NOT NULL,
  reason TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_institution_id (institution_id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_created_at (created_at),
  CHECK (action IN ('approved', 'rejected', 'pending_review', 'requested_changes'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. EMAIL_VERIFICATIONS TABLE
-- ============================================================================

CREATE TABLE email_verifications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at DATETIME,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at),
  CHECK (type IN ('fellow', 'institution'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. BLOG_POSTS TABLE
-- ============================================================================

CREATE TABLE blog_posts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  summary TEXT,
  content LONGTEXT,
  cover_image_url TEXT,
  author_id CHAR(36),
  author_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft',
  category VARCHAR(100),
  tags JSON,
  is_published BOOLEAN DEFAULT FALSE,
  published_at DATETIME,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  rejection_reason TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_author_id (author_id),
  INDEX idx_is_published (is_published),
  INDEX idx_published_at (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. NEWS_UPDATES TABLE
-- ============================================================================

CREATE TABLE news_updates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  link TEXT,
  image_url TEXT,
  category VARCHAR(100),
  is_published BOOLEAN DEFAULT FALSE,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_published (is_published),
  INDEX idx_published_at (published_at),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. EVENTS TABLE
-- ============================================================================

CREATE TABLE events (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATETIME,
  end_date DATETIME,
  location VARCHAR(255),
  venue TEXT,
  event_type VARCHAR(100),
  category VARCHAR(100),
  image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  registration_link TEXT,
  max_participants INT,
  organizer VARCHAR(255),
  contact_email VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_event_date (event_date),
  INDEX idx_is_published (is_published),
  INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. EVENT_REGISTRATIONS TABLE
-- ============================================================================

CREATE TABLE event_registrations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  event_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  status VARCHAR(50) DEFAULT 'registered',
  attended BOOLEAN DEFAULT FALSE,
  qr_code TEXT,
  registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_event_user (event_id, user_id),
  INDEX idx_event_id (event_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_attended (attended)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. PROGRAMS TABLE
-- ============================================================================

CREATE TABLE programs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration VARCHAR(100),
  level VARCHAR(50),
  category VARCHAR(100),
  image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  prerequisites TEXT,
  learning_outcomes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_published (is_published),
  INDEX idx_level (level),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. PROGRAM_MODULES TABLE
-- ============================================================================

CREATE TABLE program_modules (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  program_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT,
  content LONGTEXT,
  sort_order INT DEFAULT 0,
  duration_minutes INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  INDEX idx_program_id (program_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 13. ENROLLMENTS TABLE
-- ============================================================================

CREATE TABLE enrollments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  program_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  status VARCHAR(50) DEFAULT 'enrolled',
  progress_percentage INT DEFAULT 0,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_program_user (program_id, user_id),
  INDEX idx_program_id (program_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 14. CERTIFICATES TABLE
-- ============================================================================

CREATE TABLE certificates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  program_id CHAR(36),
  event_id CHAR(36),
  tool_result_id CHAR(36),
  certificate_number VARCHAR(100) UNIQUE,
  certificate_type VARCHAR(50),
  issued_date DATE,
  pdf_url TEXT,
  qr_code TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
  FOREIGN KEY (tool_result_id) REFERENCES tool_results(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_program_id (program_id),
  INDEX idx_event_id (event_id),
  INDEX idx_tool_result_id (tool_result_id),
  INDEX idx_certificate_number (certificate_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 15. TOOL_RESULTS TABLE
-- ============================================================================

CREATE TABLE tool_results (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36),
  tool_name VARCHAR(100),
  tool_type VARCHAR(100),
  input_data JSON,
  result_data JSON,
  score DECIMAL(10,2),
  passing_score DECIMAL(10,2) DEFAULT 50.00,
  result VARCHAR(50) DEFAULT 'Fail',
  certificate_status VARCHAR(50) DEFAULT 'None',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_tool_name (tool_name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 16. ANALYTICS_EVENTS TABLE
-- ============================================================================

CREATE TABLE analytics_events (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36),
  event_type VARCHAR(100),
  page_path VARCHAR(255),
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 17. CONTACT_SUBMISSIONS TABLE
-- ============================================================================

CREATE TABLE contact_submissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CREATE SAMPLE ADMIN USER
-- Password: academisthan (hashed with bcrypt)
-- ============================================================================

-- Insert sample admin user (you'll need to change this after first login)
INSERT INTO users (id, email, password_hash, full_name, email_verified, email_verified_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'ravindra.pal@futurevarsity.edu.in',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- password: academisthan
  'Ravindra Pal',
  TRUE,
  NOW()
);

-- Insert profile for admin user
INSERT INTO profiles (id, email, full_name, membership_status, status)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'ravindra.pal@futurevarsity.edu.in',
  'Ravindra Pal',
  'active',
  'active'
);

-- Make user super admin
INSERT INTO admin_roles (user_id, role, permissions, assigned_by)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'super_admin',
  '{"full_access": true}',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);

-- ============================================================================
-- FELLOW CONNECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS fellow_connections (
  id CHAR(36) PRIMARY KEY,
  sender_id CHAR(36) NOT NULL,
  receiver_id CHAR(36) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_sender_receiver (sender_id, receiver_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_receiver_id (receiver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BLOG LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_likes (
  user_id CHAR(36) NOT NULL,
  post_id CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BLOG COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_comments (
  id CHAR(36) PRIMARY KEY,
  post_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  parent_id CHAR(36),
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'approved',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES blog_comments(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id),
  INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BLOG TAGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_tags (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BLOG POST TAGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id CHAR(36) NOT NULL,
  tag_id CHAR(36) NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES blog_tags(id) ON DELETE CASCADE,
  INDEX idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BLOG SAVED POSTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_saved_posts (
  user_id CHAR(36) NOT NULL,
  post_id CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- DONE! Database schema created successfully
-- ============================================================================

-- Next steps:
-- 1. Install backend dependencies: npm install express mysql2 bcrypt jsonwebtoken cors
-- 2. Create Express API server
-- 3. Update frontend to use new API

