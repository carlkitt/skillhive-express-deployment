-- Seed: populate `college` values for existing users
-- This seed will set college to a guessed value where possible, otherwise
-- populate with 'Unknown'. It is safe to run multiple times.

-- Best-effort heuristic examples (customize as needed):
--  - If email domain contains 'ccs' or similar, set to 'CCS'
--  - If course contains common substrings, map to colleges (example only)

-- 1) Ensure the column exists before attempting to update
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'college'
);

-- If college column doesn't exist, stop with a message (no-op)
SELECT CASE WHEN @col_exists = 0 THEN 'NO_COL_COLUMN' ELSE 'COL_EXISTS' END AS status;

-- 2) Populate college using heuristics (run only if column exists)
-- Update by email domain heuristic (example)
-- Only run updates if the column exists
-- Map heuristics to enum values: CCS, CAS, COE, CBA, Other, Unknown

-- Email domain -> CCS (example pattern)
UPDATE `users` SET `college` = 'CCS'
WHERE (`college` IS NULL OR `college` = '') AND LOWER(IFNULL(email, '')) LIKE '%@ccs.%';

-- Course substring -> CCS (computer related)
UPDATE `users` SET `college` = 'CCS'
WHERE (`college` IS NULL OR `college` = '') AND LOWER(IFNULL(course, '')) LIKE '%computer%';

-- Course substring -> CAS (arts / humanities)
UPDATE `users` SET `college` = 'CAS'
WHERE (`college` IS NULL OR `college` = '') AND LOWER(IFNULL(course, '')) LIKE '%arts%';

-- Course substring -> COE (engineering)
UPDATE `users` SET `college` = 'COE'
WHERE (`college` IS NULL OR `college` = '') AND LOWER(IFNULL(course, '')) LIKE '%engineer%';

-- Course substring -> CBA (business)
UPDATE `users` SET `college` = 'CBA'
WHERE (`college` IS NULL OR `college` = '') AND LOWER(IFNULL(course, '')) LIKE '%business%';

-- Fallback: set remaining NULL/empty college values to 'Unknown'
UPDATE `users` SET `college` = 'Unknown' WHERE `college` IS NULL OR `college` = '';

-- End of seed
