CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  gateway VARCHAR(40) NOT NULL DEFAULT 'stripe',
  rrn VARCHAR(80) NOT NULL UNIQUE,
  transaction_id VARCHAR(255) NOT NULL UNIQUE,
  provider_payment_id VARCHAR(255),
  provider_charge_id VARCHAR(255),
  provider_balance_transaction_id VARCHAR(255),
  amount NUMERIC(12, 2) NOT NULL,
  amount_in_paise INTEGER NOT NULL,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
  payment_method VARCHAR(80),
  status VARCHAR(40) NOT NULL DEFAULT 'created',
  is_payment_success SMALLINT NOT NULL DEFAULT 0,
  failure_code VARCHAR(120),
  failure_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_event JSONB NOT NULL DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

INSERT INTO access_modules (
  module_key,
  module_name,
  priority,
  status
)
VALUES (
  'payments',
  'Payments',
  11,
  1
)
ON CONFLICT (module_key)
DO UPDATE SET
  module_name = EXCLUDED.module_name,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO access_menus (
  parent_menu_id,
  module_id,
  menu_key,
  menu_name,
  route_path,
  icon_key,
  priority,
  status
)
SELECT
  NULL,
  module_id,
  'payments',
  'Payments',
  '/payments',
  'payments',
  11,
  1
FROM access_modules
WHERE module_key = 'payments'
ON CONFLICT (menu_key)
DO UPDATE SET
  module_id = EXCLUDED.module_id,
  menu_name = EXCLUDED.menu_name,
  route_path = EXCLUDED.route_path,
  icon_key = EXCLUDED.icon_key,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

WITH payment_menu AS (
  SELECT menu_id FROM access_menus WHERE menu_key = 'payments' LIMIT 1
),
allowed_actions AS (
  SELECT action_id, priority
  FROM access_actions
  WHERE action_key IN ('add', 'view', 'edit', 'delete')
)
INSERT INTO access_menu_actions (
  menu_id,
  action_id,
  priority,
  status
)
SELECT
  payment_menu.menu_id,
  allowed_actions.action_id,
  allowed_actions.priority,
  1
FROM payment_menu
CROSS JOIN allowed_actions
ON CONFLICT (menu_id, action_id)
DO UPDATE SET
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO admin_menu_permissions (
  admin_id,
  menu_id,
  action_id,
  status
)
SELECT
  a.id,
  ama.menu_id,
  ama.action_id,
  1
FROM admin a
JOIN access_menus am
  ON am.menu_key = 'payments'
JOIN access_menu_actions ama
  ON ama.menu_id = am.menu_id
WHERE a.is_deleted = 0
ON CONFLICT (admin_id, menu_id, action_id)
DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;
