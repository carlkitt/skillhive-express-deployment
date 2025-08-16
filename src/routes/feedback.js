const express = require('express');
const router = express.Router();
const { pool, query } = require('../utils/mysqlQuery');

// GET /api/feedback/:sessionId/:tutorId
router.get('/:sessionId/:tutorId', async (req, res) => {
  const { sessionId, tutorId } = req.params;
  try {
    const results = await query(
      pool,
      `SELECT profile_url AS profileUrl, name, helpful_count AS helpfulCount, rating, comment, date, tutor_id AS tutorId, session_id AS sessionId, is_helpful AS isHelpful
       FROM feedback WHERE session_id = ? AND tutor_id = ?`,
      [sessionId, tutorId]
    );

    if (!results || results.length === 0) {
      return res.json([]);
    }

    // Ensure correct types for frontend
    const feedbacks = results.map(f => ({
      ...f,
      rating: Number(f.rating) || 0,
      helpfulCount: Number(f.helpfulCount) || 0,
      isHelpful: !!f.isHelpful,
      date: f.date ? new Date(f.date).toISOString() : null,
    }));
    res.json(feedbacks);
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
