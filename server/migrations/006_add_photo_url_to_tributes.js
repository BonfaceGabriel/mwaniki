const { pool } = require("../db");

async function migrate() {
  try {
    console.log("Running migration 006: Adding photo_url column to tributes table...");
    await pool.query(`
      ALTER TABLE tributes
      ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
    `);
    console.log("✅ Migration 006 completed successfully!");
  } catch (err) {
    console.error("❌ Migration 006 failed:", err);
    throw err;
  }
}

if (require.main === module) {
  migrate()
    .then(async () => {
      console.log("\n✅ Migration 006 complete!");
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("\n❌ Migration 006 failed:", err);
      await pool.end();
      process.exit(1);
    });
}

module.exports = migrate;
