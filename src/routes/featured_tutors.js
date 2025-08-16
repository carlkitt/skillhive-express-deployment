const express = require('express');
const router = express.Router();
const { query, pool } = require('../utils/mysqlQuery');

// GET /api/featured_tutors?category_id=1
router.get('/', async (req, res) => {
  try {
    const categoryId = req.query.category_id;
    const params = [];

    // Use a CTE + grouped min(position) to pick one featured record per category
    let sql = `WITH valid_ft AS (
      SELECT * FROM featured_tutors
      WHERE active = 1
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (ends_at IS NULL OR ends_at >= NOW())
    ),
    top_per_cat AS (
      SELECT f.* FROM valid_ft f
      JOIN (
        SELECT category_id, MIN(position) AS min_pos
        FROM valid_ft
        GROUP BY category_id
      ) m ON f.category_id = m.category_id AND f.position = m.min_pos
    )
    SELECT
      f.id AS featured_id,
      f.category_id,
      c.name AS category_name,
      t.id AS tutor_id,
      t.user_id,
      COALESCE(t.full_name, u.full_name, '') AS full_name,
      t.status,
      t.profile_pic_asset,
      t.profile_pic_url,
      t.profile_border_url,
      t.badge_url,
      u.profile_pic_url AS users_profile_pic_url,
      f.position,

      CASE
        WHEN COALESCE(NULLIF(t.profile_pic_asset, ''), '') <> '' THEN t.profile_pic_asset
        WHEN LOCATE('assets/', COALESCE(t.profile_pic_url, '')) > 0 THEN SUBSTRING(COALESCE(t.profile_pic_url, ''), LOCATE('assets/', COALESCE(t.profile_pic_url, '')))
        WHEN LOCATE('assets/', COALESCE(u.profile_pic_url, '')) > 0 THEN SUBSTRING(COALESCE(u.profile_pic_url, ''), LOCATE('assets/', COALESCE(u.profile_pic_url, '')))
        WHEN COALESCE(NULLIF(t.profile_pic_url, ''), '') <> '' THEN t.profile_pic_url
        WHEN COALESCE(NULLIF(u.profile_pic_url, ''), '') <> '' THEN u.profile_pic_url
        ELSE NULL
      END AS profile_image,
      CASE
        WHEN COALESCE(NULLIF(t.profile_pic_asset, ''), '') <> '' THEN 'asset'
        WHEN LOCATE('assets/', COALESCE(t.profile_pic_url, '')) > 0 THEN 'asset'
        WHEN LOCATE('assets/', COALESCE(u.profile_pic_url, '')) > 0 THEN 'asset'
        WHEN COALESCE(NULLIF(t.profile_pic_url, ''), '') <> '' THEN 'network'
        WHEN COALESCE(NULLIF(u.profile_pic_url, ''), '') <> '' THEN 'network'
        ELSE 'none'
      END AS profile_image_type,

      CASE
        WHEN COALESCE(NULLIF(t.profile_border_url, ''), '') <> '' AND LOCATE('assets/', COALESCE(t.profile_border_url, '')) > 0 THEN SUBSTRING(COALESCE(t.profile_border_url, ''), LOCATE('assets/', COALESCE(t.profile_border_url, '')))
        WHEN COALESCE(NULLIF(t.profile_border_url, ''), '') <> '' THEN t.profile_border_url
        ELSE NULL
      END AS border_image,
      CASE
        WHEN COALESCE(NULLIF(t.profile_border_url, ''), '') <> '' AND LOCATE('assets/', COALESCE(t.profile_border_url, '')) > 0 THEN 'asset'
        WHEN COALESCE(NULLIF(t.profile_border_url, ''), '') <> '' THEN 'network'
        ELSE 'none'
      END AS border_image_type,

      CASE
        WHEN COALESCE(NULLIF(t.badge_url, ''), '') <> '' AND LOCATE('assets/', COALESCE(t.badge_url, '')) > 0 THEN SUBSTRING(COALESCE(t.badge_url, ''), LOCATE('assets/', COALESCE(t.badge_url, '')))
        WHEN COALESCE(NULLIF(t.badge_url, ''), '') <> '' THEN t.badge_url
        ELSE NULL
      END AS badge_image,
      CASE
        WHEN COALESCE(NULLIF(t.badge_url, ''), '') <> '' AND LOCATE('assets/', COALESCE(t.badge_url, '')) > 0 THEN 'asset'
        WHEN COALESCE(NULLIF(t.badge_url, ''), '') <> '' THEN 'network'
        ELSE 'none'
      END AS badge_image_type

    FROM top_per_cat f
    JOIN tutors t ON t.id = f.tutor_id
    LEFT JOIN users u ON u.user_id = t.user_id
    LEFT JOIN categories c ON c.id = f.category_id`;

    if (categoryId) {
      sql += ' WHERE f.category_id = ?';
      params.push(categoryId);
    }

    sql += ' ORDER BY f.position';

    const rows = await query(pool, sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching featured tutors', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Optional: get featured tutors for a single category by path
// GET /api/featured_tutors/category/1
router.get('/category/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const sql = `SELECT
      f.id AS featured_id,
      f.category_id,
      c.name AS category_name,
      t.id AS tutor_id,
      COALESCE(t.full_name, u.full_name, '') AS full_name,
      t.profile_pic_asset,
      t.profile_pic_url,
      t.profile_border_url,
      t.badge_url,

      CASE
        WHEN COALESCE(NULLIF(t.profile_pic_asset, ''), '') <> '' THEN t.profile_pic_asset
        WHEN LOCATE('assets/', COALESCE(t.profile_pic_url, '')) > 0 THEN SUBSTRING(COALESCE(t.profile_pic_url, ''), LOCATE('assets/', COALESCE(t.profile_pic_url, '')))
        WHEN LOCATE('assets/', COALESCE(u.profile_pic_url, '')) > 0 THEN SUBSTRING(COALESCE(u.profile_pic_url, ''), LOCATE('assets/', COALESCE(u.profile_pic_url, '')))
        WHEN COALESCE(NULLIF(t.profile_pic_url, ''), '') <> '' THEN t.profile_pic_url
        WHEN COALESCE(NULLIF(u.profile_pic_url, ''), '') <> '' THEN u.profile_pic_url
        ELSE NULL
      END AS profile_image,
      CASE
        WHEN COALESCE(NULLIF(t.profile_pic_asset, ''), '') <> '' THEN 'asset'
        WHEN LOCATE('assets/', COALESCE(t.profile_pic_url, '')) > 0 THEN 'asset'
        WHEN LOCATE('assets/', COALESCE(u.profile_pic_url, '')) > 0 THEN 'asset'
        WHEN COALESCE(NULLIF(t.profile_pic_url, ''), '') <> '' THEN 'network'
        WHEN COALESCE(NULLIF(u.profile_pic_url, ''), '') <> '' THEN 'network'
        ELSE 'none'
      END AS profile_image_type,

      CASE
        WHEN COALESCE(NULLIF(t.profile_border_url, ''), '') <> '' AND LOCATE('assets/', COALESCE(t.profile_border_url, '')) > 0 THEN SUBSTRING(COALESCE(t.profile_border_url, ''), LOCATE('assets/', COALESCE(t.profile_border_url, '')))
        WHEN COALESCE(NULLIF(t.profile_border_url, ''), '') <> '' THEN t.profile_border_url
        ELSE NULL
      END AS border_image,
      CASE
        WHEN COALESCE(NULLIF(t.profile_border_url, ''), '') <> '' AND LOCATE('assets/', COALESCE(t.profile_border_url, '')) > 0 THEN 'asset'
        WHEN COALESCE(NULLIF(t.profile_border_url, ''), '') <> '' THEN 'network'
        ELSE 'none'
      END AS border_image_type,

      CASE
        WHEN COALESCE(NULLIF(t.badge_url, ''), '') <> '' AND LOCATE('assets/', COALESCE(t.badge_url, '')) > 0 THEN SUBSTRING(COALESCE(t.badge_url, ''), LOCATE('assets/', COALESCE(t.badge_url, '')))
        WHEN COALESCE(NULLIF(t.badge_url, ''), '') <> '' THEN t.badge_url
        ELSE NULL
      END AS badge_image,
      CASE
        WHEN COALESCE(NULLIF(t.badge_url, ''), '') <> '' AND LOCATE('assets/', COALESCE(t.badge_url, '')) > 0 THEN 'asset'
        WHEN COALESCE(NULLIF(t.badge_url, ''), '') <> '' THEN 'network'
        ELSE 'none'
      END AS badge_image_type,

      f.position, f.active, f.starts_at, f.ends_at
    FROM featured_tutors f
    JOIN tutors t ON t.id = f.tutor_id
    LEFT JOIN users u ON u.user_id = t.user_id
    LEFT JOIN categories c ON c.id = f.category_id
    WHERE f.active = 1
      AND f.category_id = ?
      AND (f.starts_at IS NULL OR f.starts_at <= NOW())
      AND (f.ends_at IS NULL OR f.ends_at >= NOW())
    ORDER BY f.position`;

    const rows = await query(pool, sql, [categoryId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching featured tutors by category', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Dynamic auto-selected featured tutors based on session performance
// GET /api/featured_tutors/auto
router.get('/auto', async (req, res) => {
  try {
    // Compute tutor scores per category using sessions and tutor_categories fallback
    const sql = `
      WITH tutor_scores AS (
        SELECT
          COALESCE(s.category_id, tc.category_id) AS category_id,
          COALESCE(c.name, '') AS category_name,
          t.id AS tutor_id,
          t.user_id,
          COALESCE(t.full_name, u.full_name, '') AS full_name,
          t.profile_pic_asset,
          t.profile_pic_url,
          u.profile_pic_url AS users_profile_pic_url,
          t.profile_border_url,
          t.badge_url,
          AVG(s.rating) AS avg_rating,
          SUM(s.successful_sessions) AS total_success,
          SUM(s.rating_count) AS total_rating_count,
          (AVG(s.rating) * 10 + SUM(s.successful_sessions) + SUM(s.rating_count) * 0.5) AS score
        FROM sessions s
        JOIN tutors t ON t.id = s.tutor_id
        LEFT JOIN users u ON u.user_id = t.user_id
        LEFT JOIN tutor_categories tc ON tc.tutor_id = t.id
        LEFT JOIN categories c ON c.id = COALESCE(s.category_id, tc.category_id)
        WHERE COALESCE(s.category_id, tc.category_id) IS NOT NULL
        GROUP BY COALESCE(s.category_id, tc.category_id), t.id
      ),
      top_per_cat AS (
        SELECT ts.* FROM tutor_scores ts
        JOIN (
          SELECT category_id, MAX(score) AS max_score
          FROM tutor_scores
          GROUP BY category_id
        ) m ON ts.category_id = m.category_id AND ts.score = m.max_score
      )
      SELECT
        tpc.tutor_id,
        tpc.user_id,
        tpc.full_name,
        tpc.category_id,
        tpc.category_name,
        tpc.avg_rating,
        tpc.total_success,
        tpc.total_rating_count,
        tpc.score,

        -- resolved profile image (asset path or network)
        CASE
          WHEN COALESCE(NULLIF(t.profile_pic_asset, ''), '') <> '' THEN t.profile_pic_asset
          WHEN LOCATE('assets/', COALESCE(t.profile_pic_url, '')) > 0 THEN SUBSTRING(COALESCE(t.profile_pic_url, ''), LOCATE('assets/', COALESCE(t.profile_pic_url, '')))
          WHEN LOCATE('assets/', COALESCE(u.profile_pic_url, '')) > 0 THEN SUBSTRING(COALESCE(u.profile_pic_url, ''), LOCATE('assets/', COALESCE(u.profile_pic_url, '')))
          WHEN COALESCE(NULLIF(t.profile_pic_url, ''), '') <> '' THEN t.profile_pic_url
          WHEN COALESCE(NULLIF(u.profile_pic_url, ''), '') <> '' THEN u.profile_pic_url
          ELSE NULL
        END AS profile_image,

        CASE
          WHEN COALESCE(NULLIF(t.profile_pic_asset, ''), '') <> '' THEN 'asset'
          WHEN LOCATE('assets/', COALESCE(t.profile_pic_url, '')) > 0 THEN 'asset'
          WHEN LOCATE('assets/', COALESCE(u.profile_pic_url, '')) > 0 THEN 'asset'
          WHEN COALESCE(NULLIF(t.profile_pic_url, ''), '') <> '' THEN 'network'
          WHEN COALESCE(NULLIF(u.profile_pic_url, ''), '') <> '' THEN 'network'
          ELSE 'none'
        END AS profile_image_type,

        CASE
          WHEN COALESCE(NULLIF(t.profile_border_url, ''), '') <> '' AND LOCATE('assets/', COALESCE(t.profile_border_url, '')) > 0 THEN SUBSTRING(COALESCE(t.profile_border_url, ''), LOCATE('assets/', COALESCE(t.profile_border_url, '')))
          WHEN COALESCE(NULLIF(t.profile_border_url, ''), '') <> '' THEN t.profile_border_url
          ELSE NULL
        END AS border_image,
        CASE
          WHEN COALESCE(NULLIF(t.profile_border_url, ''), '') <> '' AND LOCATE('assets/', COALESCE(t.profile_border_url, '')) > 0 THEN 'asset'
          WHEN COALESCE(NULLIF(t.profile_border_url, ''), '') <> '' THEN 'network'
          ELSE 'none'
        END AS border_image_type,

        CASE
          WHEN COALESCE(NULLIF(t.badge_url, ''), '') <> '' AND LOCATE('assets/', COALESCE(t.badge_url, '')) > 0 THEN SUBSTRING(COALESCE(t.badge_url, ''), LOCATE('assets/', COALESCE(t.badge_url, '')))
          WHEN COALESCE(NULLIF(t.badge_url, ''), '') <> '' THEN t.badge_url
          ELSE NULL
        END AS badge_image,
        CASE
          WHEN COALESCE(NULLIF(t.badge_url, ''), '') <> '' AND LOCATE('assets/', COALESCE(t.badge_url, '')) > 0 THEN 'asset'
          WHEN COALESCE(NULLIF(t.badge_url, ''), '') <> '' THEN 'network'
          ELSE 'none'
        END AS badge_image_type
      FROM top_per_cat tpc
      JOIN tutors t ON t.id = tpc.tutor_id
      LEFT JOIN users u ON u.user_id = t.user_id
      ORDER BY tpc.category_id
    `;

    const rows = await query(pool, sql, []);
    res.json(rows);
  } catch (err) {
    console.error('Error computing auto featured tutors', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
