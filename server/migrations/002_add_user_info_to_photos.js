// migrations/002_add_user_info_to_photos.js
module.exports = async function (client) {
  try {
    await client.query(`
      ALTER TABLE photos
      ADD COLUMN IF NOT EXISTS name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    `);
    console.log(
      "Migration 002 successful: Added name and email columns to photos table.",
    );
  } catch (error) {
    console.error("Error running migration 002:", error);
    throw error;
  }
};
