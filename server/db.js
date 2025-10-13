// Load environment variables - tries .env first, then .env.production
require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id VARCHAR(255) PRIMARY KEY,
        src VARCHAR(255) NOT NULL,
        alt VARCHAR(255),
        caption TEXT,
        name VARCHAR(255),
        email VARCHAR(255),
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tributes (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        relationship VARCHAR(255),
        message TEXT,
        type VARCHAR(255),
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS eulogy_content (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL DEFAULT ''
      );
    `);
    console.log("eulogy_content table created or already exists.");

    // Insert an initial row if it doesn't exist
    const res = await pool.query("SELECT COUNT(*) FROM eulogy_content");
    if (parseInt(res.rows[0].count) === 0) {
      await pool.query("INSERT INTO eulogy_content (content) VALUES ($1)", [
        "",
      ]);
      console.log("Initial empty row inserted into eulogy_content.");
    } else {
      console.log("eulogy_content already contains data.");
    }

    // Create site_settings table for customizable content
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(255) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("site_settings table created or already exists.");

    // Create information_events table for memorial events
    await pool.query(`
      CREATE TABLE IF NOT EXISTS information_events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date VARCHAR(255),
        time VARCHAR(255),
        venue TEXT,
        content TEXT,
        type VARCHAR(50),
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("information_events table created or already exists.");

    // Insert default settings if they don't exist
    const settingsRes = await pool.query("SELECT COUNT(*) FROM site_settings");
    if (parseInt(settingsRes.rows[0].count) === 0) {
      const defaultSettings = [
        ['deceased_name', 'John Doe'],
        ['deceased_nickname', ''],
        ['birth_year', '1950'],
        ['death_year', '2024'],
        ['profile_photo_url', '/lovable-uploads/placeholder-profile.png'],
        ['background_photo_url', '/lovable-uploads/placeholder-background.jpg'],
        ['roles_titles', 'Father • Leader • Mentor • Friend'],
        ['life_summary', 'It is with deep sorrow and heavy hearts that we remember the life of our beloved [Name], who passed away peacefully.'],
        ['memorial_event_1_title', 'Memorial Service'],
        ['memorial_event_1_date', 'Date TBD'],
        ['memorial_event_1_location', 'Location TBD'],
        ['memorial_event_2_title', 'Funeral Service'],
        ['memorial_event_2_date', 'Date TBD'],
        ['memorial_event_2_location', 'Location TBD'],
        ['paybill_number', ''],
        ['paybill_account_name', 'Your Name'],
        ['family_name', 'The Family']
      ];

      for (const [key, value] of defaultSettings) {
        await pool.query(
          "INSERT INTO site_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO NOTHING",
          [key, value]
        );
      }
      console.log("Default site settings inserted.");
    } else {
      console.log("site_settings already contains data.");
    }

    // Insert default information events if they don't exist
    const eventsRes = await pool.query("SELECT COUNT(*) FROM information_events");
    if (parseInt(eventsRes.rows[0].count) === 0) {
      const defaultEvents = [
        {
          title: 'Daily Prayer & Support Gatherings',
          date: 'Dates TBD',
          time: '5:00 PM — 7:30 PM',
          venue: 'Location TBD',
          content: 'We invite friends and family for daily evening prayers and support gatherings.',
          type: 'event',
          display_order: 1
        },
        {
          title: 'Memorial Mass',
          date: 'Date TBD',
          time: '2:00 PM — 3:30 PM',
          venue: 'Location TBD',
          content: 'A formal memorial mass to celebrate the life and legacy.',
          type: 'announcement',
          display_order: 2
        },
        {
          title: 'Funeral Service & Final Farewell',
          date: 'Date TBD',
          time: '10:00 AM onwards',
          venue: 'Location TBD',
          content: 'The final funeral service and interment will take place.',
          type: 'service',
          display_order: 3
        }
      ];

      for (const event of defaultEvents) {
        await pool.query(
          "INSERT INTO information_events (title, date, time, venue, content, type, display_order) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [event.title, event.date, event.time, event.venue, event.content, event.type, event.display_order]
        );
      }
      console.log("Default information events inserted.");
    } else {
      console.log("information_events already contains data.");
    }

    console.log("Database tables checked/created successfully.");
  } catch (err) {
    console.error("Error initializing database:", err);
    throw err;
  }
}

// Run init if called directly (not imported by another module)
if (require.main === module) {
  initDb()
    .then(async () => {
      console.log("✅ Database initialization complete!");
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Database initialization failed:", err);
      await pool.end();
      process.exit(1);
    });
}

module.exports = {
  pool,
  initDb,
};
