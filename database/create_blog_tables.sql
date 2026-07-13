-- ============================================================================
-- Blog Module Tables
-- ============================================================================

USE `antigravty-academisthan`;

CREATE TABLE IF NOT EXISTS blog_posts (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  summary TEXT,
  content LONGTEXT NOT NULL,
  cover_image_url VARCHAR(255),
  category VARCHAR(100),
  author_id CHAR(36) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  published_at DATETIME,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_author (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_tags (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id CHAR(36) NOT NULL,
  tag_id CHAR(36) NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES blog_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_saved_posts (
  user_id CHAR(36) NOT NULL,
  post_id CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_likes (
  user_id CHAR(36) NOT NULL,
  post_id CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_comments (
  id CHAR(36) PRIMARY KEY,
  post_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  parent_id CHAR(36) DEFAULT NULL,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'approved',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES blog_comments(id) ON DELETE SET NULL,
  INDEX idx_post (post_id),
  INDEX idx_user (user_id),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
