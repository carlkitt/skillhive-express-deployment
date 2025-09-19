-- Add fields to persist suggested matches between pending_registrations and enrolled_students
ALTER TABLE pending_registrations
  ADD COLUMN matched_enrolled_id INT NULL AFTER extra,
  ADD COLUMN match_score TINYINT NULL AFTER matched_enrolled_id,
  ADD COLUMN auto_suggested TINYINT(1) NOT NULL DEFAULT 0 AFTER match_score;

CREATE INDEX IF NOT EXISTS ix_pending_matched_enrolled ON pending_registrations(matched_enrolled_id);
