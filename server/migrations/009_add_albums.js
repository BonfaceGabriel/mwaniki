const { pool } = require('../db');

const up = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS albums (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Migration 009_add_albums up executed successfully');
};

const down = async () => {
  await pool.query('DROP TABLE albums;');
  console.log('Migration 009_add_albums down executed successfully');
};

// Run migration if called directly
if (require.main === module) {
  up()
    .then(async () => {
      console.log('✅ Migration 009 complete!');
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('❌ Migration 009 failed:', err);
      await pool.end();
      process.exit(1);
    });
}

module.exports = { up, down };
