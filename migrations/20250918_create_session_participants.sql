-- Migration: create session_participants table if missing
-- Matches the schema observed in the database UI
SET @tbl := 'session_participants';
SET @s = (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl
);

PREPARE stmt FROM 'SELECT ?';
EXECUTE stmt USING @s;
DEALLOCATE PREPARE stmt;

-- Only create table when missing
IF @s = 0 THEN
  CREATE TABLE session_participants (
    id INT(11) NOT NULL AUTO_INCREMENT,
    session_id VARCHAR(64) NOT NULL,
    user_id INT(11) NOT NULL,
    role VARCHAR(32) DEFAULT NULL,
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at DATETIME DEFAULT NULL,
    is_present TINYINT(1) DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_session_user (session_id, user_id),
    KEY idx_session (session_id),
    KEY idx_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
END IF;

SELECT 'migration_complete' AS status;
