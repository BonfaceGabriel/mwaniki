// migrations/003_add_rls_policy_to_photos.js
module.exports = async function (client) {
  try {
    // It's good practice to first remove any existing policy to avoid conflicts.
    await client.query(`
      DROP POLICY IF EXISTS "Public photo uploads" ON photos;
    `);

    // Enable Row Level Security on the photos table if it's not already.
    await client.query(`
      ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
    `);

    // Create a policy that allows anyone (public) to insert into the photos table.
    await client.query(`
      CREATE POLICY "Public photo uploads" ON photos
      FOR INSERT
      TO public
      WITH CHECK (true);
    `);

    console.log(
      "Migration 003 successful: Enabled RLS and added public insert policy to photos table.",
    );
  } catch (error) {
    console.error("Error running migration 003:", error);
    throw error;
  }
};

