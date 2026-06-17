const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runExplain() {
  const client = await pool.connect();
  try {
    console.log("Analyzing Category Query...");
    const catPlan = await client.query(`
      EXPLAIN ANALYZE
      SELECT
        id,
        category_name,
        category_description,
        category_image,
        created_at,
        updated_at,
        is_deleted,
        is_active,
        is_veg_nonveg_applicable,
        COUNT(*) OVER()::INT AS total_records
      FROM category
      WHERE is_deleted = 0
      ORDER BY id DESC
      LIMIT 500 OFFSET 0
    `);
    console.log(catPlan.rows.map(r => r["QUERY PLAN"]).join("\n"));

    console.log("\nAnalyzing Items Query...");
    const itemPlan = await client.query(`
      EXPLAIN ANALYZE
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
        COUNT(*) OVER()::INT AS total_records
      FROM items
      LEFT JOIN category ON category.id = items.category_id
      WHERE items.is_deleted = 0
      ORDER BY items.id DESC
      LIMIT 1000 OFFSET 0
    `);
    console.log(itemPlan.rows.map(r => r["QUERY PLAN"]).join("\n"));

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

runExplain();
