-- Table to record bulk approvals so they can be rolled back
CREATE TABLE IF NOT EXISTS approval_shadow (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_key VARCHAR(64) NOT NULL,
  pending_id INT NOT NULL,
  created_user_id INT NULL,
  created_tutor_id INT NULL,
  admin_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX ix_batch (batch_key),
  INDEX ix_pending (pending_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
