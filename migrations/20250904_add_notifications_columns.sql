-- Migration: add recommended columns to notifications table
-- Adds: sender_id, payload (JSON), url, channel, priority, expires_at
-- Also add an index for efficient unread fetches: (user_id, is_read)
-- Note: Run this once. If your MySQL server is older and doesn't support JSON,
-- change payload JSON to LONGTEXT before running.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS sender_id INT NULL AFTER user_id,
  ADD COLUMN IF NOT EXISTS payload JSON NULL AFTER message,
  ADD COLUMN IF NOT EXISTS url VARCHAR(1024) NULL AFTER payload,
  ADD COLUMN IF NOT EXISTS channel ENUM('inbox','email','sms') DEFAULT 'inbox' AFTER url,
  ADD COLUMN IF NOT EXISTS priority TINYINT DEFAULT 1 AFTER channel,
  ADD COLUMN IF NOT EXISTS expires_at DATETIME NULL AFTER created_at;

-- Add composite index for quick unread counts per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_isread ON notifications (user_id, is_read);

-- If your MySQL version doesn't support IF NOT EXISTS on ADD COLUMN or CREATE INDEX,
-- run the migration manually by checking `SHOW COLUMNS FROM notifications` and
-- `SHOW INDEX FROM notifications` and then executing the appropriate ALTER/CREATE.
