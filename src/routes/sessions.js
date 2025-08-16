const { pool, query } = require('../utils/mysqlQuery');
const router = require('express').Router();

// Route to get all sessions
router.get('/', async (req, res) => {
  try {
    const results = await query(
      pool,
      'SELECT session_id AS id, price, title, tutor_id, skill_tag, successful_sessions, rating, rating_count FROM sessions'
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// backend/src/routes/sessions.js
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
              u.user_id AS tutor_user_id,
              u.full_name AS tutor_full_name,
              u.profile_pic_url AS tutor_profile_url
       FROM sessions s
       LEFT JOIN users u ON s.tutor_id = u.user_id
       WHERE s.session_id = ?`,
      [id]
    );
    if (results.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;