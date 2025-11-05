const { pool } = require('../db');

const up = async () => {
  await pool.query(`
    CREATE TABLE albums (
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

module.exports = { up, down };
