-- Migration: add used_at to user_inventory and add FK from bookings.voucher_inventory_id -> user_inventory(inventory_id)
-- Run this in your MySQL DB after reviewing and backing up your data.
-- This migration is idempotent: it only adds objects if they do not already exist.

-- 1) Add used_at column to user_inventory if missing
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_inventory'
    AND COLUMN_NAME = 'used_at'
);
SET @addcol = IF(@col_exists = 0,
  'ALTER TABLE user_inventory ADD COLUMN used_at DATETIME NULL DEFAULT NULL',
  'SELECT "used_at already exists"');
PREPARE pc FROM @addcol;
EXECUTE pc;
DEALLOCATE PREPARE pc;

-- 2) Add FK from bookings.voucher_inventory_id -> user_inventory(inventory_id) only if missing
SET @fkcnt = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'voucher_inventory_id'
    AND REFERENCED_TABLE_NAME = 'user_inventory'
);
SET @fkstmt = IF(@fkcnt = 0,
  'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_voucher_inventory_20250903 FOREIGN KEY (voucher_inventory_id) REFERENCES user_inventory(inventory_id)',
  'SELECT "foreign key already exists"');
PREPARE pf FROM @fkstmt;
EXECUTE pf;
DEALLOCATE PREPARE pf;

-- 3) Create index on bookings.voucher_inventory_id if missing
SET @idxcnt = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'voucher_inventory_id'
);
SET @idxstmt = IF(@idxcnt = 0,
  'CREATE INDEX idx_bookings_voucher_inventory_20250903 ON bookings (voucher_inventory_id)',
  'SELECT "index already exists"');
PREPARE pi FROM @idxstmt;
EXECUTE pi;
DEALLOCATE PREPARE pi;
