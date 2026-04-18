CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  notification_type VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_id INTEGER NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  redirect_path VARCHAR(255) NOT NULL DEFAULT '',
  source VARCHAR(100) NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read SMALLINT NOT NULL DEFAULT 0,
  read_at TIMESTAMPTZ NULL,
  is_deleted SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_entity
  ON notifications(entity, entity_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read
  ON notifications(is_read, is_deleted, id DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_notification_type
  ON notifications(notification_type, id DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications(created_at DESC);
