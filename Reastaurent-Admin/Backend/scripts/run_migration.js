const { Client } = require("pg");
require("dotenv").config();

const migrationSql = `
  -- 1. Add sort_order column to category table if not exists
  ALTER TABLE category ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

  -- 2. Add sort_order column to items table if not exists
  ALTER TABLE items ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

  -- 3. Backfill sort_order from id for category
  UPDATE category SET sort_order = id WHERE sort_order = 0;

  -- 4. Backfill sort_order from id for items
  UPDATE items SET sort_order = id WHERE sort_order = 0;

  -- 5. Add indices for sort_order optimization
  CREATE INDEX IF NOT EXISTS idx_category_sort_order ON category (is_deleted, is_active, sort_order, id);
  CREATE INDEX IF NOT EXISTS idx_items_sort_order ON items (category_id, is_deleted, is_active, sort_order, id);
`;

const run = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set in environment");
    process.exit(1);
  }

  console.log("Connecting to database to run migrations...");
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("Connected successfully. Running migration SQL...");
    await client.query(migrationSql);
    console.log("✅ Migration completed successfully!");

    // Verify category columns
    const catCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'category' AND column_name = 'sort_order'
    `);
    console.log("Category sort_order check:", catCheck.rows);

    // Verify items columns
    const itemCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'items' AND column_name = 'sort_order'
    `);
    console.log("Items sort_order check:", itemCheck.rows);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

run();
