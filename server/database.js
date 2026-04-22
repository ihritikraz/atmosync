const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'weather_vault.db');
const db = new Database(dbPath);

/**
 * Initialize the database schema
 */
function initDB() {
  // Metadata table for coordinates
  db.exec(`
    -- Metadata table for coordinates
    CREATE TABLE IF NOT EXISTS coordinates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL,
      lon REAL,
      city_name TEXT,
      last_updated DATETIME,
      UNIQUE(lat, lon)
    );

    -- DAILY records table (Compressed Blob)
    CREATE TABLE IF NOT EXISTS daily_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coord_id INTEGER,
      year INTEGER,
      data BLOB,
      FOREIGN KEY(coord_id) REFERENCES coordinates(id),
      UNIQUE(coord_id, year)
    );

    -- HOURLY records table (Compressed Blob)
    -- We store by month to keep blobs manageable
    CREATE TABLE IF NOT EXISTS hourly_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coord_id INTEGER,
      year INTEGER,
      month INTEGER,
      data BLOB,
      FOREIGN KEY(coord_id) REFERENCES coordinates(id),
      UNIQUE(coord_id, year, month)
    );
  `);
  
  console.log('Weather Vault Database initialized at:', dbPath);
}

module.exports = {
  db,
  initDB
};
