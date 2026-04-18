CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash TEXT NOT NULL,
  is_active SMALLINT NOT NULL DEFAULT 1,
  is_deleted SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS customers_email_unique_idx
ON customers (LOWER(email))
WHERE is_deleted = 0;

CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_unique_idx
ON customers (phone)
WHERE is_deleted = 0 AND phone <> '';

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS current_session_id TEXT,
ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT,
ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;





-- menu create


BEGIN;

-- 1. Insert the new child menu under menu_management
WITH parent_menu AS (
  SELECT menu_id, module_id
  FROM access_menus
  WHERE menu_key = 'menu_management'
    AND status = 1
  LIMIT 1
),
new_menu AS (
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
    pm.menu_id,
    pm.module_id,
    'customer',
    'Customer',
    '/customer',
    'customer',
    4,
    1
  FROM parent_menu pm
  RETURNING menu_id
)

-- 2. Attach allowed actions to this menu
INSERT INTO access_menu_actions (menu_id, action_id, priority, status)
SELECT
  nm.menu_id,
  aa.action_id,
  CASE aa.action_key
    WHEN 'add' THEN 1
    WHEN 'view' THEN 2
    WHEN 'edit' THEN 3
    WHEN 'delete' THEN 4
  END,
  1
FROM new_menu nm
JOIN access_actions aa
  ON aa.action_key IN ('add', 'view', 'edit', 'delete')
 AND aa.status = 1
ON CONFLICT (menu_id, action_id) DO NOTHING;

-- 3. Give this menu's actions to all existing admins
INSERT INTO admin_menu_permissions (admin_id, menu_id, action_id, status)
SELECT
  a.id,
  ama.menu_id,
  ama.action_id,
  1
FROM admin a
JOIN access_menu_actions ama
  ON 1 = 1
JOIN access_menus am
  ON am.menu_id = ama.menu_id
WHERE a.is_deleted = 0
  AND am.menu_key = 'customer'
ON CONFLICT (admin_id, menu_id, action_id)
DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;
