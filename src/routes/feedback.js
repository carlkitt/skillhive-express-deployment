const express = require('express');
const router = express.Router();
const { pool, query } = require('../utils/mysqlQuery');

// GET /api/feedback/:sessionId/:tutorId
router.get('/:sessionId/:tutorId', async (req, res) => {
  const { sessionId, tutorId } = req.params;
  // Attempt to read Authorization Bearer token to detect current user for per-request isHelpful
  const auth = req.headers.authorization;
  let currentUserId = null;
  if (auth) {
    try {
      const token = auth.split(' ')[1];
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = require('../config/secret');
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload && payload.userId) currentUserId = Number(payload.userId);
    } catch (err) {
      // If token invalid, ignore and treat as anonymous
      console.warn('Feedback GET jwt verify warning:', err && err.message ? err.message : err);
      currentUserId = null;
    }
  }
  try {
    // Assume feedback table now stores `user_id` (FK to users.user_id).
    // Join users to resolve display name (prefer full_name, fallback to username).
    // Left join feedback_helpful for the current user (if present) to compute isHelpful
    const sql = `SELECT
        f.id AS id,
        u.profile_pic_url AS profileUrl,
        COALESCE(u.username, u.full_name) AS name,
        f.user_id AS userId,
        f.helpful_count AS helpfulCount,
        f.rating,
        f.comment,
        f.date,
        f.tutor_id AS tutorId,
        f.session_id AS sessionId,
        (CASE WHEN fh.id IS NOT NULL THEN 1 ELSE 0 END) AS isHelpful
      FROM feedback f
      LEFT JOIN users u ON u.user_id = f.user_id
      LEFT JOIN feedback_helpful fh ON fh.feedback_id = f.id AND fh.user_id = ?
      WHERE f.session_id = ? AND f.tutor_id = ?
      ORDER BY f.date DESC`;

    const params = [currentUserId || 0, sessionId, tutorId];
    const results = await query(pool, sql, params);

    if (!results || results.length === 0) {
      return res.json([]);
    }

    // Ensure correct types for frontend
    const baseUrl = (process.env.API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const feedbacks = results.map(f => {
      // normalize profileUrl: if it's a relative assets path, prefix with baseUrl
      let profileUrl = f.profileUrl || '';
      try {
        const s = (profileUrl || '').toString();
        if (s.length > 0 && !s.startsWith('http://') && !s.startsWith('https://')) {
          // ensure leading slash
          const pathPart = s.startsWith('/') ? s : `/${s}`;
          profileUrl = `${baseUrl}${pathPart}`;
        }
      } catch (e) {}

      return {
        ...f,
        profileUrl,
        rating: Number(f.rating) || 0,
        helpfulCount: Number(f.helpfulCount) || 0,
        isHelpful: !!f.isHelpful,
        date: f.date ? new Date(f.date).toISOString() : null,
      };
    });
    res.json(feedbacks);
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/feedback/:feedbackId/helpful - toggle helpful for the authenticated user
router.post('/:feedbackId/helpful', async (req, res) => {
  const { feedbackId } = req.params;
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing token' });
  let payload;
  try {
    const token = auth.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = require('../config/secret');
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('Feedback helpful jwt verify error:', err && err.message ? err.message : err);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = payload && payload.userId;
  if (!userId) return res.status(400).json({ error: 'Invalid user in token' });

  let conn;
  // promisified helpers for connection and transaction control
  const getConnection = () => new Promise((resolve, reject) => pool.getConnection((err, connection) => err ? reject(err) : resolve(connection)));
  const beginTransaction = (c) => new Promise((resolve, reject) => c.beginTransaction(err => err ? reject(err) : resolve()));
  const commit = (c) => new Promise((resolve, reject) => c.commit(err => err ? reject(err) : resolve()));
  const rollback = (c) => new Promise((resolve, reject) => c.rollback(err => err ? reject(err) : resolve()));

  try {
    conn = await getConnection();
    await beginTransaction(conn);

    // Check whether the user already marked helpful
    const existing = await query(conn, 'SELECT id FROM feedback_helpful WHERE feedback_id = ? AND user_id = ?', [feedbackId, userId]);
    let isHelpful = false;
    if (existing && existing.length > 0) {
      // Remove the helpful mark
      await query(conn, 'DELETE FROM feedback_helpful WHERE feedback_id = ? AND user_id = ?', [feedbackId, userId]);
      await query(conn, 'UPDATE feedback SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = ?', [feedbackId]);
      isHelpful = false;
    } else {
      // Insert helpful mark
      await query(conn, 'INSERT INTO feedback_helpful (feedback_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP', [feedbackId, userId]);
      await query(conn, 'UPDATE feedback SET helpful_count = IFNULL(helpful_count, 0) + 1 WHERE id = ?', [feedbackId]);
      isHelpful = true;
    }

    // Get current helpful_count
    const rows = await query(conn, 'SELECT helpful_count FROM feedback WHERE id = ?', [feedbackId]);
    const helpfulCount = rows && rows[0] ? Number(rows[0].helpful_count || 0) : 0;

    await commit(conn);
    res.json({ feedbackId: Number(feedbackId), helpfulCount, isHelpful });
  } catch (err) {
    if (conn) {
      try { await rollback(conn); } catch (e) { console.error('Rollback failed:', e); }
    }
    console.error('Error toggling helpful:', err);
    res.status(500).json({ error: err && err.message ? err.message : String(err) });
  } finally {
    if (conn && typeof conn.release === 'function') conn.release();
  }
});

module.exports = router;
