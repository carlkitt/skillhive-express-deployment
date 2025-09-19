const express = require('express');
const jwt = require('jsonwebtoken');
const { query, pool } = require('../utils/mysqlQuery');
const JWT_SECRET = require('../config/secret');

const router = express.Router();

// POST /api/conversation
// Body: { type: 'direct', recipient_id: <int> }
router.post('/', async (req, res) => {
  const auth = req.headers.authorization;
  console.log('Conversation POST auth header:', auth);
  if (!auth) return res.status(401).json({ error: 'Missing token' });
  let payload;
  try {
    const token = auth.split(' ')[1];
  payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
  console.error('Conversation POST jwt verify error:', err && err.message ? err.message : err);
  return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = payload.userId;
  const { type, recipient_id } = req.body || {};
  if (!type || type !== 'direct' || !recipient_id) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    // look for an existing direct conversation containing both users
    const sqlFind = `
      SELECT c.conversation_id FROM conversations c
      JOIN conversation_participants p1 ON c.conversation_id = p1.conversation_id AND p1.user_id = ?
      JOIN conversation_participants p2 ON c.conversation_id = p2.conversation_id AND p2.user_id = ?
      WHERE c.type = 'direct' LIMIT 1`;
    const rows = await query(pool, sqlFind, [userId, recipient_id]);
    if (rows && rows.length > 0) {
      return res.json({ conversation_id: rows[0].conversation_id });
    }

    // create a new conversation
    const sqlCreate = `INSERT INTO conversations (type, created_at) VALUES ('direct', NOW())`;
    const result = await query(pool, sqlCreate);
    const conversationId = result.insertId || (result && result[0] && result[0].insertId) || null;
    if (!conversationId) {
      return res.status(500).json({ error: 'Failed to create conversation' });
    }

    // add participants
    const sqlPart = `INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)`;
    await query(pool, sqlPart, [conversationId, userId, conversationId, recipient_id]);

    return res.status(201).json({ conversation_id: conversationId });
  } catch (err) {
    console.error('Conversation route error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/conversation
// Returns list of conversations for the authenticated user. Each item contains
// conversation_id, user_id (the other participant), full_name, username,
// profile_pic_url, last_message, last_message_time
router.get('/', async (req, res) => {
  const auth = req.headers.authorization;
  console.log('Conversation GET auth header:', auth);
  if (!auth) return res.status(401).json({ error: 'Missing token' });
  let payload;
  try {
    const token = auth.split(' ')[1];
  payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
  console.error('Conversation GET jwt verify error:', err && err.message ? err.message : err);
  return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = payload.userId;
  try {
    // Find conversations where the user is a participant, and include the
    // other participant's user info. Also fetch the most recent message per
    // conversation using a correlated subquery.
    const sql = `
      SELECT c.conversation_id,
             u.user_id AS user_id,
             COALESCE(u.full_name, u.username) AS full_name,
             u.username,
            COALESCE(u.profile_pic_url, '') AS profile_pic_url,
             (SELECT content FROM messages m2 WHERE m2.conversation_id = c.conversation_id ORDER BY m2.created_at DESC LIMIT 1) AS last_message,
             (SELECT created_at FROM messages m3 WHERE m3.conversation_id = c.conversation_id ORDER BY m3.created_at DESC LIMIT 1) AS last_message_time
      FROM conversations c
      JOIN conversation_participants p_self ON c.conversation_id = p_self.conversation_id AND p_self.user_id = ?
      JOIN conversation_participants p_other ON c.conversation_id = p_other.conversation_id AND p_other.user_id != p_self.user_id
      JOIN users u ON u.user_id = p_other.user_id
      ORDER BY last_message_time DESC
    `;

    const rows = await query(pool, sql, [userId]);
    return res.json(rows || []);
  } catch (err) {
    console.error('Conversation GET error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
