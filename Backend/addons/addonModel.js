const db = require("../config/db");

const addonModel = {
  createAddon: async (item_id, addon_group, addon_name, addon_price, sort_order, is_active) => {
    const query = `
      WITH item_target AS (
        SELECT id
        FROM items
        WHERE id = $1::INT
          AND is_deleted = 0
      )
      INSERT INTO item_addons
      (item_id, addon_group, addon_name, addon_price, sort_order, is_active)
      SELECT $1::INT, $2::VARCHAR(120), $3::VARCHAR(255), $4::DECIMAL(10,2), $5::INT, $6::SMALLINT
      WHERE EXISTS (SELECT 1 FROM item_target)
        AND NOT EXISTS (
          SELECT 1
          FROM item_addons
          WHERE item_id = $1::INT
            AND LOWER(addon_group) = LOWER($2::TEXT)
            AND LOWER(addon_name) = LOWER($3::TEXT)
            AND is_deleted = 0
        )
      RETURNING *;
    `;
    const values = [item_id, addon_group, addon_name, addon_price, sort_order, is_active];
    const result = await db.query(query, values);
    return result.rows[0] || null;
  },

  getAddonList: async (limit, offset, item_id = null, addon_group = null) => {
    const query = `
      SELECT
        ia.id,
        ia.item_id,
        i.item_name,
        ia.addon_group,
        ia.addon_name,
        ia.addon_price,
        ia.sort_order,
        ia.created_at,
        ia.updated_at,
        ia.is_deleted,
        ia.is_active,
        COUNT(*) OVER()::INT AS total_records
      FROM item_addons ia
      LEFT JOIN items i ON i.id = ia.item_id
      WHERE ia.is_deleted = 0
        AND ($3::INT IS NULL OR ia.item_id = $3::INT)
        AND ($4::TEXT IS NULL OR LOWER(ia.addon_group) = LOWER($4::TEXT))
      ORDER BY ia.id DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset, item_id, addon_group]);
    return result.rows;
  },

  getAddonById: async (id) => {
    const query = `
      SELECT
        ia.id,
        ia.item_id,
        i.item_name,
        ia.addon_group,
        ia.addon_name,
        ia.addon_price,
        ia.sort_order,
        ia.created_at,
        ia.updated_at,
        ia.is_deleted,
        ia.is_active
      FROM item_addons ia
      LEFT JOIN items i ON i.id = ia.item_id
      WHERE ia.id = $1::INT
        AND ia.is_deleted = 0
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  updateAddon: async (id, item_id, addon_group, addon_name, addon_price, sort_order, is_active) => {
    const query = `
      WITH target AS (
        SELECT id
        FROM item_addons
        WHERE id = $1::INT
          AND is_deleted = 0
      ),
      item_target AS (
        SELECT id
        FROM items
        WHERE id = $2::INT
          AND is_deleted = 0
      ),
      duplicate AS (
        SELECT 1 AS found
        FROM item_addons
        WHERE item_id = $2::INT
          AND LOWER(addon_group) = LOWER($3::TEXT)
          AND LOWER(addon_name) = LOWER($4::TEXT)
          AND is_deleted = 0
          AND id != $1::INT
        LIMIT 1
      ),
      updated AS (
        UPDATE item_addons
        SET
          item_id = $2::INT,
          addon_group = $3::VARCHAR(120),
          addon_name = $4::VARCHAR(255),
          addon_price = $5::DECIMAL(10,2),
          sort_order = $6::INT,
          is_active = $7::SMALLINT,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::INT
          AND is_deleted = 0
          AND EXISTS (SELECT 1 FROM item_target)
          AND NOT EXISTS (SELECT 1 FROM duplicate)
        RETURNING *
      )
      SELECT
        EXISTS (SELECT 1 FROM target) AS target_exists,
        EXISTS (SELECT 1 FROM item_target) AS item_exists,
        EXISTS (SELECT 1 FROM duplicate) AS duplicate_exists,
        updated.id,
        updated.item_id,
        updated.addon_group,
        updated.addon_name,
        updated.addon_price,
        updated.sort_order,
        updated.created_at,
        updated.updated_at,
        updated.is_deleted,
        updated.is_active
      FROM (SELECT 1) AS base
      LEFT JOIN updated ON TRUE;
    `;
    const values = [id, item_id, addon_group, addon_name, addon_price, sort_order, is_active];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  deleteAddon: async (id) => {
    const query = `
      UPDATE item_addons
      SET
        is_deleted = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1::INT
        AND is_deleted = 0
      RETURNING *;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  getAddonsByItem: async (item_id) => {
    const query = `
      SELECT
        ia.id,
        ia.item_id,
        ia.addon_group,
        ia.addon_name,
        ia.addon_price,
        ia.sort_order,
        ia.is_active
      FROM item_addons ia
      INNER JOIN items i ON i.id = ia.item_id
      WHERE ia.item_id = $1::INT
        AND ia.is_deleted = 0
        AND ia.is_active = 1
        AND i.is_deleted = 0
        AND i.is_active = 1
      ORDER BY ia.addon_group ASC, ia.sort_order ASC, ia.id ASC
    `;
    const result = await db.query(query, [item_id]);
    return result.rows;
  },
};

module.exports = addonModel;
