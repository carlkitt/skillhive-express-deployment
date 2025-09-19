-- Migration: create enrolled_students
-- Purpose: canonical list of currently enrolled students used for admin verification

CREATE TABLE IF NOT EXISTS enrolled_students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  course VARCHAR(128) DEFAULT NULL,
  year_level INT DEFAULT NULL,
  section VARCHAR(64) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY ux_student_id (student_id),
  INDEX ix_course (course),
  INDEX ix_year_level (year_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
