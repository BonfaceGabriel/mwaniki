const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");
const { execSync } = require("child_process");

// Load environment variables before creating pool
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const photosFilePath = path.join(__dirname, "photos.json");
const tributesFilePath = path.join(__dirname, "tributes.json");
const migrationsDir = path.join(__dirname, "migrations");

async function migrateData() {
  const client = await pool.connect();
  try {
    console.log("Connected to PostgreSQL database.");

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id VARCHAR(255) PRIMARY KEY,
        src VARCHAR(255) NOT NULL,
        alt VARCHAR(255),
        caption TEXT,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS tributes (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        relationship VARCHAR(255),
        message TEXT,
        type VARCHAR(255),
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tables checked/created.");

    // Migrate photos
    if (fs.existsSync(photosFilePath)) {
      const photosData = JSON.parse(fs.readFileSync(photosFilePath, "utf8"));
      for (const photo of photosData) {
        const id = photo.id || uuidv4(); // Use existing ID or generate new one
        await client.query(
          "INSERT INTO photos (id, src, alt, caption, timestamp) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING",
          [
            String(id),
            photo.src,
            photo.alt,
            photo.caption,
            photo.timestamp || new Date().toISOString(),
          ],
        );
      }
      console.log(`Migrated ${photosData.length} photos.`);
    } else {
      console.log("photos.json not found, skipping photo migration.");
    }

    // Migrate tributes
    if (fs.existsSync(tributesFilePath)) {
      const tributesData = JSON.parse(
        fs.readFileSync(tributesFilePath, "utf8"),
      );
      for (const tribute of tributesData) {
        const id = tribute.id || uuidv4(); // Use existing ID or generate new one
        await client.query(
          "INSERT INTO tributes (id, name, relationship, message, type, timestamp) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING",
          [
            String(id),
            tribute.name,
            tribute.relationship,
            tribute.message,
            tribute.type,
            tribute.timestamp || new Date().toISOString(),
          ],
        );
      }
      console.log(`Migrated ${tributesData.length} tributes.`);
    } else {
      console.log("tributes.json not found, skipping tribute migration.");
    }

    // Run migrations
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".js"))
        .sort();

      for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        try {
          console.log(`Executing migration: ${file}...`);
          execSync(`node ${filePath}`, {
            stdio: "inherit",
            env: process.env,
           });
          console.log(`Migration ${file} executed successfully.`);
        } catch (error) {
          console.error(`Failed to execute migration ${file}:`, error);
          throw new Error(`Migration ${file} failed.`);
        }
      }
    }

    console.log("Data migration complete.");
  } catch (error) {
    console.error("Error during data migration:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    console.log("Database connection closed.");
  }
}

migrateData();

