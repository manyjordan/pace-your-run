-- Add read_at column to notifications if it doesn't exist
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Now create the partial index safely
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id)
  WHERE read_at IS NULL;
