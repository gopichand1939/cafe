BEGIN;

WITH upsert_module AS (
  INSERT INTO access_modules (
    module_key,
    module_name,
    priority,
    status
  )
  VALUES (
    'messages',
    'Messages',
    10,
    1
  )
  ON CONFLICT (module_key)
  DO UPDATE SET
    module_name = EXCLUDED.module_name,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP
  RETURNING module_id
),
resolved_module AS (
  SELECT module_id FROM upsert_module
  UNION ALL
  SELECT module_id
  FROM access_modules
  WHERE module_key = 'messages'
  LIMIT 1
),
upsert_menu AS (
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
    rm.module_id,
    'messages',
    'Messages',
    '/messages',
    'messages',
    10,
    1
  FROM resolved_module rm
  ON CONFLICT (menu_key)
  DO UPDATE SET
    parent_menu_id = EXCLUDED.parent_menu_id,
    module_id = EXCLUDED.module_id,
    menu_name = EXCLUDED.menu_name,
    route_path = EXCLUDED.route_path,
    icon_key = EXCLUDED.icon_key,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP
  RETURNING menu_id
),
resolved_menu AS (
  SELECT menu_id FROM upsert_menu
  UNION ALL
  SELECT menu_id
  FROM access_menus
  WHERE menu_key = 'messages'
  LIMIT 1
)
INSERT INTO access_menu_actions (menu_id, action_id, priority, status)
SELECT
  rm.menu_id,
  aa.action_id,
  CASE aa.action_key
    WHEN 'add' THEN 1
    WHEN 'view' THEN 2
    WHEN 'edit' THEN 3
    WHEN 'delete' THEN 4
  END,
  1
FROM resolved_menu rm
JOIN access_actions aa
  ON aa.action_key IN ('add', 'view', 'edit', 'delete')
 AND aa.status = 1
ON CONFLICT (menu_id, action_id)
DO UPDATE SET
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

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
  AND am.menu_key = 'messages'
ON CONFLICT (admin_id, menu_id, action_id)
DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;
