ALTER TABLE message_settings
ADD COLUMN IF NOT EXISTS notify_customer_mail_customer_created SMALLINT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS notify_customer_mail_customer_updated SMALLINT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS notify_customer_mail_customer_deleted SMALLINT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS notify_customer_mail_order_created SMALLINT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS notify_customer_mail_order_updated SMALLINT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS notify_customer_mail_order_deleted SMALLINT NOT NULL DEFAULT 1;
