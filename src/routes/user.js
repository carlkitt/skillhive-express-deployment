const express = require('express');
const router = express.Router();
const users = require('../models/user');
const jwt = require('jsonwebtoken');
const { query, pool } = require('../utils/mysqlQuery');
const JWT_SECRET = require('../config/secret');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');

// Multer memory storage — we write files ourselves after validating username
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only jpg, jpeg and png files are allowed'));
  },
});

// GET /api/user - return all users
router.get('/', async (req, res) => {
  try {
    const allUsers = await users.getAllUsers();
    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/search?q=... - search users by id, username or full_name
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.json([]);
  try {
    const like = `%${q}%`;
    // Use the exported pool from the users model to run a safe parameterized query
    const [rows] = await users.pool.query(
      'SELECT * FROM users WHERE user_id = ? OR username LIKE ? OR full_name LIKE ? LIMIT 50',
      [q, like, like]
    );
    if (!rows || rows.length === 0) return res.status(404 ).json({ error: 'User not found' });
    const mapped = rows.map(r => {
      const normalized = Object.assign({}, r);
      normalized.id = r.user_id ?? r.id ?? '';
      normalized.profile_pic_url = (r.profile_pic_url || r.profile_pic || r.profile_picture || '').toString();
      return normalized;
    });
    res.json(mapped);
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/user/:id - return single user
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await users.getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Normalize common profile fields so frontend can rely on consistent keys
    const normalized = Object.assign({}, user);
    normalized.id = user.user_id ?? user.id ?? '';
    normalized.profile_pic_url = (user.profile_pic_url || user.profile_pic || user.profile_picture || '').toString();
    // If your DB has a different column for border/badge adjust mappings here
    normalized.profile_border_url = (user.profile_border_url || user.profile_border || '').toString();
    // Map current_badge or badge_url to badge_url
    normalized.badge_url = (user.badge_url || user.current_badge || user.badge || '').toString();
    // Normalize contact number (support legacy column names)
    normalized.contact_number = (user.contact_number || user.contact_num || user.contact || '').toString();

    // Return consistent object wrapper
    res.json({ user: normalized });
  } catch (err) {
    console.error('Error fetching user by id:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/user/:user_id/stats
router.get('/:user_id/stats', async (req, res) => {
  const { user_id } = req.params;
  try {
    const stats = await users.getUserStatsById(user_id);
    if (!stats) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(stats);
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/user/:user_id/bookings
// Return bookings for a user joined with available_times and sessions
router.get('/:user_id/bookings', async (req, res) => {
  const { user_id } = req.params;
  try {
    // bookings.user_id stores users.student_id_no in this schema. Allow callers
    // to pass either the student_id_no OR the numeric users.user_id. If a
    // users.user_id was provided, resolve its student_id_no and query by that.
    let bookingUserId = user_id;
    try {
      const userRows = await query(pool, 'SELECT student_id_no FROM users WHERE user_id = ? LIMIT 1', [user_id]);
      if (userRows && userRows.length > 0 && userRows[0].student_id_no) {
        bookingUserId = userRows[0].student_id_no.toString();
      }
    } catch (e) {
      // Non-fatal: if lookup fails we'll just use the provided param
    }

    const sql = `
      SELECT b.*, at.topic_title AS at_topic_title, at.topic_description AS at_topic_description,
             at.day AS at_day, at.time AS at_time, at.id AS at_id,
             s.title AS s_title, s.price AS s_price, s.session_id AS s_id
      FROM bookings b
      LEFT JOIN available_times at ON at.id = b.available_time_id
      LEFT JOIN sessions s ON s.session_id = b.session_id
      WHERE b.user_id = ?
      ORDER BY b.booked_at DESC
      LIMIT 200
    `;
    const rows = await query(pool, sql, [bookingUserId]);

    const mapped = (rows || []).map(r => {
      // Create nested available_time and session objects for frontend convenience
      const available_time = {
        id: r.at_id || r.available_time_id || null,
        topic_title: r.at_topic_title || r.topic_title || '',
        topic_description: r.at_topic_description || r.topic_description || '',
        day: r.at_day || r.day || '',
        time: r.at_time || r.time || '',
      };
      const session = {
        session_id: r.s_id || r.session_id || null,
        title: r.s_title || r.title || '',
        price: r.s_price || r.price || null,
      };
      // Return original booking fields plus nested objects
      const out = Object.assign({}, r);
      out.available_time = available_time;
      out.session = session;
      return out;
    });

    return res.json({ bookings: mapped });
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/user/status - update a user's status (requires Authorization Bearer token)
router.post('/status', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing token' });

  let payload;
  try {
    const token = auth.split(' ')[1];
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('User status jwt verify error:', err && err.message ? err.message : err);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const fromUserId = payload.userId;
  const { user_id, status } = req.body || {};
  const targetId = user_id || fromUserId;

  if (!status) return res.status(400).json({ error: 'Missing status' });

  try {
    // Update STATUS column (database uses STATUS in several queries)
    const sql = 'UPDATE users SET STATUS = ? WHERE user_id = ?';
    await query(pool, sql, [status, targetId]);
    return res.json({ ok: true, user_id: targetId, status });
  } catch (err) {
    console.error('Error updating user status:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/user/:id - update allowed profile fields for the authenticated user
router.patch('/:id', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing token' });

  let payload;
  try {
    const token = auth.split(' ')[1];
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('User PATCH jwt verify error:', err && err.message ? err.message : err);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { id } = req.params;
  const callingUserId = payload.userId && payload.userId.toString ? payload.userId.toString() : String(payload.userId);
  if (!callingUserId || callingUserId !== id.toString()) {
    return res.status(403).json({ error: 'Forbidden: can only update own profile' });
  }

  // Accept both new 'contact_number' and legacy 'contact_num' keys from clients
  // Map incoming keys to actual DB column names to avoid duplicate/invalid assignments
  const keyToColumn = {
    username: 'username',
    email: 'email',
    contact_number: 'contact_number',
    contact_num: 'contact_number', // legacy -> map to new column
    contact: 'contact_number',     // even older/other shape
    full_name: 'full_name',
    profile_pic_url: 'profile_pic_url',
  };

  const updates = [];
  const params = [];
  const seenColumns = new Set();
  for (const key of Object.keys(keyToColumn)) {
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, key)) {
      const col = keyToColumn[key];
      if (seenColumns.has(col)) continue; // don't add same column twice
      updates.push(`${col} = ?`);
      params.push(req.body[key]);
      seenColumns.add(col);
    }
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No updatable fields provided' });

  try {
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`;
    params.push(id);
    await query(pool, sql, params);
    return res.json({ ok: true, user_id: id });
  } catch (err) {
    console.error('Error updating user profile:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/user/:id/avatar - upload profile picture (authenticated)
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
  console.log('[Avatar] received request:', req.method, req.originalUrl);
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing token' });

  let payload;
  try {
    const token = auth.split(' ')[1];
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('Avatar upload jwt verify error:', err && err.message ? err.message : err);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { id } = req.params;
  const callingUserId = payload.userId && payload.userId.toString ? payload.userId.toString() : String(payload.userId);
  if (!callingUserId || callingUserId !== id.toString()) {
    return res.status(403).json({ error: 'Forbidden: can only upload own avatar' });
  }

  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Fetch user to get username
    const user = await users.getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const usernameRaw = (user.username || user.user_id || `user_${id}`).toString();
    const username = usernameRaw.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();

    // Determine extension from original filename or mimetype
    const orig = req.file.originalname || '';
    let ext = path.extname(orig).toLowerCase();
    if (!ext) {
      // fallback based on mimetype
      if (req.file.mimetype === 'image/png') ext = '.png';
      else if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/jpg') ext = '.jpg';
      else ext = '.jpg';
    }

    const filename = `${username}${ext}`;
    const destDir = path.join(__dirname, '..', 'assets', 'images', 'profile_icons');
    const destPath = path.join(destDir, filename);

    // Ensure dest folder exists
    await fs.mkdir(destDir, { recursive: true });
    // Write file
    await fs.writeFile(destPath, req.file.buffer);

    // Save URL in DB (serve static files from /assets)
    const url = `/assets/images/profile_icons/${filename}`;
    await query(pool, 'UPDATE users SET profile_pic_url = ? WHERE user_id = ?', [url, id]);

    return res.json({ ok: true, url });
  } catch (err) {
    console.error('Error saving avatar:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Server error saving file' });
  }
});

module.exports = router;
