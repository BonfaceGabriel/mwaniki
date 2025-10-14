require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  console.log("🚀 Starting database migrations...");

  try {
    // Migration 1: Add name and email columns to photos table
    console.log("📸 Migration 1: Adding name and email columns to photos table...");
    await pool.query(`
      ALTER TABLE photos
      ADD COLUMN IF NOT EXISTS name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    `);
    console.log("✅ Migration 1 completed!");

    // Migration 2: Add payment fields to site_settings
    console.log("💳 Migration 2: Adding payment method fields...");

    const paymentSettings = [
      ['mpesa_phone_number', ''],
      ['bank_name', ''],
      ['bank_account_number', ''],
      ['bank_account_name', ''],
    ];

    for (const [key, value] of paymentSettings) {
      await pool.query(
        "INSERT INTO site_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO NOTHING",
        [key, value]
      );
    }
    console.log("✅ Migration 2 completed!");

    // Migration 3: Add photo_url column to tributes table
    console.log("📷 Migration 3: Adding photo_url column to tributes table...");
    await pool.query(`
      ALTER TABLE tributes
      ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
    `);
    console.log("✅ Migration 3 completed!");

    console.log("🎉 All migrations completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
