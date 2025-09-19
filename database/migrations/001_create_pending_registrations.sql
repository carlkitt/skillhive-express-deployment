-- Migration: create pending_registrations
CREATE TABLE IF NOT EXISTS pending_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('student','tutor') NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  extra JSON DEFAULT NULL,
  document_path VARCHAR(1024) DEFAULT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT DEFAULT NULL,
  reviewed_at TIMESTAMP NULL,
  review_notes TEXT NULL,
  UNIQUE KEY ux_username (username),
  INDEX ix_student_id (student_id),
  INDEX ix_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
