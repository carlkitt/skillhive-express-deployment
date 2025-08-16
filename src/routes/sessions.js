const { pool, query } = require('../utils/mysqlQuery');
const router = require('express').Router();

// Route to get all sessions, optionally filtered by category_id
router.get('/', async (req, res) => {
  try {
    const categoryId = req.query.category_id;
    let sql = `SELECT s.session_id AS id,
                      s.price,
                      s.title,
                      s.tutor_id,
                      s.skill_tag,
                      s.successful_sessions,
                      s.rating,
                      s.rating_count
               FROM sessions s`;
    const params = [];

    if (categoryId) {
      // Prefer explicit category_id on sessions. If session.category_id is NULL, also include
      // sessions where the tutor belongs to the category (backwards compatibility).
      sql += ` WHERE (s.category_id = ? OR EXISTS (
                  SELECT 1 FROM tutor_categories tc WHERE tc.tutor_id = s.tutor_id AND tc.category_id = ?
                ))`;
      params.push(categoryId, categoryId);
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
    console.error('Error fetching session by id', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;