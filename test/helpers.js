const mysql = require('mysql2/promise');

async function getDb() {
  const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  // support both DB_PASSWORD and DB_PASS env names
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'skillhivedb',
  });
  return conn;
}

module.exports = { getDb };
