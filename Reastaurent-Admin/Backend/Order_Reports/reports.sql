CREATE INDEX IF NOT EXISTS idx_order_reports_created_at
  ON orders(created_at)
  WHERE is_deleted = 0;

CREATE INDEX IF NOT EXISTS idx_order_reports_payment_status
  ON orders(payment_status)
  WHERE is_deleted = 0;

CREATE INDEX IF NOT EXISTS idx_order_reports_payment_method
  ON orders(payment_method)
  WHERE is_deleted = 0;

CREATE INDEX IF NOT EXISTS idx_order_reports_order_status
  ON orders(order_status)
  WHERE is_deleted = 0;

CREATE INDEX IF NOT EXISTS idx_order_reports_items_order_id
  ON order_items(order_id);

INSERT INTO access_modules (module_key, module_name, priority, status)
VALUES ('reports', 'Reports', 45, 1)
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
  'reports',
  'Reports',
  '/reports',
  'reports',
  45,
  1
FROM access_modules
WHERE module_key = 'reports'
ON CONFLICT (menu_key)
DO UPDATE SET
  module_id = EXCLUDED.module_id,
  menu_name = EXCLUDED.menu_name,
  route_path = EXCLUDED.route_path,
  icon_key = EXCLUDED.icon_key,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO access_menu_actions (menu_id, action_id, priority, status)
SELECT am.menu_id, aa.action_id, aa.priority, 1
FROM access_menus am
CROSS JOIN access_actions aa
WHERE am.menu_key = 'reports'
  AND aa.action_key IN ('view')
ON CONFLICT (menu_id, action_id)
DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;
