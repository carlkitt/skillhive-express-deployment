-- Table to audit reconciliation actions performed by admins
CREATE TABLE IF NOT EXISTS reconciliation_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pending_id INT NOT NULL,
  enrolled_id INT NULL,
  admin_id INT NULL,
  action VARCHAR(64) NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX ix_pending (pending_id),
  INDEX ix_enrolled (enrolled_id),
  INDEX ix_admin (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
