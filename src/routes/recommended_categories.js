const router = require('express').Router();
const { pool, query } = require('../utils/mysqlQuery');

// POST /api/recommended_categories
// Body: { tutor_id, slug, name, description, reason }
router.post('/', async (req, res) => {
  try {
    const { tutor_id, slug, name, description, reason } = req.body || {};
    if (!slug || !name || !description || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Simple sanitization/length checks
    if (String(slug).length > 150 || String(name).length > 255) {
      return res.status(400).json({ error: 'Field length exceeded' });
    }

    const sql = `INSERT INTO recommended_categories (tutor_id, slug, name, description, reason) VALUES (?, ?, ?, ?, ?)`;
    const params = [tutor_id || null, slug, name, description, reason];
    const result = await query(pool, sql, params);
    res.status(201).json({ id: result.insertId, message: 'Recommendation submitted' });
  } catch (err) {
    console.error('Error inserting recommended category', err && err.message ? err.message : err);
    res.status(500).json({ error: err && err.message ? err.message : 'Failed to submit recommendation' });
  }
});

module.exports = router;
