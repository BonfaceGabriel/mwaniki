const { pool } = require("../db");

async function migrate() {
  try {
    console.log("Running migration 005: Adding payment method fields to site_settings...");

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

    console.log("✅ Migration 005 completed successfully!");
  } catch (err) {
    console.error("❌ Migration 005 failed:", err);
    throw err;
  }
}

if (require.main === module) {
  migrate()
    .then(async () => {
      console.log("\n✅ Migration 005 complete!");
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("\n❌ Migration 005 failed:", err);
      await pool.end();
      process.exit(1);
    });
}

module.exports = migrate;
