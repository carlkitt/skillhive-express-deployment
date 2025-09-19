// Route: GET /api/tutors/:tutorId/sessions/:sessionId/bookings
// Returns all bookings for a session grouped by available_time_id, with student and voucher info
const express = require('express');
const router = express.Router();
const { pool } = require('../models/user');

// Auth middleware placeholder (replace with your actual auth)
function requireTutor(req, res, next) {
  // TODO: verify JWT and that req.params.tutorId matches authenticated user
  next();
}

router.get('/tutors/:tutorId/sessions/:sessionId/bookings', requireTutor, async (req, res) => {
  const tutorId = parseInt(req.params.tutorId, 10);
  const sessionId = parseInt(req.params.sessionId, 10);
  try {
    const conn = await pool.getConnection();
    // Determine available_times schema: prefer starts_at/ends_at, otherwise fall back to day/time
    const [cols] = await conn.query('SHOW COLUMNS FROM available_times');
    const colNames = (cols || []).map(c => c.Field);
    const slotStart = colNames.includes('starts_at') ? 'at.starts_at' : (colNames.includes('day') ? 'at.day' : 'NULL');
    const slotEnd = colNames.includes('ends_at') ? 'at.ends_at' : (colNames.includes('time') ? 'at.time' : 'NULL');

    const sql = `
      SELECT
        b.id AS booking_id,
        b.available_time_id,
        ${slotStart} AS slot_start,
        ${slotEnd} AS slot_end,
        b.user_id AS student_user_id,
        u.full_name AS student_name,
        u.profile_pic_url,
        b.voucher_inventory_id,
        b.voucher_item_id,
        b.voucher_code,
        b.voucher_discount,
        b.voucher_used_at,
        b.price_before,
        b.price_after,
        b.booked_at
      FROM bookings b
      JOIN available_times at ON at.id = b.available_time_id
      JOIN sessions s ON s.session_id = b.session_id
      LEFT JOIN users u ON u.student_id_no = b.user_id
      WHERE b.session_id = ?
        AND s.tutor_id = ?
      ORDER BY ${slotStart} ASC, b.booked_at ASC;
    `;
    const [rows] = await conn.query(sql, [sessionId, tutorId]);
    conn.release();
    // Group by available_time_id
    const groups = {};
    rows.forEach(r => {
      const key = r.available_time_id || 'none';
      if (!groups[key]) groups[key] = {
        available_time_id: r.available_time_id,
        slot_start: r.slot_start,
        slot_end: r.slot_end,
        students: []
      };
      groups[key].students.push({
        booking_id: r.booking_id,
        student_user_id: r.student_user_id,
        student_name: r.student_name,
        profile_pic_url: r.profile_pic_url,
        voucher_inventory_id: r.voucher_inventory_id,
        voucher_item_id: r.voucher_item_id,
        voucher_code: r.voucher_code,
        voucher_discount: r.voucher_discount,
        voucher_used_at: r.voucher_used_at,
        price_before: r.price_before,
        price_after: r.price_after,
        booked_at: r.booked_at
      });
    });
    return res.json({ slots: Object.values(groups) });
  } catch (err) {
    console.error('Fetch bookings failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
