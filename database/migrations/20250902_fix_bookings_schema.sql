-- Migration: make bookings usable by the backend booking route
-- 1) Make `id` an AUTO_INCREMENT PRIMARY KEY
-- 2) Add session_id, tutor_id, price_charged
-- 3) Add indexes for performance
-- IMPORTANT: Inspect your current schema first (SHOW CREATE TABLE bookings;) and
-- back up the table before running this migration if you're unsure.

-- Make id AUTO_INCREMENT and PRIMARY KEY (safe if table is empty; if not, ensure
-- existing ids are unique and non-null)
ALTER TABLE bookings
  MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY;

-- Add session_id and tutor_id columns used by the backend
ALTER TABLE bookings
  ADD COLUMN session_id INT NULL,
  ADD COLUMN tutor_id INT NULL;

-- Add price_charged column to store final charged price
ALTER TABLE bookings
  ADD COLUMN price_charged DECIMAL(10,2) NULL;

-- Ensure booked_at exists and has a default if it doesn't already (this will error
-- if booked_at already exists; remove if your schema already has it)
-- ALTER TABLE bookings
--   ADD COLUMN booked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add helpful indexes (ignore errors if they already exist)
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_session ON bookings(session_id);
CREATE INDEX idx_bookings_tutor ON bookings(tutor_id);

-- End of migration
