const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Create a MySQL connection pool
const pool = mysql.createPool({
   host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'skillhivedb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// GET /available-times
router.get('/available-times', async (req, res) => {
  try {
    // Optional filtering by session_id so frontend can request only slots for a given session
    const { session_id } = req.query || {};
    let rows;
    if (session_id) {
      const [r] = await pool.query(
        'SELECT id, session_id, day, time, booked, capacity, ongoing, topic_title, topic_description FROM available_times WHERE session_id = ?',
        [session_id]
      );
      rows = r;
    } else {
      const [r] = await pool.query(
        'SELECT id, session_id, day, time, booked, capacity, ongoing, topic_title, topic_description FROM available_times'
      );
      rows = r;
    }

    // Normalize column names (some DB exports may use different casing)
    const mapped = rows.map(r => ({
      id: r.id || r.ID || r.available_time_id || null,
      session_id: r.session_id || r.SESSION_ID || null,
      day: r.day,
      time: r.time,
      booked: r.booked || 0,
      capacity: r.capacity || 0,
      ongoing: !!r.ongoing,
      topic_title: r.topic_title || r.topicTitle || '',
      topic_description: r.topic_description || r.topicDescription || '',
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// DELETE /available-times/:id
router.delete('/available-times/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  try {
    const [result] = await pool.query('DELETE FROM available_times WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    return res.status(204).end();
  } catch (err) {
    console.error('DELETE available_times error', err);
    return res.status(500).json({ error: 'Delete failed' });
  }
});

// PUT /available-times/:id  (partial update)
router.put('/available-times/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // Allowed updatable columns
  const allowed = ['day', 'time', 'booked', 'capacity', 'ongoing', 'topic_title', 'topic_description', 'session_id'];
  const toSet = [];
  const values = [];
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, k)) {
      toSet.push(`\`${k}\` = ?`);
      values.push(req.body[k]);
    }
  }

  if (toSet.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const sql = `UPDATE available_times SET ${toSet.join(', ')} WHERE id = ?`;
  values.push(id);
  try {
    const [result] = await pool.query(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });

    const [rows] = await pool.query('SELECT id, session_id, day, time, booked, capacity, ongoing, topic_title, topic_description FROM available_times WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found after update' });

    // normalize response
    const r = rows[0];
    const mapped = {
      id: r.id || r.ID || null,
      session_id: r.session_id || r.SESSION_ID || null,
      day: r.day,
      time: r.time,
      booked: r.booked || 0,
      capacity: r.capacity || 0,
      ongoing: !!r.ongoing,
      topic_title: r.topic_title || r.topicTitle || '',
      topic_description: r.topic_description || r.topicDescription || '',
    };
    return res.json(mapped);
  } catch (err) {
    console.error('PUT available_times error', err);
    return res.status(500).json({ error: 'Update failed' });
  }
});

// POST /available-times  (create new available time)
router.post('/available-times', async (req, res) => {
  try {
    const {
      user_id,
      session_id,
      day,
      time,
      capacity,
      topic_title,
      topic_description,
      ongoing,
      booked,
    } = req.body || {};

    // Basic validation for required fields
    if (!day || !time || (capacity === undefined || capacity === null) || !topic_title) {
      return res.status(400).json({ error: 'Missing required fields: day, time, capacity, topic_title' });
    }

    // Compute next id when table doesn't use AUTO_INCREMENT
    const [nextRows] = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM available_times');
    const nextId = (nextRows && nextRows.length > 0) ? nextRows[0].nextId : 1;

    const sql = `INSERT INTO available_times (id, user_id, session_id, day, time, booked, capacity, ongoing, topic_title, topic_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      nextId,
      (user_id ?? null),
      (session_id ?? null),
      day,
      time,
      (booked ?? 0),
      (capacity ?? 0),
      (ongoing ? 1 : 0),
      (topic_title ?? ''),
      (topic_description ?? ''),
    ];

    const [result] = await pool.query(sql, params);
    // Return the created row (normalize names similar to GET)
    const [rows] = await pool.query('SELECT id, session_id, user_id, day, time, booked, capacity, ongoing, topic_title, topic_description FROM available_times WHERE id = ?', [nextId]);
    if (!rows || rows.length === 0) return res.status(201).json({ id: nextId });

    const r = rows[0];
    const mapped = {
      id: r.id || r.ID || null,
      session_id: r.session_id || r.SESSION_ID || null,
      user_id: r.user_id || r.USER_ID || null,
      day: r.day,
      time: r.time,
      booked: r.booked || 0,
      capacity: r.capacity || 0,
      ongoing: !!r.ongoing,
      topic_title: r.topic_title || r.topicTitle || '',
      topic_description: r.topic_description || r.topicDescription || '',
    };

    return res.status(201).json(mapped);
  } catch (err) {
    console.error('POST available_times error', err);
    return res.status(500).json({ error: 'Insert failed' });
  }
});

module.exports = router;