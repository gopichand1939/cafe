const db = require("../config/db");
const ALLOWED_ACTION_KEYS = ["add", "view", "edit", "delete"];

const ensureAccessControlTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS access_modules (
      module_id SERIAL PRIMARY KEY,
      module_key VARCHAR(100) NOT NULL UNIQUE,
      module_name VARCHAR(255) NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0,
      status SMALLINT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS access_menus (
      menu_id SERIAL PRIMARY KEY,
      parent_menu_id INTEGER REFERENCES access_menus(menu_id) ON DELETE CASCADE,
      module_id INTEGER REFERENCES access_modules(module_id) ON DELETE CASCADE,
      menu_key VARCHAR(100) NOT NULL UNIQUE,
      menu_name VARCHAR(255) NOT NULL,
      route_path VARCHAR(255),
      icon_key VARCHAR(100),
      priority INTEGER NOT NULL DEFAULT 0,
      status SMALLINT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS access_actions (
      action_id SERIAL PRIMARY KEY,
      action_key VARCHAR(100) NOT NULL UNIQUE,
      action_name VARCHAR(255) NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0,
      status SMALLINT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS access_menu_actions (
      menu_id INTEGER NOT NULL REFERENCES access_menus(menu_id) ON DELETE CASCADE,
      action_id INTEGER NOT NULL REFERENCES access_actions(action_id) ON DELETE CASCADE,
      priority INTEGER NOT NULL DEFAULT 0,
      status SMALLINT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (menu_id, action_id)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_menu_permissions (
      admin_id INTEGER NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
      menu_id INTEGER NOT NULL REFERENCES access_menus(menu_id) ON DELETE CASCADE,
      action_id INTEGER NOT NULL REFERENCES access_actions(action_id) ON DELETE CASCADE,
      status SMALLINT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (admin_id, menu_id, action_id)
    );
  `);
};

const assignDefaultPermissionsToAdmin = async (adminId) => {
  await db.query(
    `
      INSERT INTO admin_menu_permissions (admin_id, menu_id, action_id, status)
      SELECT $1, ama.menu_id, ama.action_id, 1
      FROM access_menu_actions ama
      INNER JOIN access_menus am ON am.menu_id = ama.menu_id AND am.status = 1
      INNER JOIN access_actions aa ON aa.action_id = ama.action_id AND aa.status = 1
      ON CONFLICT (admin_id, menu_id, action_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP;
    `,
    [adminId]
  );
};

const assignDefaultPermissionsToAllAdmins = async () => {
  const admins = await db.query(
    `SELECT id FROM admin WHERE is_deleted = 0;`
  );

  for (const admin of admins.rows) {
    await assignDefaultPermissionsToAdmin(admin.id);
  }
};

const getMenusForAdmin = async (adminId) => {
  const result = await db.query(
    `
      SELECT
        am.menu_id,
        COALESCE(am.parent_menu_id, 0) AS parent_menu_id,
        am.module_id,
        mdl.module_key,
        mdl.module_name,
        am.menu_key,
        am.menu_name,
        am.route_path,
        am.icon_key,
        am.priority,
        am.status,
        aa.action_id,
        aa.action_key,
        aa.action_name,
        ama.priority AS action_priority
      FROM access_menus am
      INNER JOIN access_modules mdl
        ON mdl.module_id = am.module_id
       AND mdl.status = 1
      LEFT JOIN access_menu_actions ama
        ON ama.menu_id = am.menu_id
       AND ama.status = 1
      LEFT JOIN access_actions aa
        ON aa.action_id = ama.action_id
       AND aa.status = 1
       AND aa.action_key = ANY($2::text[])
      LEFT JOIN admin_menu_permissions amp
        ON amp.admin_id = $1
       AND amp.menu_id = am.menu_id
       AND amp.action_id = aa.action_id
       AND amp.status = 1
      WHERE am.status = 1
        AND (
          aa.action_id IS NULL
          OR amp.admin_id IS NOT NULL
        )
      ORDER BY am.priority ASC, ama.priority ASC NULLS LAST, aa.priority ASC NULLS LAST;
    `,
    [adminId, ALLOWED_ACTION_KEYS]
  );

  const map = new Map();

  result.rows.forEach((row) => {
    if (!map.has(row.menu_id)) {
      map.set(row.menu_id, {
        menu_id: row.menu_id,
        parent_menu_id: Number(row.parent_menu_id) || 0,
        module_id: row.module_id,
        module_key: row.module_key,
        module_name: row.module_name,
        menu_key: row.menu_key,
        menu_name: row.menu_name,
        route_path: row.route_path || "",
        icon_key: row.icon_key || row.menu_key,
        priority: row.priority,
        status: row.status,
        actions: [],
      });
    }

    if (row.action_id) {
      map.get(row.menu_id).actions.push({
        action_id: row.action_id,
        action_key: row.action_key,
        action_name: row.action_name,
        priority: row.action_priority,
        status: 1,
      });
    }
  });

  return Array.from(map.values());
};

const ensureAccessControlData = async () => {
  await ensureAccessControlTables();
  await assignDefaultPermissionsToAllAdmins();
};

module.exports = {
  ensureAccessControlData,
  assignDefaultPermissionsToAdmin,
  getMenusForAdmin,
};
