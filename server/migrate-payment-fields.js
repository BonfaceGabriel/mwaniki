require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function migrate() {
  try {
    console.log("Adding payment method fields to site_settings...");

    // Insert new payment fields if they don't exist
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

    console.log("✅ Payment fields migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
