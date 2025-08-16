const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const users = require('../models/user');
const JWT_SECRET = require('../config/secret');

const router = express.Router();

// Add rate limiter: max 5 requests per minute per IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again later.' }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  console.log('Received username:', username);
  console.log('Received password:', password);

  if (!password) {
    console.log('No password provided');
    return res.status(400).json({ error: 'Password is required.' });
  }

  try {
    const user = await users.findUserByCredentials(username, password);
    if (!user) {
      console.log('User not found or password mismatch');
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user.user_id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user_id: user.user_id, is_verified: user.is_verified });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
