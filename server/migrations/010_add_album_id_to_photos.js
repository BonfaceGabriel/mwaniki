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

module.exports = { up, down };
