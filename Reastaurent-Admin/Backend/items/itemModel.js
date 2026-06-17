const db = require("../config/db");

const itemModel = {
  createItem: async (category_id, item_name, item_description, item_image, price, discount_price, preparation_time, is_popular, is_new, is_veg) => {
    const query = `
      WITH category_target AS (
        SELECT id
        FROM category
        WHERE id = $1::INT
          AND is_deleted = 0
      )
      INSERT INTO items
      (category_id, item_name, item_description, item_image, price, discount_price, preparation_time, is_popular, is_new, is_veg, sort_order)
      SELECT
        $1::INT,
        $2::VARCHAR(255),
        $3::TEXT,
        $4::VARCHAR(255),
        $5::DECIMAL(10,2),
        $6::DECIMAL(10,2),
        $7::INT,
        $8::SMALLINT,
        $9::SMALLINT,
        $10::VARCHAR(50),
        COALESCE((SELECT MAX(sort_order) FROM items WHERE category_id = $1::INT AND is_deleted = 0), 0) + 1
      WHERE EXISTS (SELECT 1 FROM category_target)
        AND NOT EXISTS (
          SELECT 1
          FROM items
          WHERE category_id = $1::INT
            AND LOWER(item_name) = LOWER($2::TEXT)
            AND is_deleted = 0
        )
      RETURNING *;
    `;
    const values = [category_id, item_name, item_description, item_image, price, discount_price, preparation_time, is_popular, is_new, is_veg];
    const result = await db.query(query, values);
    return result.rows[0] || null;
  },

  getItemList: async (limit, offset) => {
    const query = `
      SELECT
        items.id,
        items.category_id,
        category.category_name,
        category.category_image,
        category.is_veg_nonveg_applicable,
        items.item_name,
        items.item_description,
        items.item_image,
        items.price,
        items.discount_price,
        items.preparation_time,
        items.is_popular,
        items.is_new,
        items.is_veg,
        items.created_at,
        items.updated_at,
        items.is_deleted,
        items.is_active,
        items.sort_order,
        COUNT(*) OVER()::INT AS total_records
      FROM items
      LEFT JOIN category ON category.id = items.category_id
      WHERE items.is_deleted = 0
      ORDER BY items.sort_order ASC, items.id ASC
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  },

  getItemById: async (id) => {
    const query = `
      SELECT
        items.id,
        items.category_id,
        category.category_name,
        category.category_image,
        category.is_veg_nonveg_applicable,
        items.item_name,
        items.item_description,
        items.item_image,
        items.price,
        items.discount_price,
        items.preparation_time,
        items.is_popular,
        items.is_new,
        items.is_veg,
        items.created_at,
        items.updated_at,
        items.is_deleted,
        items.is_active
      FROM items
      LEFT JOIN category ON category.id = items.category_id
      WHERE items.id = $1
        AND items.is_deleted = 0
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  updateItem: async (
    id,
    category_id,
    item_name,
    item_description,
    item_image,
    is_active,
    price,
    discount_price,
    preparation_time,
    is_popular,
    is_new,
    is_veg
  ) => {
    const query = `
      WITH target AS (
        SELECT id, item_image
        FROM items
        WHERE id = $1::INT
          AND is_deleted = 0
      ),
      category_target AS (
        SELECT id, 1::SMALLINT AS is_veg_nonveg_applicable
        FROM category
        WHERE id = $2::INT
          AND is_deleted = 0
      ),
      duplicate AS (
        SELECT 1 AS found
        FROM items
        WHERE category_id = $2::INT
          AND LOWER(item_name) = LOWER($3::TEXT)
          AND is_deleted = 0
          AND id != $1::INT
        LIMIT 1
      ),
      updated AS (
        UPDATE items
        SET
          category_id = $2::INT,
          item_name = $3::VARCHAR(255),
          item_description = $4::TEXT,
          item_image = COALESCE(
            $5::VARCHAR(255),
            (SELECT item_image FROM target LIMIT 1)
          ),
          is_active = $6::SMALLINT,
          price = $7::DECIMAL(10,2),
          discount_price = $8::DECIMAL(10,2),
          preparation_time = $9::INT,
          is_popular = $10::SMALLINT,
          is_new = $11::SMALLINT,
          is_veg = $12::VARCHAR(50),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::INT
          AND is_deleted = 0
          AND EXISTS (SELECT 1 FROM category_target)
          AND NOT EXISTS (SELECT 1 FROM duplicate)
        RETURNING *
      )
      SELECT
        EXISTS (SELECT 1 FROM target) AS target_exists,
        EXISTS (SELECT 1 FROM category_target) AS category_exists,
        EXISTS (SELECT 1 FROM duplicate) AS duplicate_exists,
        updated.id,
        updated.category_id,
        updated.item_name,
        updated.item_description,
        updated.item_image,
        updated.price,
        updated.discount_price,
        updated.preparation_time,
        updated.is_popular,
        updated.is_new,
        updated.is_veg,
        (SELECT is_veg_nonveg_applicable FROM category_target LIMIT 1) AS is_veg_nonveg_applicable,
        updated.created_at,
        updated.updated_at,
        updated.is_deleted,
        updated.is_active
      FROM (SELECT 1) AS base
      LEFT JOIN updated ON TRUE;
    `;
    const values = [id, category_id, item_name, item_description, item_image, is_active, price, discount_price, preparation_time, is_popular, is_new, is_veg];
    const result = await db.query(query, values);
    return result.rows[0];
  },
  deleteItem: async (id) => {
    const query = `
      UPDATE items
    SET
    is_deleted = 1,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND is_deleted = 0
    RETURNING *;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  reorderItems: async (category_id, orderedIds) => {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const query = `
        UPDATE items
        SET
          sort_order = CASE id
            ${orderedIds.map((id, index) => `WHEN $${index + 1}::INT THEN $${orderedIds.length + index + 1}::INT`).join(" ")}
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${orderedIds.map((_, i) => `$${i + 1}::INT`).join(", ")})
          AND category_id = $${orderedIds.length + orderedIds.length + 1}::INT
          AND is_deleted = 0;
      `;
      const values = [...orderedIds, ...orderedIds.map((_, index) => index + 1), category_id];
      await client.query(query, values);
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = itemModel;
