-- Migration: add user_id to feedback and backfill for existing rows
ALTER TABLE feedback
  ADD COLUMN user_id INT(11) DEFAULT NULL AFTER name;

-- If you want to backfill seeded rows (example):
-- Update first four rows inserted by seed script to set user_id values
UPDATE feedback SET user_id = 10 WHERE id = 1;
UPDATE feedback SET user_id = 11 WHERE id = 2;
UPDATE feedback SET user_id = 12 WHERE id = 3;
UPDATE feedback SET user_id = 13 WHERE id = 4;
