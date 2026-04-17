const db = require("../config/db");

const categoryModel = {
  createCategory: async (category_name, category_description, category_image) => {
    const query = `
      INSERT INTO category
      (category_name, category_description, category_image)
      SELECT $1::VARCHAR(255), $2::TEXT, $3::VARCHAR(255)
      WHERE NOT EXISTS (
        SELECT 1
        FROM category
        WHERE LOWER(category_name) = LOWER($1::TEXT)
          AND is_deleted = 0
      )
      RETURNING *;
    `;
    const values = [category_name, category_description, category_image];
    const result = await db.query(query, values);
    return result.rows[0] || null;
  },

  getCategoryList: async (limit, offset) => {
    const query = `
      SELECT
        id,
        category_name,
        category_description,
        category_image,
        created_at,
        updated_at,
        is_deleted,
        is_active,
        COUNT(*) OVER()::INT AS total_records
      FROM category
      WHERE is_deleted = 0
      ORDER BY id DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  },

  getCategoryById: async (id) => {
    const query = `
      SELECT
        id,
        category_name,
        category_description,
        category_image,
        created_at,
        updated_at,
        is_deleted,
        is_active
      FROM category
      WHERE id = $1 AND is_deleted = 0
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  checkDuplicateCategory: async (category_name, id = null) => {
    let query = `
      SELECT id
      FROM category
      WHERE LOWER(category_name) = LOWER($1)
        AND is_deleted = 0
    `;
    const values = [category_name];

    if (id) {
      query += ` AND id != $2`;
      values.push(id);
    }

    query += " LIMIT 1";

    const result = await db.query(query, values);
    return result.rows.length > 0;
  },

  updateCategory: async (
    id,
    category_name,
    category_description,
    category_image,
    is_active
  ) => {
    const query = `
      WITH target AS (
        SELECT id, category_image
        FROM category
        WHERE id = $1::INT AND is_deleted = 0
      ),
      duplicate AS (
        SELECT 1 AS found
        FROM category
        WHERE LOWER(category_name) = LOWER($2::TEXT)
          AND is_deleted = 0
          AND id != $1::INT
        LIMIT 1
      ),
      updated AS (
        UPDATE category
        SET
          category_name = $2::VARCHAR(255),
          category_description = $3::TEXT,
          category_image = COALESCE(
            $4::VARCHAR(255),
            (SELECT category_image FROM target LIMIT 1)
          ),
          is_active = $5::SMALLINT,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::INT
          AND is_deleted = 0
          AND NOT EXISTS (SELECT 1 FROM duplicate)
        RETURNING
          id,
          category_name,
          category_description,
          category_image,
          created_at,
          updated_at,
          is_deleted,
          is_active
      )
      SELECT
        EXISTS (SELECT 1 FROM target) AS target_exists,
        EXISTS (SELECT 1 FROM duplicate) AS duplicate_exists,
        updated.id,
        updated.category_name,
        updated.category_description,
        updated.category_image,
        updated.created_at,
        updated.updated_at,
        updated.is_deleted,
        updated.is_active
      FROM (SELECT 1) AS base
      LEFT JOIN updated ON TRUE;
    `;
    const values = [id, category_name, category_description, category_image, is_active];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  deleteCategory: async (id) => {
    const query = `
      UPDATE category
      SET
        is_deleted = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_deleted = 0
      RETURNING *;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
};

module.exports = categoryModel;
