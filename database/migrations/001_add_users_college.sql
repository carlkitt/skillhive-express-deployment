-- Migration: Add `college` column to `users` table as an ENUM
-- This migration is optional and safe to run multiple times.
-- We store college using a controlled ENUM to make downstream code
-- and filtering safer. Adjust the values list below to match your
-- institutional naming if needed.

-- Enum values (adjust as needed):
--  - Unknown  : fallback/default
--  - CCS      : College of Computer Studies (example)
--  - CAS      : College of Arts & Sciences
--  - COE      : College of Engineering
--  - CBA      : College of Business Administration
--  - Other    : Any other colleges

-- Simple (MySQL 8.0+): add column only if it does not already exist
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `college` ENUM('Unknown','CCS','CAS','COE','CBA','Other') DEFAULT 'Unknown';

-- Portable alternative (uncomment and run if your MySQL version does NOT
-- support IF NOT EXISTS for ADD COLUMN):
--
-- SET @exists = (
--   SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
--   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'college'
-- );
-- SELECT @exists;
-- SET @sql = IF(@exists = 0,
--   'ALTER TABLE `users` ADD COLUMN `college` ENUM(\'Unknown\',\'CCS\',\'CAS\',\'COE\',\'CBA\',\'Other\') DEFAULT \'Unknown\' ',
--   'SELECT "college column already exists"');
-- PREPARE stmt FROM @sql;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;

-- End of migration
