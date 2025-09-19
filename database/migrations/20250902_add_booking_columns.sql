-- Add session_id and tutor_id to bookings and supporting columns
ALTER TABLE bookings
  ADD COLUMN session_id INT NULL,
  ADD COLUMN tutor_id INT NULL,
  ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'pending',
  ADD COLUMN booked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD INDEX idx_bookings_user (user_id),
  ADD INDEX idx_bookings_session (session_id),
  ADD INDEX idx_bookings_tutor (tutor_id);

-- Optionally add foreign keys if your schema supports them
-- ALTER TABLE bookings ADD CONSTRAINT fk_bookings_session FOREIGN KEY (session_id) REFERENCES sessions(id);
-- ALTER TABLE bookings ADD CONSTRAINT fk_bookings_tutor FOREIGN KEY (tutor_id) REFERENCES tutors(id);
