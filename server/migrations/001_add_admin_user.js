// Load environment variables
require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });
const bcrypt = require("bcrypt");
const { pool } = require("../db");

const saltRounds = 10;

async function migrate() {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@memorial.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  try {
    // Check if the admin user already exists
    const res = await pool.query("SELECT * FROM users WHERE username = $1", [
      adminUsername,
    ]);
    if (res.rows.length > 0) {
      console.log("✅ Admin user already exists.");
      console.log(`   Username: ${adminUsername}`);
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Insert the admin user
    await pool.query(
      "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      [adminUsername, adminEmail, passwordHash, "admin"],
    );
    console.log("✅ Admin user created successfully!");
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Email: ${adminEmail}`);
    console.log("\n⚠️  Please change the password after first login!");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate()
    .then(async () => {
      console.log("\n✅ Migration complete!");
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("\n❌ Migration failed:", err);
      await pool.end();
      process.exit(1);
    });
}

module.exports = migrate;
