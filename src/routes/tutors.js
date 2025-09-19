const express = require('express');
const router = express.Router();
const { query, pool } = require('../utils/mysqlQuery');

// GET /api/tutors/:id - return tutor details with normalized image fields
router.get('/:id', async (req, res) => {
  try {
    const tutorId = req.params.id;
    // Read from users and tutor_profiles to avoid relying on a tutors table schema
    const sql = `SELECT
      u.user_id AS tutor_id,
      u.user_id,
      COALESCE(u.full_name, '') AS full_name,
      u.email,
      u.role,
      u.STATUS AS status,
      -- rating-related fields may live in another table; provide safe defaults
      0 AS rating,
      0 AS rating_count,
      0 AS successful_sessions,
      tp.bio AS bio,
      u.profile_pic_url AS profile_pic_url,
      tp.skills AS profile_skills,
      tp.availability AS profile_availability,
      tp.endorsement_pts AS profile_endorsement_pts
    FROM users u
    LEFT JOIN tutor_profiles tp ON tp.tutor_id = u.user_id
    WHERE u.user_id = ?
    LIMIT 1`;

    const rows = await query(pool, sql, [tutorId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Tutor not found' });

    const r = rows[0];

    // Normalize images: use users.profile_pic_url and treat asset references
    function pickProfileImage(row) {
      if (row.profile_pic_url && row.profile_pic_url.indexOf('assets/') > -1) return { value: row.profile_pic_url.substring(row.profile_pic_url.indexOf('assets/')), type: 'asset' };
      if (row.profile_pic_url && row.profile_pic_url !== '') return { value: row.profile_pic_url, type: 'network' };
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
      rating: r.rating || 0,
      rating_count: r.rating_count || 0,
      successful_sessions: r.successful_sessions || 0,
      bio: r.bio || '',
      profile_image: profile.value,
      profile_image_type: profile.type,
      // include tutor_profiles compatibility fields
      profile_skills: r.profile_skills || null,
      profile_availability: r.profile_availability || null,
      endorsement_pts: r.profile_endorsement_pts || null,
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
  // Fallback: if no sessions found, try tutor_profiles.skills (comma-separated)
  // Use JS-compatible logic below to normalize a comma-separated skills string.
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
