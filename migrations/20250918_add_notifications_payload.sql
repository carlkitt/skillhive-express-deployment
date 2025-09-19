-- Migration: add payload column to notifications if missing
-- Safe: checks for column and adds as JSON (or TEXT) depending on MySQL version
SET @tbl := 'notifications';
SET @col := 'payload';

-- Only run if column not exists
SET @s = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col
);

PREPARE stmt FROM 'SELECT ?';
EXECUTE stmt USING @s;
DEALLOCATE PREPARE stmt;

-- Use ALTER TABLE only when missing
-- We'll attempt to add as JSON first; if that fails (older MySQL), fall back to TEXT
SET @sql = NULL;
SET @sql = IF(@s = 0,
  'ALTER TABLE notifications ADD COLUMN payload JSON NULL',
  'SELECT 1'
);

-- Try adding JSON column
SET @rc = 0;

-- Execute dynamically
SET @run = @sql;
PREPARE p FROM @run;
BEGIN
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET @rc = 1;
  EXECUTE p;
END;
DEALLOCATE PREPARE p;

-- If adding JSON failed and column still missing, try TEXT
SELECT @s := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col);
IF @s = 0 THEN
  ALTER TABLE notifications ADD COLUMN payload TEXT NULL;
END IF;

-- Done
SELECT 'migration_complete' AS status;
