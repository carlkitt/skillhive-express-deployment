const express = require('express');
const router = express.Router();
const { query, pool } = require('../utils/mysqlQuery');

// GET /api/notifications
// Returns notifications for the authenticated user. If JWT/auth middleware
// is not present for this route, it will read an optional user_id query
// parameter for debugging. In production the protected middleware should
// populate req.user_id (this project uses a variety of auth helpers).
router.get('/', async (req, res) => {
  try {
    // prefer authenticated id if available
    const userId = req.user_id || req.query.user_id || req.query.userId || null;
    let rows;
    if (userId) {
      const sql = 'SELECT id, user_id, type, title, message, icon, is_read, created_at, related_id FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 200';
      rows = await query(pool, sql, [userId]);
    } else {
      // return latest global notifications if no user specified
      const sql = 'SELECT id, user_id, type, title, message, icon, is_read, created_at, related_id FROM notifications ORDER BY created_at DESC LIMIT 200';
      rows = await query(pool, sql);
    }
    return res.json({ notifications: rows });
  } catch (err) {
    console.error('GET /api/notifications error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// PATCH /api/notifications/:id/read
// Marks a notification as read for the authenticated user. If req.user_id
// is not available, it will attempt to operate on the row only if it
// belongs to the optional query user_id parameter.
router.patch('/:id/read', async (req, res) => {
  const id = req.params.id;
  try {
    const userId = req.user_id || req.query.user_id || req.query.userId || null;
    // Build parameterized UPDATE to avoid SQL injection
    let result;
    if (userId) {
      const sql = 'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?';
      result = await query(pool, sql, [id, userId]);
    } else {
      const sql = 'UPDATE notifications SET is_read = 1 WHERE id = ?';
      result = await query(pool, sql, [id]);
    }
    return res.json({ success: true, changedRows: result.affectedRows || result.affectedRows === 0 ? result.affectedRows : (result.affectedRows || 0) });
  } catch (err) {
    console.error('PATCH /api/notifications/:id/read error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

module.exports = router;
