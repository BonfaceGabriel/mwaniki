require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  try {
    console.log("Adding photo_url column to tributes table...");
    await pool.query(`
      ALTER TABLE tributes
      ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
    `);
    console.log("✅ Migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
