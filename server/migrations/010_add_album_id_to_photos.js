const { pool } = require('../db');

const up = async () => {
  await pool.query(`
    ALTER TABLE photos
    ADD COLUMN album_id UUID REFERENCES albums(id) ON DELETE SET NULL;
  `);
  console.log('Migration 010_add_album_id_to_photos up executed successfully');
};

const down = async () => {
  await pool.query('ALTER TABLE photos DROP COLUMN album_id;');
  console.log('Migration 010_add_album_id_to_photos down executed successfully');
};

// Run migration if called directly
if (require.main === module) {
  up()
    .then(async () => {
      console.log('✅ Migration 010 complete!');
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('❌ Migration 010 failed:', err);
      await pool.end();
      process.exit(1);
    });
}

module.exports = { up, down };
