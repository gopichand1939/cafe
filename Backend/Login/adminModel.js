const db = require("../config/db");

const ensureAdminTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS admin (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(20),
      profile_image VARCHAR(255),
      password_hash TEXT NOT NULL,
      current_session_id TEXT,
      session_expires_at TIMESTAMPTZ,
      refresh_token_hash TEXT,
      refresh_token_expires_at TIMESTAMPTZ,
      reset_password_token_hash TEXT,
      reset_password_expires_at TIMESTAMPTZ,
      last_login_at TIMESTAMPTZ,
      is_active SMALLINT NOT NULL DEFAULT 1,
      is_deleted SMALLINT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const alterTableQuery = `
    ALTER TABLE admin
    ADD COLUMN IF NOT EXISTS current_session_id TEXT,
    ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT,
    ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reset_password_token_hash TEXT,
    ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_active SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_deleted SMALLINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
  `;

  await db.query(createTableQuery);
  await db.query(alterTableQuery);
};

const sanitizeAdmin = (row) => {
  if (!row) {
    return null;
  }

  const {
    password_hash,
    current_session_id,
    refresh_token_hash,
    reset_password_token_hash,
    ...admin
  } = row;

  return admin;
};

const adminModel = {
  ensureAdminTable,

  countAdmins: async () => {
    const query = `
      SELECT COUNT(*)::INT AS total
      FROM admin
      WHERE is_deleted = 0;
    `;

    const result = await db.query(query);
    return result.rows[0]?.total || 0;
  },

  createAdmin: async ({ name, email, phone, passwordHash }) => {
    const query = `
      INSERT INTO admin (name, email, phone, password_hash)
      VALUES ($1, LOWER($2), $3, $4)
      RETURNING
        id,
        name,
        email,
        phone,
        profile_image,
        session_expires_at,
        last_login_at,
        is_active,
        is_deleted,
        created_at,
        updated_at;
    `;

    const result = await db.query(query, [name, email, phone, passwordHash]);
    return result.rows[0] || null;
  },

  getAdminByEmail: async (email) => {
    const query = `
      SELECT *
      FROM admin
      WHERE email = LOWER($1)
        AND is_deleted = 0
      LIMIT 1;
    `;

    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  },

  getAdminById: async (id) => {
    const query = `
      SELECT
        id,
        name,
        email,
        phone,
        profile_image,
        session_expires_at,
        last_login_at,
        is_active,
        is_deleted,
        created_at,
        updated_at
      FROM admin
      WHERE id = $1
        AND is_deleted = 0
      LIMIT 1;
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  getAdminForSessionValidation: async (id) => {
    const query = `
      SELECT *
      FROM admin
      WHERE id = $1
        AND is_deleted = 0
      LIMIT 1;
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  updateLoginSession: async (id, sessionId, refreshTokenHash, refreshTokenExpiresAt) => {
    const query = `
      UPDATE admin
      SET
        current_session_id = $2,
        session_expires_at = $4,
        refresh_token_hash = $3,
        refresh_token_expires_at = $4,
        last_login_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND is_deleted = 0
      RETURNING
        id,
        name,
        email,
        phone,
        profile_image,
        session_expires_at,
        last_login_at,
        is_active,
        is_deleted,
        created_at,
        updated_at;
    `;

    const result = await db.query(query, [id, sessionId, refreshTokenHash, refreshTokenExpiresAt]);
    return result.rows[0] || null;
  },

  clearSession: async (id, sessionId = null) => {
    const values = [id];
    let query = `
      UPDATE admin
      SET
        current_session_id = NULL,
        session_expires_at = NULL,
        refresh_token_hash = NULL,
        refresh_token_expires_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND is_deleted = 0
    `;

    if (sessionId) {
      values.push(sessionId);
      query += ` AND current_session_id = $2`;
    }

    query += `
      RETURNING
        id,
        name,
        email,
        phone,
        profile_image,
        session_expires_at,
        last_login_at,
        is_active,
        is_deleted,
        created_at,
        updated_at;
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  },

  setResetPasswordToken: async (email, resetTokenHash, resetTokenExpiresAt) => {
    const query = `
      UPDATE admin
      SET
        reset_password_token_hash = $2,
        reset_password_expires_at = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = LOWER($1)
        AND is_deleted = 0
      RETURNING id, email;
    `;

    const result = await db.query(query, [email, resetTokenHash, resetTokenExpiresAt]);
    return result.rows[0] || null;
  },

  getAdminByResetTokenHash: async (resetTokenHash) => {
    const query = `
      SELECT *
      FROM admin
      WHERE reset_password_token_hash = $1
        AND reset_password_expires_at > CURRENT_TIMESTAMP
        AND is_deleted = 0
      LIMIT 1;
    `;

    const result = await db.query(query, [resetTokenHash]);
    return result.rows[0] || null;
  },

  updatePassword: async (id, passwordHash) => {
    const query = `
      UPDATE admin
      SET
        password_hash = $2,
        current_session_id = NULL,
        session_expires_at = NULL,
        refresh_token_hash = NULL,
        refresh_token_expires_at = NULL,
        reset_password_token_hash = NULL,
        reset_password_expires_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND is_deleted = 0
      RETURNING
        id,
        name,
        email,
        phone,
        profile_image,
        session_expires_at,
        last_login_at,
        is_active,
        is_deleted,
        created_at,
        updated_at;
    `;

    const result = await db.query(query, [id, passwordHash]);
    return result.rows[0] || null;
  },

  sanitizeAdmin,
};

module.exports = adminModel;
