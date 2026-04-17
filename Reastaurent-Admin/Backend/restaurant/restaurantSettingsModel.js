const db = require("../config/db");

const ensureRestaurantSettingsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS restaurant_settings (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER NOT NULL UNIQUE REFERENCES admin(id) ON DELETE CASCADE,
      institution_name VARCHAR(255) NOT NULL DEFAULT 'Bagel Master Group',
      restaurant_name VARCHAR(255) NOT NULL DEFAULT 'Bagel Master Cafe',
      manual_is_active SMALLINT NOT NULL DEFAULT 1,
      schedule_enabled SMALLINT NOT NULL DEFAULT 0,
      schedule_start_time TIME,
      schedule_end_time TIME,
      timezone_name VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const alterTableQuery = `
    ALTER TABLE restaurant_settings
    ADD COLUMN IF NOT EXISTS institution_name VARCHAR(255) NOT NULL DEFAULT 'Bagel Master Group',
    ADD COLUMN IF NOT EXISTS restaurant_name VARCHAR(255) NOT NULL DEFAULT 'Bagel Master Cafe',
    ADD COLUMN IF NOT EXISTS manual_is_active SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS schedule_enabled SMALLINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS schedule_start_time TIME,
    ADD COLUMN IF NOT EXISTS schedule_end_time TIME,
    ADD COLUMN IF NOT EXISTS timezone_name VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
  `;

  await db.query(createTableQuery);
  await db.query(alterTableQuery);
};

const normalizeRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    ...row,
    manual_is_active: Number(row.manual_is_active),
    schedule_enabled: Number(row.schedule_enabled),
  };
};

const defaultSettings = (adminId) => ({
  admin_id: adminId,
  institution_name: "Bagel Master Group",
  restaurant_name: "Bagel Master Cafe",
  manual_is_active: 1,
  schedule_enabled: 0,
  schedule_start_time: null,
  schedule_end_time: null,
  timezone_name: "Asia/Kolkata",
  created_at: null,
  updated_at: null,
});

const restaurantSettingsModel = {
  ensureRestaurantSettingsTable,

  getByAdminId: async (adminId) => {
    const query = `
      SELECT *
      FROM restaurant_settings
      WHERE admin_id = $1
      LIMIT 1;
    `;

    const result = await db.query(query, [adminId]);
    const row = result.rows[0];
    return row ? normalizeRow(row) : defaultSettings(adminId);
  },

  upsertByAdminId: async ({
    adminId,
    institutionName,
    restaurantName,
    manualIsActive,
    scheduleEnabled,
    scheduleStartTime,
    scheduleEndTime,
    timezoneName,
  }) => {
    const query = `
      INSERT INTO restaurant_settings (
        admin_id,
        institution_name,
        restaurant_name,
        manual_is_active,
        schedule_enabled,
        schedule_start_time,
        schedule_end_time,
        timezone_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (admin_id)
      DO UPDATE SET
        institution_name = EXCLUDED.institution_name,
        restaurant_name = EXCLUDED.restaurant_name,
        manual_is_active = EXCLUDED.manual_is_active,
        schedule_enabled = EXCLUDED.schedule_enabled,
        schedule_start_time = EXCLUDED.schedule_start_time,
        schedule_end_time = EXCLUDED.schedule_end_time,
        timezone_name = EXCLUDED.timezone_name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      adminId,
      institutionName,
      restaurantName,
      manualIsActive,
      scheduleEnabled,
      scheduleStartTime,
      scheduleEndTime,
      timezoneName,
    ];

    const result = await db.query(query, values);
    return normalizeRow(result.rows[0] || null);
  },

  updateManualStatus: async (adminId, manualIsActive) => {
    const query = `
      INSERT INTO restaurant_settings (
        admin_id,
        manual_is_active
      )
      VALUES ($1, $2)
      ON CONFLICT (admin_id)
      DO UPDATE SET
        manual_is_active = EXCLUDED.manual_is_active,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await db.query(query, [adminId, manualIsActive]);
    return normalizeRow(result.rows[0] || null);
  },
};

module.exports = restaurantSettingsModel;




// CREATE TABLE IF NOT EXISTS restaurant_settings (
//   id SERIAL PRIMARY KEY,
//   admin_id INTEGER NOT NULL UNIQUE REFERENCES admin(id) ON DELETE CASCADE,
//   institution_name VARCHAR(255) NOT NULL DEFAULT 'Bagel Master Group',
//   restaurant_name VARCHAR(255) NOT NULL DEFAULT 'Bagel Master Cafe',
//   manual_is_active SMALLINT NOT NULL DEFAULT 1,
//   schedule_enabled SMALLINT NOT NULL DEFAULT 0,
//   schedule_start_time TIME,
//   schedule_end_time TIME,
//   timezone_name VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
//   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
//   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
// );
