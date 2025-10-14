const { pool } = require("../db");

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log("Running migration 008: Enabling multiple photos for tributes...");

    // 1. Create the new tribute_photos table
    console.log("Creating tribute_photos table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS tribute_photos (
        id SERIAL PRIMARY KEY,
        tribute_id VARCHAR(255) NOT NULL REFERENCES tributes(id) ON DELETE CASCADE,
        photo_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ tribute_photos table created.");

    // 2. Migrate existing photos from the tributes table
    console.log("Migrating existing photo_url data...");
    const { rows: tributesWithPhotos } = await client.query(
      "SELECT id, photo_url FROM tributes WHERE photo_url IS NOT NULL AND photo_url != ''"
    );

    if (tributesWithPhotos.length > 0) {
      for (const tribute of tributesWithPhotos) {
        await client.query(
          "INSERT INTO tribute_photos (tribute_id, photo_url) VALUES ($1, $2)",
          [tribute.id, tribute.photo_url]
        );
      }
      console.log(`✅ Migrated ${tributesWithPhotos.length} existing tribute photos.`);
    } else {
      console.log("No existing tribute photos to migrate.");
    }

    // 3. Remove the old photo_url column from the tributes table
    console.log("Removing old photo_url column from tributes table...");
    await client.query(`
      ALTER TABLE tributes
      DROP COLUMN IF EXISTS photo_url;
    `);
    console.log("✅ photo_url column removed.");

    await client.query('COMMIT');
    console.log("✅ Migration 008 completed successfully!");

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Migration 008 failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrate()
    .then(async () => {
      console.log("\n✅ Migration 008 complete!");
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("\n❌ Migration 008 failed:", err);
      await pool.end();
      process.exit(1);
    });
}

module.exports = migrate;
