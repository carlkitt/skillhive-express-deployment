const router = require('express').Router();
const { pool, query } = require('../utils/mysqlQuery');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/secret');

// Ensure session_participants table exists (safe to call on each request path)
async function ensureTable() {
  const sql = `CREATE TABLE IF NOT EXISTS session_participants (
    id INT(11) NOT NULL AUTO_INCREMENT,
    session_id INT(11) NOT NULL,
    user_id INT(11) NOT NULL,
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_session_user (session_id, user_id),
    KEY idx_session (session_id),
    KEY idx_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`;
  try {
    await query(pool, sql);
  } catch (e) {
    console.error('Failed to ensure session_participants table', e && e.message ? e.message : e);
  }
}

// POST /:id/participant -> report that the authenticated user joined the session
router.post('/:id/participant', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing token' });
  let payload;
  try {
    const token = auth.split(' ')[1];
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const userId = payload.userId;
  const sessionId = req.params.id;
  if (!sessionId) return res.status(400).json({ error: 'session id required' });

  try {
    await ensureTable();
    try {
      // attempt to read the user's role to populate the session_participants.role column if present
      let role = 'student';
      try {
        const r = await query(pool, 'SELECT role FROM users WHERE user_id = ? LIMIT 1', [userId]);
        if (r && r.length && r[0] && r[0].role) role = r[0].role;
      } catch (_) {
        // ignore user role lookup failures; proceed with default
      }

      // Try an extended insert matching the actual DB table (role, is_present, left_at, created_at)
      const extendedSql = `INSERT INTO session_participants (session_id, user_id, role, joined_at, left_at, is_present, created_at)
        VALUES (?, ?, ?, NOW(), NULL, 1, NOW())
        ON DUPLICATE KEY UPDATE joined_at = VALUES(joined_at), is_present = 1, left_at = NULL`;
      try {
        await query(pool, extendedSql, [sessionId, userId, role]);
        return res.json({ ok: true });
      } catch (e) {
        // If the extended insert fails because columns don't exist, try a simpler insert
        if (e && e.code === 'ER_BAD_FIELD_ERROR') {
          const simpleSql = `INSERT INTO session_participants (session_id, user_id, joined_at) VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE joined_at = VALUES(joined_at)`;
          await query(pool, simpleSql, [sessionId, userId]);
          return res.json({ ok: true, fallback: true });
        }
        throw e;
      }
    } catch (e) {
      try {
        const p = require('path');
        const fs = require('fs');
        const logDir = p.join(__dirname, '..', 'logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const msg = `${new Date().toISOString()} insert session participant error: ${e && e.stack ? e.stack : (e && e.message ? e.message : JSON.stringify(e))}\n`;
  // write to a dedicated file and also append to the main requests log for visibility
  try { fs.appendFileSync(p.join(logDir, 'session_errors.log'), msg); } catch(_) {}
  try { fs.appendFileSync(p.join(logDir, 'requests.log'), msg); } catch(_) {}
  console.error('Failed to insert session participant; logged to session_errors.log and requests.log');
      } catch (ee) {
        console.error('Failed to write session error log', ee && ee.message ? ee.message : ee);
      }
  const debugInfo = (process.env.NODE_ENV !== 'production') ? { message: e && e.message ? e.message : String(e), code: e && e.code ? e.code : undefined, sqlMessage: e && e.sqlMessage ? e.sqlMessage : undefined } : undefined;
  return res.status(500).json(Object.assign({ error: 'Server error' }, debugInfo ? { debug: debugInfo } : {}));
    }
  } catch (e) {
    console.error('session participant route error', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id/participants -> list participants for a session
router.get('/:id/participants', async (req, res) => {
  const sessionId = req.params.id;
  if (!sessionId) return res.status(400).json({ error: 'session id required' });
  try {
    await ensureTable();
    const sql = `SELECT sp.user_id AS user_id, sp.joined_at AS joined_at,
      COALESCE(u.full_name, u.fullname, u.username, '') AS full_name,
      COALESCE(u.profile_pic_url, u.profile_pic) AS profile_pic_url
      FROM session_participants sp
      LEFT JOIN users u ON u.user_id = sp.user_id
      WHERE sp.session_id = ?
      ORDER BY sp.joined_at ASC`;
    const rows = await query(pool, sql, [sessionId]);
    return res.json({ participants: rows || [] });
  } catch (e) {
    console.error('Failed to fetch session participants', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id/participant -> report leave for authenticated user
router.delete('/:id/participant', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing token' });
  let payload;
  try {
    const token = auth.split(' ')[1];
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const userId = payload.userId;
  const sessionId = req.params.id;
  if (!sessionId) return res.status(400).json({ error: 'session id required' });

  try {
    await ensureTable();
    const [result] = await pool.query('DELETE FROM session_participants WHERE session_id = ? AND user_id = ?', [sessionId, userId]);
    return res.json({ ok: true, deleted: (result && (result.affectedRows || result.affected) ? (result.affectedRows || result.affected) : 0) });
  } catch (e) {
    console.error('Failed to delete session participant', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
