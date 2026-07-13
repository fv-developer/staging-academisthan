-- Create LMS Syllabus Steps Table
CREATE TABLE IF NOT EXISTS lms_syllabus_steps (
  id CHAR(36) PRIMARY KEY,
  module_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'video', 'text', 'pdf', 'link', 'quiz', 'file'
  video_url TEXT,                     -- URL or uploaded file path
  text_content LONGTEXT,              -- CKEditor content
  file_url TEXT,                      -- PDF/Doc, link, file downloads
  quiz_questions LONGTEXT,            -- JSON array of MCQs
  passing_score INT DEFAULT 80,       -- Quiz passing score percentage
  sort_order INT DEFAULT 0,
  duration_minutes INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES program_modules(id) ON DELETE CASCADE,
  INDEX idx_module_id (module_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create LMS User Step Progress Table
CREATE TABLE IF NOT EXISTS lms_user_step_progress (
  id CHAR(36) PRIMARY KEY,
  enrollment_id CHAR(36) NOT NULL,
  step_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  score INT DEFAULT NULL,              -- Score if step is a quiz
  passed BOOLEAN DEFAULT NULL,         -- Passed if step is a quiz
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (step_id) REFERENCES lms_syllabus_steps(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment_step (enrollment_id, step_id),
  INDEX idx_enrollment_id (enrollment_id),
  INDEX idx_step_id (step_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
