-- Migration: create messages table used by the WebSocket server
-- Adds `is_read` so unread-count aggregations in the backend work.

CREATE TABLE IF NOT EXISTS `messages` (
  `message_id` INT(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` INT(11) DEFAULT NULL,
  `from_user_id` INT(11) NOT NULL,
  `to_user_id` INT(11) NOT NULL,
  `content` TEXT DEFAULT NULL,
  `content_type` VARCHAR(50) DEFAULT 'text',
  `metadata` TEXT DEFAULT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `idx_from_user` (`from_user_id`),
  KEY `idx_to_user` (`to_user_id`),
  KEY `idx_conversation` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- To rollback: DROP TABLE IF EXISTS `messages`;
