const { pool, query } = require('../utils/mysqlQuery');
const router = require('express').Router();

// Route to get all sessions, optionally filtered by category_id
router.get('/', async (req, res) => {
  try {
    const categoryId = req.query.category_id;
    const tutorId = req.query.tutor_id; // expecting tutors.id (primary key)
    let sql = `SELECT s.session_id AS id,
            s.price,
            s.title,
            s.tutor_id,
            s.skill_tag,
            s.successful_sessions,
            s.rating,
            s.rating_count,
            -- embed tutor fields: prefer tutors table, fall back to users
            -- Return the actual user id for the tutor. Prefer the tutors.user_id
            -- (which references the users table) over tutors.id (the tutors PK),
            -- otherwise the client may receive the tutors table primary key
            -- instead of the user's id and open chats with the wrong recipient.
            COALESCE(t.user_id, u.user_id) AS tutor_user_id,
            -- expose tutors.id explicitly when the tutors table matched
            t.id AS tutor_table_id,
            COALESCE(t.full_name, u.full_name) AS tutor_full_name,
            COALESCE(t.profile_pic_url, u.profile_pic_url) AS tutor_profile_url,
            -- users table does not have rating column; prefer tutors.rating or session.rating
            COALESCE(t.rating, s.rating) AS tutor_rating,
            COALESCE(t.successful_sessions, s.successful_sessions) AS tutor_successful_sessions,
            -- users table does not have chat_response column;  prefer tutors.chat_response or empty string
            COALESCE(t.chat_response, '') AS tutor_chat_response
         FROM sessions s
         LEFT JOIN users u ON s.tutor_id = u.user_id
         LEFT JOIN tutors t ON (t.id = s.tutor_id OR t.user_id = s.tutor_id)`;
    const params = [];

    // Build WHERE clauses when filters are provided. Prefer filtering by
    // tutors.id (t.id) when tutor_id is passed in, because sessions.tutor_id
    // historically could contain either tutors.id or users.user_id.
    const whereClauses = [];
    if (categoryId) {
      // Prefer explicit category_id on sessions. If session.category_id is NULL, also include
      // sessions where the tutor belongs to the category (backwards compatibility).
      whereClauses.push(`(s.category_id = ? OR EXISTS (
                  SELECT 1 FROM tutor_categories tc WHERE tc.tutor_id = s.tutor_id AND tc.category_id = ?
                ))`);
      params.push(categoryId, categoryId);
    }
    if (tutorId) {
      // Compatibility: allow matching either tutors.id (t.id) OR users.user_id (u.user_id).
      // This helps when sessions.tutor_id stores different id types in older data.
      whereClauses.push(`(t.id = ? OR u.user_id = ?)`);
      params.push(tutorId, tutorId);
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    const results = await query(pool, sql, params);
    res.json(results);
  } catch (err) {
    console.error('Error fetching sessions', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single session by id (existing behavior)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const results = await query(
      pool,
      `SELECT s.session_id AS id,
              s.price,
              s.title,
              s.successful_sessions,
              s.rating,
              s.rating_count,
              s.tutor_id,
              -- Ensure the session response exposes the true user id for the tutor.
              COALESCE(t.user_id, u.user_id) AS tutor_user_id,
              t.id AS tutor_table_id,
              COALESCE(t.full_name, u.full_name) AS tutor_full_name,
              COALESCE(t.profile_pic_url, u.profile_pic_url) AS tutor_profile_url,
              -- users table does not have rating column; prefer tutors.rating or session.rating
              COALESCE(t.rating, s.rating) AS tutor_rating,
              COALESCE(t.successful_sessions, s.successful_sessions) AS tutor_successful_sessions,
              -- users table does not have chat_response column; prefer tutors.chat_response or empty string
              COALESCE(t.chat_response, '') AS tutor_chat_response
       FROM sessions s
       LEFT JOIN users u ON s.tutor_id = u.user_id
       LEFT JOIN tutors t ON (t.id = s.tutor_id OR t.user_id = s.tutor_id)
       WHERE s.session_id = ?`,
      [id]
    );
    if (results.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching session by id', err);
    res.status(500).json({ error: err.message });
  }
});

// POST / - create a new session
router.post('/', async (req, res) => {
  try {
    const { title, skill_tag, category_id, tutor_id, price } = req.body || {};
    if (!title || title.toString().trim() === '') {
      return res.status(400).json({ error: 'Missing title' });
    }

    // Some DB exports store session_id without AUTO_INCREMENT. Compute a new id safely.
    const nextRows = await query(pool, 'SELECT COALESCE(MAX(session_id), 0) + 1 AS nextId FROM sessions');
    const nextId = nextRows && nextRows.length > 0 ? nextRows[0].nextId : 1;

    const sql = 'INSERT INTO sessions (session_id, title, skill_tag, category_id, tutor_id, price, session_date, successful_sessions, rating, rating_count) VALUES (?, ?, ?, ?, ?, ?, NULL, 0, 0, 0)';
    const params = [
      nextId,
      title.toString().trim(),
      (skill_tag ?? null),
      (category_id ?? null),
      (tutor_id ?? null),
      (price ?? null),
    ];

    const result = await query(pool, sql, params);
    // Use computed nextId as the created id
    const createdId = nextId;

    // Return the created session (simple projection)
    const rows = await query(
      pool,
      'SELECT s.session_id AS id, s.price, s.title, s.tutor_id, s.skill_tag, s.successful_sessions, s.rating, s.rating_count FROM sessions s WHERE s.session_id = ?',
      [createdId]
    );
    if (!rows || rows.length === 0) return res.status(201).json({ id: createdId });
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating session', err && err.message ? err.message : err);
    return res.status(500).json({ error: err && err.message ? err.message : 'Server error' });
  }
});

module.exports = router;