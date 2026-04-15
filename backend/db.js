const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config({ path: path.join(__dirname, ".env") });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
});

pool.on("error", (error) => {
  console.error("PostgreSQL pool error:", error.message);
});

async function testConnection() {
  const client = await pool.connect();

  try {
    const result = await client.query("SELECT NOW() AS now, current_database() AS database");
    return result.rows[0];
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  testConnection,
};
