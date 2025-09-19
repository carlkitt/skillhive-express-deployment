const router = require('express').Router();
const { pool, query } = require('../utils/mysqlQuery');

// GET /api/categories
// Returns list of categories as [{ id, name, slug?, description? }, ...]
router.get('/', async (req, res) => {
  try {
    // Basic select - return id and name for frontend dropdowns
    const rows = await query(pool, 'SELECT id, name, slug, description, image_url FROM categories ORDER BY name');
    // Normalize to simple objects
    const out = rows.map(r => ({
      id: r.id,
      name: r.name || r.title || r.category || '',
      slug: r.slug || null,
      description: r.description || null,
      image_url: r.image_url || null,
    }));
    res.json(out);
  } catch (err) {
    console.error('Error fetching categories', err && err.message ? err.message : err);
    res.status(500).json({ error: err && err.message ? err.message : 'Failed to fetch categories' });
  }
});

module.exports = router;
