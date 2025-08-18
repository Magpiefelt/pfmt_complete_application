-- Migration: Enhance notifications table for workflow
-- Created: 2025-01-18
-- Description: Update notifications table to use UUIDs and add workflow-specific fields

-- First, check if notifications table exists and has the old structure
DO $$
BEGIN
  -- If the table exists with SERIAL id, we need to migrate it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'id' 
    AND data_type = 'integer'
  ) THEN
    -- Create new notifications table with UUID structure
    CREATE TABLE notifications_new (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      type TEXT NOT NULL,             -- 'project_submitted','project_assigned','project_finalized'
      title TEXT NOT NULL,            -- notification title
      message TEXT,                   -- notification body
      payload JSONB,                  -- additional data (project_id, etc.)
      read_at TIMESTAMPTZ,            -- when user marked as read
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    -- Migrate existing data if any exists
    INSERT INTO notifications_new (user_id, type, title, message, payload, read_at, created_at)
    SELECT 
      (SELECT id FROM users WHERE users.id::text = notifications.user_id::text LIMIT 1),
      notifications.type,
      notifications.title,
      notifications.message,
      notifications.data,
      notifications.read_at,
      notifications.created_at
    FROM notifications
    WHERE EXISTS (SELECT 1 FROM users WHERE users.id::text = notifications.user_id::text);
    
    -- Drop old table and rename new one
    DROP TABLE notifications;
    ALTER TABLE notifications_new RENAME TO notifications;
  ELSE
    -- Create new notifications table if it doesn't exist
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      type TEXT NOT NULL,             -- 'project_submitted','project_assigned','project_finalized'
      title TEXT NOT NULL,            -- notification title
      message TEXT,                   -- notification body
      payload JSONB,                  -- additional data (project_id, etc.)
      read_at TIMESTAMPTZ,            -- when user marked as read
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

-- Create indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- Add comments to document the notification structure
COMMENT ON TABLE notifications IS 'User notifications for workflow handoffs and system events';
COMMENT ON COLUMN notifications.type IS 'Notification type (project_submitted, project_assigned, project_finalized, etc.)';
COMMENT ON COLUMN notifications.payload IS 'JSON object containing notification-specific data (project_id, etc.)';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when user marked notification as read (NULL = unread)';

