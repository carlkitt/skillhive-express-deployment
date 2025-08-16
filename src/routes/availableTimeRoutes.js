const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'bjhvgr90ewlwfy7hvrrp-mysql.services.clever-cloud.com',
    user: process.env.DB_USER || 'umhwrkzsbn2bdp7p',
    password: process.env.DB_PASSWORD || '0EjHTPEKuIGD9jXtEPbK',
    database: process.env.DB_NAME || 'bjhvgr90ewlwfy7hvrrp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// GET /available-times
router.get('/available-times', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT day, time, booked, capacity, ongoing FROM available_times'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

module.exports = router;