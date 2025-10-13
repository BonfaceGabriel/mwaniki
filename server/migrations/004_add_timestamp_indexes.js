require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env.production") });
const { pool } = require("../db");

async function run() {
  try {
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_photos_timestamp ON photos (timestamp DESC);",
    );
    console.log("Index on photos.timestamp created successfully.");

    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_tributes_timestamp ON tributes (timestamp DESC);",
    );
    console.log("Index on tributes.timestamp created successfully.");
  } catch (err) {
    console.error("Error creating indexes:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  run().finally(() => pool.end());
}

module.exports = run;

