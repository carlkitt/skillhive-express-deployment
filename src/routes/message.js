const express = require('express');
const jwt = require('jsonwebtoken');
const { query, pool } = require('../utils/mysqlQuery');
const JWT_SECRET = require('../config/secret');

const router = express.Router();

// POST /api/message
// Body: { conversation_id?: int, to_user_id: int, content: string, content_type?: string, metadata?: obj, created_at?: string }
router.post('/', async (req, res) => {
  const auth = req.headers.authorization;
  console.log('Message route auth header:', auth);
  if (!auth) return res.status(401).json({ error: 'Missing token' });
  let payload;
  try {
    const token = auth.split(' ')[1];
    console.log('Message route token:', token);
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('Message route jwt verify error:', err && err.message ? err.message : err);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const fromUserId = payload.userId;
  const { conversation_id, to_user_id, content, content_type, metadata } = req.body || {};
  if (!to_user_id || !content) return res.status(400).json({ error: 'Missing fields' });

  try {
    const contentType = content_type || 'text';
    const metadataStr = metadata ? JSON.stringify(metadata) : null;
    const sql = `INSERT INTO messages (conversation_id, from_user_id, to_user_id, content, content_type, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`;
    const result = await query(pool, sql, [conversation_id || null, fromUserId, to_user_id, content, contentType, metadataStr]);
    const messageId = result && (result.insertId || (result[0] && result[0].insertId));
    return res.status(201).json({ message_id: messageId });
  } catch (err) {
    console.error('Message route error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/message?conversation_id=123
// Returns recent messages for a conversation (most recent first)
router.get('/', async (req, res) => {
  const auth = req.headers.authorization;
  console.log('Message GET auth header:', auth);
  if (!auth) return res.status(401).json({ error: 'Missing token' });
  let payload;
  try {
    const token = auth.split(' ')[1];
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('Message GET jwt verify error:', err && err.message ? err.message : err);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const convId = req.query.conversation_id;
  if (!convId) return res.status(400).json({ error: 'conversation_id required' });

  try {
    const sql = `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 200`;
    try {
      const rows = await query(pool, sql, [convId]);
      return res.json(rows || []);
    } catch (err) {
      // Try to gather column info to help diagnose schema mismatch
      try {
        const cols = await query(pool, 'SHOW COLUMNS FROM messages');
        console.error('Message GET SHOW COLUMNS:', cols);
      } catch (colErr) {
        console.error('Failed to SHOW COLUMNS for messages:', colErr && colErr.message ? colErr.message : colErr);
      }
      throw err;
    }
  } catch (err) {
    console.error('Message GET error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
