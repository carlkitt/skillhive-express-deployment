const express = require('express');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/secret');

const router = express.Router();

router.get('/protected', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  try {
    const token = auth.split(' ')[1];
    jwt.verify(token, JWT_SECRET);
    res.json({ message: 'Protected data' });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
