const express = require('express');
const router = express.Router();
const { query, pool } = require('../utils/mysqlQuery');

// GET /api/tutors/:id - return tutor details with normalized image fields
router.get('/:id', async (req, res) => {
  try {
    const tutorId = req.params.id;
    const sql = `SELECT
      t.id AS tutor_id,
      t.user_id,
      COALESCE(t.full_name, u.full_name, '') AS full_name,
      t.email,
      t.role,
      t.status,
      t.rating,
      t.rating_count,
      t.successful_sessions,
      t.bio,
      t.profile_pic_asset,
      t.profile_pic_url,
      t.profile_border_url,
      t.badge_url,
      u.profile_pic_url AS users_profile_pic_url
    FROM tutors t
    LEFT JOIN users u ON u.user_id = t.user_id
    WHERE t.id = ?
    LIMIT 1`;

    const rows = await query(pool, sql, [tutorId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Tutor not found' });

    const r = rows[0];

    // Normalize images: follow same logic as featured_tutors
    function pickProfileImage(row) {
      if (row.profile_pic_asset && row.profile_pic_asset !== '') return { value: row.profile_pic_asset, type: 'asset' };
      if (row.profile_pic_url && row.profile_pic_url.indexOf('assets/') > -1) return { value: row.profile_pic_url.substring(row.profile_pic_url.indexOf('assets/')), type: 'asset' };
      if (row.users_profile_pic_url && row.users_profile_pic_url.indexOf('assets/') > -1) return { value: row.users_profile_pic_url.substring(row.users_profile_pic_url.indexOf('assets/')), type: 'asset' };
      if (row.profile_pic_url && row.profile_pic_url !== '') return { value: row.profile_pic_url, type: 'network' };
      if (row.users_profile_pic_url && row.users_profile_pic_url !== '') return { value: row.users_profile_pic_url, type: 'network' };
      return { value: null, type: 'none' };
    }

    function pickBorder(row) {
      if (row.profile_border_url && row.profile_border_url !== '') {
        if (row.profile_border_url.indexOf('assets/') > -1) return { value: row.profile_border_url.substring(row.profile_border_url.indexOf('assets/')), type: 'asset' };
        return { value: row.profile_border_url, type: 'network' };
      }
      return { value: null, type: 'none' };
    }

    function pickBadge(row) {
      if (row.badge_url && row.badge_url !== '') {
        if (row.badge_url.indexOf('assets/') > -1) return { value: row.badge_url.substring(row.badge_url.indexOf('assets/')), type: 'asset' };
        return { value: row.badge_url, type: 'network' };
      }
      return { value: null, type: 'none' };
    }

    const profile = pickProfileImage(r);
    const border = pickBorder(r);
    const badge = pickBadge(r);

    res.json({
      tutor_id: r.tutor_id,
      user_id: r.user_id,
      full_name: r.full_name,
      email: r.email,
      role: r.role,
      status: r.status,
      rating: r.rating,
      rating_count: r.rating_count,
      successful_sessions: r.successful_sessions,
      bio: r.bio,
      profile_image: profile.value,
      profile_image_type: profile.type,
      border_image: border.value,
      border_image_type: border.type,
      badge_image: badge.value,
      badge_image_type: badge.type,
    });
  } catch (err) {
    console.error('Error fetching tutor', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tutors/:id/skills - return skills sorted by popularity
router.get('/:id/skills', async (req, res) => {
  try {
    const tutorId = req.params.id;

    // Aggregate sessions by skill_tag to compute popularity
    const sql = `SELECT COALESCE(NULLIF(skill_tag, ''), NULL) AS name, COUNT(*) AS popularity
      FROM sessions
      WHERE tutor_id = ? AND skill_tag IS NOT NULL
      GROUP BY skill_tag
      HAVING name IS NOT NULL
      ORDER BY popularity DESC`;

    const rows = await query(pool, sql, [tutorId]);
    if (rows && rows.length > 0) {
      // normalize into objects
      const skills = rows.map(r => ({ name: r.name, popularity: r.popularity }));
      return res.json(skills);
    }

    // Fallback: if no sessions found, try tutor_profiles.skills (comma-separated)
    const pfSql = `SELECT skills FROM tutor_profiles WHERE tutor_id = ? LIMIT 1`;
    const pfRows = await query(pool, pfSql, [tutorId]);
    if (pfRows && pfRows.length > 0 && pfRows[0].skills) {
      const raw = pfRows[0].skills.toString();
      finalList = raw.split(',').map(s => s.trim()).where((s) => s.isNotEmpty);
    }

    // Since the above uses JS, rewrite to JS-compatible logic
    if (pfRows && pfRows.length > 0 && pfRows[0].skills) {
      const raw = pfRows[0].skills.toString();
      const parts = raw.split(',').map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length > 0) {
        const skills = parts.map(p => ({ name: p, popularity: 0 }));
        return res.json(skills);
      }
    }

    // No skills found
    res.json([]);
  } catch (err) {
    console.error('Error fetching tutor skills', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
