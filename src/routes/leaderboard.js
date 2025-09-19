const express = require('express');
const router = express.Router();
const { query, pool } = require('../utils/mysqlQuery');
const fs = require('fs');
const path = require('path');

// GET /leaderboard?role=tutor|student&college=ALL|CCS&sort=sessions|rating|overall
router.get('/', async (req, res) => {
  console.log('Leaderboard route invoked with query:', req.query);
  try {
    const role = (req.query.role || 'tutor').toLowerCase();
    let college = (req.query.college || 'ALL');
    const sort = (req.query.sort || 'overall');

    // Build base WHERE
    const whereClauses = [];
    const params = [];
    if (role) {
      whereClauses.push('LOWER(u.role) = ?');
      params.push(role);
    }
    // Validate college against allowed enum values to avoid bad input
    const allowedColleges = ['CCS','CAS','COE','CBA','Other','Unknown'];
    if (college && college !== 'ALL') {
      const collegeUp = String(college).toUpperCase();
      if (!allowedColleges.includes(collegeUp)) {
        console.warn('Unknown college filter requested, ignoring:', college);
        college = 'ALL';
      } else {
        // Use the validated value (preserve case for enums defined above)
        whereClauses.push('(u.college = ? OR u.college IS NULL)');
        params.push(collegeUp === 'OTHER' ? 'Other' : collegeUp);
      }
    }

  const whereSql = whereClauses.length > 0 ? ('WHERE ' + whereClauses.join(' AND ')) : '';

  // NOTE: the users table schema in this DB does not contain a `college` column.
  // To avoid SQL errors on deployments with that schema, we do not select or
  // filter by u.college here. If you have college data elsewhere, adjust the
  // query to JOIN that table instead.

  // Main query: select users and compute session counts via correlated subquery.
  // Use tutors to get ratings.
  let sql = `
      SELECT
        u.user_id AS id,
        COALESCE(u.full_name, '') AS name,
        COALESCE(u.year_level, '') AS year,
        COALESCE(u.course, '') AS course,
                COALESCE(NULLIF(u.college, ''), 'Unknown') AS college,
  COALESCE(u.profile_pic_url, '') AS profile_pic_url,
  COALESCE(t.rating, 0) AS rating,
  COALESCE(g.points, 0) AS gamification_points,
        (
          SELECT COUNT(*) FROM sessions s
          LEFT JOIN tutors tt ON tt.id = s.tutor_id
          WHERE s.tutor_id = u.user_id OR tt.user_id = u.user_id
        ) AS sessions
  FROM users u
  LEFT JOIN tutors t ON t.user_id = u.user_id
  LEFT JOIN gamification g ON g.user_id = u.user_id
      ${whereSql}
      LIMIT 200
    `;

  console.log('Leaderboard SQL:', sql);
  console.log('Leaderboard params:', params);
  try {
    const debugPath = path.join(__dirname, '..', 'logs', 'leaderboard_debug.log');
    const dbgLines = [];
    dbgLines.push('--- DEBUG ' + new Date().toISOString() + ' ---');
    dbgLines.push(sql);
    dbgLines.push('PARAMS: ' + JSON.stringify(params));
    dbgLines.push('\n');
    fs.appendFileSync(debugPath, dbgLines.join('\n'));
  } catch (werr) {
    console.error('Failed to write leaderboard debug file:', werr && werr.message ? werr.message : werr);
  }
  let results = await query(pool, sql, params);

    // Compute derived metrics and sort in JS for flexibility
    results = results.map(r => ({
      id: r.id,
      name: r.name,
      year: r.year,
      course: r.course,
      college: r.college || 'Unknown',
      profile_pic_url: r.profile_pic_url,
      sessions: Number(r.sessions) || 0,
      rating: Number(r.rating) || 0,
      // For students, prefer gamification.points. For tutors, derive points from sessions.
      points: (role === 'student') ? (Number(r.gamification_points) || 0) : ((Number(r.sessions) || 0) * 10),
      overall: (role === 'student') ? (Number(r.gamification_points) || 0) : ((Number(r.sessions) || 0) * (Number(r.rating) || 0)),
    }));

    if (sort === 'sessions') {
      results.sort((a, b) => b.sessions - a.sessions);
    } else if (sort === 'rating') {
      results.sort((a, b) => b.rating - a.rating);
    } else {
      results.sort((a, b) => b.overall - a.overall);
    }

    res.json(results);
  } catch (err) {
    // Log full error (stack if present) to help root-cause DB / SQL issues
    console.error('Error in leaderboard route:', err);
    if (err && err.stack) console.error(err.stack);
    try {
      const logsDir = path.join(__dirname, '..', 'logs');
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
      const out = [];
      out.push('--- LEADERBOARD ERROR ' + new Date().toISOString() + ' ---');
      out.push('Query: ' + sql);
      out.push('Params: ' + JSON.stringify(params));
      out.push('Error: ' + (err && err.message ? err.message : String(err)));
      if (err && err.stack) out.push(err.stack);
      out.push('\n');
      fs.appendFileSync(path.join(logsDir, 'leaderboard_error.log'), out.join('\n'));
    } catch (fileErr) {
      console.error('Failed to write leaderboard error log:', fileErr && fileErr.message ? fileErr.message : fileErr);
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
