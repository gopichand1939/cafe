const { Pool } = require("pg");
require("dotenv").config();

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "postgres",
    };

const pool = new Pool(poolConfig);

async function runMigration() {
  console.log("Starting DB migration for items.is_veg column...");
  const client = await pool.connect();
  try {
    // Check current column type
    const res = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'items' AND column_name = 'is_veg';
    `);

    if (res.rows.length === 0) {
      console.log("Column is_veg not found in items table!");
      return;
    }

    const dataType = res.rows[0].data_type;
    console.log(`Current data type of is_veg: ${dataType}`);

    if (dataType.toLowerCase().includes("char")) {
      console.log("Column is_veg is already a character/varchar type. No migration needed.");
      return;
    }

    console.log("Altering column is_veg to VARCHAR(50) and migrating existing data...");
    
    // First, drop the default constraint and the CHECK constraint to avoid integer vs varchar type issues
    await client.query(`
      ALTER TABLE items ALTER COLUMN is_veg DROP DEFAULT;
      ALTER TABLE items DROP CONSTRAINT IF EXISTS items_is_veg_allowed_values;
    `);

    // Next, alter the column type and migrate the existing data
    await client.query(`
      ALTER TABLE items 
      ALTER COLUMN is_veg TYPE VARCHAR(50) 
      USING (
        CASE 
          WHEN is_veg = 1 THEN 'Vegan'
          WHEN is_veg = 0 THEN 'Halal'
          ELSE 'Not applicable'
        END
      );
    `);
    
    // Set the new default value for is_veg column to 'Not applicable'
    await client.query(`
      ALTER TABLE items
      ALTER COLUMN is_veg SET DEFAULT 'Not applicable';
    `);

    // Add a new CHECK constraint for the VARCHAR allowed values
    await client.query(`
      ALTER TABLE items ADD CONSTRAINT items_is_veg_allowed_values CHECK (is_veg IN ('Vegan', 'Halal', 'Not applicable'));
    `);

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
