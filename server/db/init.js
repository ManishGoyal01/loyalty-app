const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Customer" (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      streak INTEGER DEFAULT 0,
      "lastScan" TEXT,
      history TEXT[] DEFAULT '{}',
      complete BOOLEAN DEFAULT false,
      "joinDate" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "Config" (
      id INTEGER PRIMARY KEY DEFAULT 1,
      "rewardIcon" TEXT DEFAULT '🥛',
      "rewardName" TEXT DEFAULT '1 Milk Packet — FREE',
      "totalClaimed" INTEGER DEFAULT 0
    );
  `);
}

module.exports = { pool, initDB };
