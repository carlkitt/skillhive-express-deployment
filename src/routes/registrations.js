const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'skillhivedb',
});

// Simple POST endpoint to create a pending registration
router.post('/', async (req, res) => {
  try {
    const { student_id, full_name, role, username, password } = req.body;
    if (!student_id || !full_name || !role || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Basic username uniqueness check
    const [exists] = await pool.query('SELECT id FROM pending_registrations WHERE username = ?', [username]);
    if (exists.length > 0) return res.status(409).json({ error: 'Username already requested' });

    // Hash password (server-side)
    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO pending_registrations (student_id, full_name, role, username, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [student_id, full_name, role, username, hash]
    );

    res.json({ id: result.insertId, status: 'pending' });
  } catch (err) {
    console.error('Registration error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
