-- ShoreLetter patch: drift matching + in-app unread notifications
-- Run this after your current schema.sql

ALTER TABLE correspondences
  ADD COLUMN IF NOT EXISTS last_read_by_a_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_read_by_b_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_corr_last_read_by_a ON correspondences(last_read_by_a_at);
CREATE INDEX IF NOT EXISTS idx_corr_last_read_by_b ON correspondences(last_read_by_b_at);

-- Initialize read markers for existing threads so old conversations do not all appear unread.
UPDATE correspondences
SET
  last_read_by_a_at = COALESCE(last_read_by_a_at, last_letter_at, created_at),
  last_read_by_b_at = COALESCE(last_read_by_b_at, last_letter_at, created_at)
WHERE last_read_by_a_at IS NULL OR last_read_by_b_at IS NULL;

CREATE OR REPLACE FUNCTION mark_correspondence_read(corr_id uuid, reader_profile_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE correspondences
  SET
    last_read_by_a_at = CASE
      WHEN user_a_id = reader_profile_id THEN now()
      ELSE last_read_by_a_at
    END,
    last_read_by_b_at = CASE
      WHEN user_b_id = reader_profile_id THEN now()
      ELSE last_read_by_b_at
    END
  WHERE id = corr_id
    AND (user_a_id = reader_profile_id OR user_b_id = reader_profile_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
