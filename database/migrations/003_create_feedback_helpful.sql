-- Migration 003: create table to track per-user helpful flags for feedback
-- Creates feedback_helpful table and ensures uniqueness per (feedback_id, user_id)
CREATE TABLE IF NOT EXISTS feedback_helpful (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feedback_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_feedback_user (feedback_id, user_id),
  INDEX idx_feedback_id (feedback_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add foreign key constraints for referential integrity (if feedback and users tables exist)
ALTER TABLE feedback_helpful
  ADD CONSTRAINT fk_feedback_helpful_feedback FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_feedback_helpful_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: application code will maintain feedback.helpful_count atomically.
