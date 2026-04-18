const db = require("../config/db");

const sanitizeCustomer = (row) => {
  if (!row) {
    return null;
  }

  const { password_hash, ...customer } = row;
  return customer;
};

const customerModel = {
  sanitizeCustomer,

  createCustomer: async ({ name, email, phone, passwordHash, isActive }) => {
    const query = `
      WITH duplicate_email AS (
        SELECT 1
        FROM customers
        WHERE LOWER(email) = LOWER($2)
          AND is_deleted = 0
        LIMIT 1
      ),
      duplicate_phone AS (
        SELECT 1
        FROM customers
        WHERE phone = $3
          AND is_deleted = 0
        LIMIT 1
      )
      INSERT INTO customers (name, email, phone, password_hash, is_active)
      SELECT $1, LOWER($2), $3, $4, $5
      WHERE NOT EXISTS (SELECT 1 FROM duplicate_email)
        AND NOT EXISTS (SELECT 1 FROM duplicate_phone)
      RETURNING
        id,
        name,
        email,
        phone,
        is_active,
        is_deleted,
        created_at,
        updated_at;
    `;

    const result = await db.query(query, [name, email, phone, passwordHash, isActive]);
    return result.rows[0] || null;
  },

  getCustomerList: async (limit, offset) => {
    const query = `
      SELECT
        id,
        name,
        email,
        phone,
        is_active,
        is_deleted,
        created_at,
        updated_at,
        COUNT(*) OVER()::INT AS total_records
      FROM customers
      WHERE is_deleted = 0
      ORDER BY id DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await db.query(query, [limit, offset]);
    return result.rows;
  },

  getCustomerById: async (id) => {
    const query = `
      SELECT
        id,
        name,
        email,
        phone,
        is_active,
        is_deleted,
        created_at,
        updated_at
      FROM customers
      WHERE id = $1
        AND is_deleted = 0
      LIMIT 1;
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  getCustomerForUpdate: async (id) => {
    const query = `
      SELECT *
      FROM customers
      WHERE id = $1
        AND is_deleted = 0
      LIMIT 1;
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  updateCustomer: async ({
    id,
    name,
    email,
    phone,
    passwordHash = null,
    isActive,
  }) => {
    const query = `
      WITH target AS (
        SELECT id, password_hash
        FROM customers
        WHERE id = $1::INT
          AND is_deleted = 0
      ),
      duplicate_email AS (
        SELECT 1 AS found
        FROM customers
        WHERE LOWER(email) = LOWER($3::TEXT)
          AND is_deleted = 0
          AND id != $1::INT
        LIMIT 1
      ),
      duplicate_phone AS (
        SELECT 1 AS found
        FROM customers
        WHERE phone = $4::TEXT
          AND is_deleted = 0
          AND id != $1::INT
        LIMIT 1
      ),
      updated AS (
        UPDATE customers
        SET
          name = $2::VARCHAR(255),
          email = LOWER($3::VARCHAR(255)),
          phone = $4::VARCHAR(20),
          password_hash = COALESCE($5::TEXT, (SELECT password_hash FROM target LIMIT 1)),
          is_active = $6::SMALLINT,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1::INT
          AND is_deleted = 0
          AND NOT EXISTS (SELECT 1 FROM duplicate_email)
          AND NOT EXISTS (SELECT 1 FROM duplicate_phone)
        RETURNING
          id,
          name,
          email,
          phone,
          is_active,
          is_deleted,
          created_at,
          updated_at
      )
      SELECT
        EXISTS (SELECT 1 FROM target) AS target_exists,
        EXISTS (SELECT 1 FROM duplicate_email) AS duplicate_email_exists,
        EXISTS (SELECT 1 FROM duplicate_phone) AS duplicate_phone_exists,
        updated.id,
        updated.name,
        updated.email,
        updated.phone,
        updated.is_active,
        updated.is_deleted,
        updated.created_at,
        updated.updated_at
      FROM (SELECT 1) AS base
      LEFT JOIN updated ON TRUE;
    `;

    const values = [id, name, email, phone, passwordHash, isActive];
    const result = await db.query(query, values);
    return result.rows[0] || null;
  },

  deleteCustomer: async (id) => {
    const query = `
      UPDATE customers
      SET
        is_deleted = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND is_deleted = 0
      RETURNING
        id,
        name,
        email,
        phone,
        is_active,
        is_deleted,
        created_at,
        updated_at;
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },
};

module.exports = customerModel;
