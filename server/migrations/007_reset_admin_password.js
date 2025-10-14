const { pool } = require("../db");
const bcrypt = require("bcrypt");

const saltRounds = 10;

async function migrate() {
  const usernameToReset = process.env.ADMIN_USERNAME_TO_RESET;
  const newPassword = process.env.NEW_ADMIN_PASSWORD;

  if (!usernameToReset || !newPassword) {
    console.log("SKIPPING: Admin password reset. Environment variables ADMIN_USERNAME_TO_RESET and NEW_ADMIN_PASSWORD must be set.");
    return;
  }

  try {
    console.log(`Running migration 007: Resetting password for admin user '${usernameToReset}'...`);

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    const { rowCount } = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE username = $2",
      [passwordHash, usernameToReset]
    );

    if (rowCount > 0) {
        console.log(`✅ Migration 007 successful: Password for '${usernameToReset}' has been reset.`);
    } else {
        console.log(`⚠️  Migration 007 warning: No user found with username '${usernameToReset}'. No password was reset.`);
    }

  } catch (err) {
    console.error("❌ Migration 007 failed:", err);
    throw err;
  }
}

if (require.main === module) {
  migrate()
    .then(async () => {
      console.log("\n✅ Migration 007 complete!");
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("\n❌ Migration 007 failed:", err);
      await pool.end();
      process.exit(1);
    });
}

module.exports = migrate;
