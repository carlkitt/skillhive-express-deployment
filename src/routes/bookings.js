const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../models/user') || require('../utils/mysqlQuery');
const JWT_SECRET = require('../config/secret');

const router = express.Router();
const { tutorRespond } = require('../controllers/bookingController');

// Helper: write full error stacks to a persistent log for debugging when console isn't available
const fs = require('fs');
const path = require('path');
function dumpFullError(err, contextLabel) {
  try {
    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const file = path.join(logDir, 'bookings_error_full.log');
    const body = (err && err.stack) ? err.stack : (err && err.message ? err.message : JSON.stringify(err));
    const payload = `${new Date().toISOString()} ${contextLabel || ''}\n${body}\n\n`;
    fs.appendFileSync(file, payload);
  } catch (e) {
    // best-effort: if logging fails, fall back to console
    console.error('Failed to write bookings_error_full.log', e && e.message ? e.message : e);
  }
}

// GET /bookings/:id -> return booking row
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT * FROM bookings WHERE id = ? LIMIT 1', [id]);
      conn.release();
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json({ booking: rows[0] });
    } catch (err) {
      conn.release();
      console.error('Error fetching booking', err);
      return res.status(500).json({ error: 'Server error' });
    }
  } catch (err) {
    console.error('Booking GET route error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /bookings
// Body: { available_time_id: int, session_id?: int }
router.post('/', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing token' });
  let payload;
  try {
    const token = auth.split(' ')[1];
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = payload.userId;
  const { available_time_id, voucher_code, voucher_item_id, voucher_inventory_id } = req.body || {};
  if (!available_time_id) return res.status(400).json({ error: 'available_time_id required' });

  // Log a lightweight booking attempt entry to help debugging pre-transaction failures
  try {
    const fs = require('fs');
    const p = require('path');
    const logDir = p.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logFile = p.join(logDir, 'bookings_error.log');
    const attempt = `${new Date().toISOString()} ATTEMPT userId=${userId} available_time_id=${available_time_id} voucher=${voucher_code || voucher_item_id || '<none>'}\n`;
    fs.appendFileSync(logFile, attempt);
  } catch (e) {
    console.error('Failed to write booking attempt log', e && e.message ? e.message : e);
  }

  try {
    // Start transaction using mysql2 pool
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Resolve session_id from the available_time and the tutor_id from the session
      const [atRows] = await conn.query('SELECT session_id FROM available_times WHERE id = ?', [available_time_id]);
      if (!atRows || atRows.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ error: 'Invalid available_time_id' });
      }
      const sessionId = atRows[0].session_id;

      // Try to resolve tutor_id and session price from sessions table (best-effort)
      let tutorId = null;
      let sessionPrice = 0.0;
      if (sessionId) {
        const [sRows] = await conn.query('SELECT tutor_id, price FROM sessions WHERE session_id = ? LIMIT 1', [sessionId]);
        if (sRows && sRows.length > 0) {
          tutorId = sRows[0].tutor_id;
          sessionPrice = parseFloat(sRows[0].price || 0);
        }
      }

      // Resolve DB user identifier used by bookings table (bookings.user_id references users.student_id_no)
      // Some deployments use different name columns (fullname, full_name, name, display_name); detect what's available.
      const [uCols] = await conn.query('SHOW COLUMNS FROM users');
      const uColNames = (uCols || []).map(c => c.Field);
      const nameCandidates = ['fullname', 'full_name', 'name', 'display_name', 'first_name'];
      let nameField = null;
      for (const f of nameCandidates) if (uColNames.includes(f)) { nameField = f; break; }
      const selectCols = ['student_id_no'];
      if (nameField) selectCols.push(`${nameField} AS fullname`);
      const [userRows] = await conn.query(`SELECT ${selectCols.join(', ')} FROM users WHERE user_id = ? LIMIT 1`, [userId]);
      if (!userRows || userRows.length === 0 || !userRows[0].student_id_no) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ error: 'User not found or has no student_id_no' });
      }
      const bookingUserId = userRows[0].student_id_no.toString();
      const bookingUserFullname = userRows[0].fullname || null;

      // Prevent duplicate booking by same user for same available_time (use student_id_no)
      const [existRows] = await conn.query(
        'SELECT id FROM bookings WHERE user_id = ? AND available_time_id = ? LIMIT 1',
        [bookingUserId, available_time_id]
      );
      if (existRows && existRows.length > 0) {
        await conn.rollback();
        conn.release();
        return res.status(409).json({ error: 'Already booked' });
      }

      // Voucher handling (optional)
      let appliedVoucherId = null;
      let appliedAmount = 0.0;
      let discountType = null;

  // If client provided a voucher_inventory_id, prefer validating and using that
      if (voucher_inventory_id) {
        // Lock the inventory row to prevent concurrent use
        const [invRows] = await conn.query('SELECT * FROM user_inventory WHERE inventory_id = ? FOR UPDATE', [voucher_inventory_id]);
        if (!invRows || invRows.length === 0) {
          await conn.rollback();
          conn.release();
          return res.status(422).json({ error: 'Invalid voucher inventory id' });
        }
        const inv = invRows[0];
        // Verify ownership and active state
        if (parseInt(inv.user_id, 10) !== parseInt(userId, 10)) {
          await conn.rollback();
          conn.release();
          return res.status(403).json({ error: 'Voucher does not belong to user' });
        }
        if (inv.category !== 'voucher') {
          await conn.rollback();
          conn.release();
          return res.status(422).json({ error: 'Inventory id is not a voucher' });
        }
        // is_active is used in this schema to indicate usable inventory
        if (typeof inv.is_active !== 'undefined' && parseInt(inv.is_active, 10) === 0) {
          await conn.rollback();
          conn.release();
          return res.status(422).json({ error: 'Voucher already used or inactive' });
        }

        // Resolve the shop item referenced by this inventory row
        const itemId = inv.item_id || inv.itemId || inv.item;
        if (!itemId) {
          await conn.rollback();
          conn.release();
          return res.status(422).json({ error: 'Voucher inventory missing item reference' });
        }
        const [vRows] = await conn.query('SELECT * FROM shop_items WHERE item_id = ? AND type = "voucher" LIMIT 1', [itemId]);
        if (!vRows || vRows.length === 0) {
          await conn.rollback();
          conn.release();
          return res.status(422).json({ error: 'Referenced voucher not found' });
        }
        const v = vRows[0];
        if (v.active == 0) {
          await conn.rollback();
          conn.release();
          return res.status(422).json({ error: 'Voucher inactive' });
        }
        if (v.expires_at && new Date(v.expires_at) < new Date()) {
          await conn.rollback();
          conn.release();
          return res.status(422).json({ error: 'Voucher expired' });
        }

        // Compute discount from the shop_items record
        const dType = (v.discount_type || 'percent').toString();
        const dVal = parseFloat(v.discount_value || 0);
        let discount = 0.0;
        if (dType === 'percent') discount = sessionPrice * (dVal / 100.0);
        else discount = Math.min(dVal, sessionPrice);
  appliedVoucherId = v.item_id || v.itemId || v.id;
  appliedAmount = discount;
  discountType = dType;
  // snapshot fields we will store on booking if columns exist
  var voucherItemSnapshot = appliedVoucherId;
  var voucherCodeSnapshot = v.voucher_code || v.code || v.voucherCode || null;

        // mark the inventory row as used (we'll try to update later again, but set tentative flags)
        try {
          // prefer timestamp-based consumption for auditability
          await conn.query('UPDATE user_inventory SET used_at = NOW() WHERE inventory_id = ? AND user_id = ?', [voucher_inventory_id, userId]);
        } catch (e) {
          // non-fatal; we'll log and continue — actual rollback will occur if insert fails
          try { const fs = require('fs'); const p = require('path'); const logDir = p.join(__dirname, '..', 'logs'); if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true }); fs.appendFileSync(p.join(logDir,'bookings_error.log'), `${new Date().toISOString()} voucher_inventory update error (pre-insert): ${e && e.stack ? e.stack : e}\n`); } catch(ex){}
        }
      } else if (voucher_code || voucher_item_id) {
        // Find voucher row in shop_items (legacy behavior when client sends code/item id)
        const voucherWhere = voucher_item_id ? 'item_id = ?' : 'voucher_code = ?';
        const voucherParam = voucher_item_id ? voucher_item_id : voucher_code;
        const [vRows] = await conn.query(`SELECT * FROM shop_items WHERE ${voucherWhere} AND type = 'voucher' LIMIT 1`, [voucherParam]);
        if (!vRows || vRows.length === 0) {
          await conn.rollback();
          conn.release();
          return res.status(422).json({ error: 'Invalid voucher' });
        }
        const v = vRows[0];
        // Check active/expiry
        if (v.active == 0) {
          await conn.rollback();
          conn.release();
          return res.status(422).json({ error: 'Voucher inactive' });
        }
        if (v.expires_at && new Date(v.expires_at) < new Date()) {
          await conn.rollback();
          conn.release();
          return res.status(422).json({ error: 'Voucher expired' });
        }
        // Compute discount based on discount_type/discount_value
        const dType = (v.discount_type || 'percent').toString();
        const dVal = parseFloat(v.discount_value || 0);
        let discount = 0.0;
        if (dType === 'percent') discount = sessionPrice * (dVal / 100.0);
        else discount = Math.min(dVal, sessionPrice);
        appliedVoucherId = v.item_id || v.itemId || v.id;
        appliedAmount = discount;
        discountType = dType;
      }

      // Compute final price to store on booking (sessionPrice - appliedAmount)
      const finalPrice = Math.max(0, sessionPrice - appliedAmount);

      // Insert booking with resolved session_id, tutor_id and final price
      // Build insert dynamically to avoid breaking when some columns are missing
      const [bCols] = await conn.query('SHOW COLUMNS FROM bookings');
      const bColNames = (bCols || []).map(c => c.Field);

      const desired = [
        { name: 'available_time_id', val: available_time_id },
        { name: 'session_id', val: sessionId || null },
        { name: 'tutor_id', val: tutorId || null },
        { name: 'user_id', val: bookingUserId },
        { name: 'status', val: 'pending' },
        { name: 'price_charged', val: finalPrice },
  { name: 'voucher_inventory_id', val: voucher_inventory_id || null },
  { name: 'voucher_item_id', val: voucher_item_id || voucherItemSnapshot || null },
  { name: 'voucher_code', val: voucher_code || voucherCodeSnapshot || null },
  { name: 'voucher_discount', val: appliedAmount || null },
        { name: 'price_before', val: sessionPrice || null },
        { name: 'price_after', val: finalPrice || null },
        // we prefer DB side NOW() for voucher_used_at/booked_at if present
        { name: 'voucher_used_at', val: null, now: true },
        { name: 'booked_at', val: null, now: true }
      ];

      const fields = [];
      const params = [];
      let appendNowFor = [];
      desired.forEach(d => {
        if (bColNames.includes(d.name)) {
          fields.push(d.name);
          if (d.now) {
            appendNowFor.push(d.name);
          } else {
            params.push(d.val);
          }
        }
      });

      let insertSql;
      // keep insert result in outer scope so we can reference ins.insertId later
      let ins = null;
      if (fields.length === 0) {
        // fallback to original minimal insert if columns unexpectedly missing
  insertSql = 'INSERT INTO bookings (available_time_id, session_id, tutor_id, user_id, status, price_charged, booked_at) VALUES (?, ?, ?, ?, ?, ?, NOW())';
  const _res = await conn.query(insertSql, [available_time_id, sessionId || null, tutorId || null, bookingUserId, 'pending', finalPrice]);
        ins = Array.isArray(_res) ? _res[0] : _res;
      } else {
        // build placeholders: for columns using NOW() we don't add a param
        const placeholders = fields.map(f => appendNowFor.includes(f) ? 'NOW()' : '?').join(', ');
        insertSql = `INSERT INTO bookings (${fields.join(',')}) VALUES (${placeholders})`;
        const _res = await conn.query(insertSql, params);
        ins = Array.isArray(_res) ? _res[0] : _res;
      }

      // Increment booked count on available_times
      const updSql = 'UPDATE available_times SET booked = booked + 1 WHERE id = ?';
      await conn.query(updSql, [available_time_id]);

      // If the client supplied a user-owned voucher inventory id, mark that inventory entry consumed
      if (voucher_inventory_id) {
        try {
          // Ensure we only update inventory that belongs to this authenticated user
          await conn.query('UPDATE user_inventory SET used_at = NOW() WHERE inventory_id = ? AND user_id = ?', [voucher_inventory_id, userId]);
        } catch (e) {
          // non-fatal: log but continue
          try { const fs = require('fs'); const p = require('path'); const logDir = p.join(__dirname, '..', 'logs'); if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true }); fs.appendFileSync(p.join(logDir,'bookings_error.log'), `${new Date().toISOString()} voucher_inventory update error: ${e && e.stack ? e.stack : e}\n`); } catch(ex){}
        }
      }

      // If a voucher was applied, insert voucher_usage row tied to this booking
      if (appliedVoucherId) {
        // Insert into voucher_usage but adapt to existing schema to avoid column/constraint errors
        try {
          const [cols] = await conn.query('SHOW COLUMNS FROM voucher_usage');
          const colNames = (cols || []).map(c => c.Field);
          const fields = [];
          const params = [];

          if (colNames.includes('user_id')) { fields.push('user_id'); params.push(bookingUserId); }
          if (colNames.includes('item_id')) { fields.push('item_id'); params.push(appliedVoucherId); }
          if (colNames.includes('session_id')) { fields.push('session_id'); params.push(sessionId || null); }
          if (colNames.includes('booking_id')) { fields.push('booking_id'); params.push(ins.insertId || null); }
          if (colNames.includes('applied_amount')) { fields.push('applied_amount'); params.push(appliedAmount); }
          if (colNames.includes('discount_type')) { fields.push('discount_type'); params.push(discountType); }

          let usageSql;
          if (colNames.includes('applied_at')) {
            // rely on DB to accept NOW() for applied_at if present
            usageSql = `INSERT INTO voucher_usage (${fields.join(',')}, applied_at) VALUES (${fields.map(_=>'?').join(',')}, NOW())`;
          } else {
            usageSql = `INSERT INTO voucher_usage (${fields.join(',')}) VALUES (${fields.map(_=>'?').join(',')})`;
          }

          if (fields.length > 0) {
            await conn.query(usageSql, params);
          } else {
            // table exists but has unexpected schema; write warning to log but don't fail booking
            try { const fs = require('fs'); const p = require('path'); const logDir = p.join(__dirname, '..', 'logs'); if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true }); fs.appendFileSync(p.join(logDir,'bookings_error.log'), `${new Date().toISOString()} voucher_usage: no compatible columns found, skipping insert\n`); } catch(e){}
          }
        } catch (e) {
          // non-fatal: log but continue (we don't want voucher insert errors to prevent booking)
          try { const fs = require('fs'); const p = require('path'); const logDir = p.join(__dirname, '..', 'logs'); if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true }); fs.appendFileSync(p.join(logDir,'bookings_error.log'), `${new Date().toISOString()} voucher_usage insert error: ${e && e.stack ? e.stack : e}\n`); } catch(ex){}
        }
      }

      // Attempt to create an in-app notification for the tutor (in same transaction)
      // Track created notification id to return in the API response
      let createdNotificationId = null;
      try {
        if (tutorId) {
          const [nCols] = await conn.query('SHOW COLUMNS FROM notifications');
          const nColNames = (nCols || []).map(c => c.Field);
          const notifFields = [];
          const notifParams = [];
          if (nColNames.includes('user_id')) { notifFields.push('user_id'); notifParams.push(tutorId); }
          if (nColNames.includes('sender_id')) { notifFields.push('sender_id'); notifParams.push(userId); }
          if (nColNames.includes('type')) { notifFields.push('type'); notifParams.push('booking_request'); }
          if (nColNames.includes('title')) { notifFields.push('title'); notifParams.push('New booking request'); }
          if (nColNames.includes('message')) {
            const actor = bookingUserFullname ? bookingUserFullname : 'A learner';
            notifFields.push('message'); notifParams.push(`${actor} requested a session`);
          }
          if (nColNames.includes('payload')) {
            notifFields.push('payload'); notifParams.push(JSON.stringify({ bookingId: ins.insertId || null, available_time_id, sessionId }));
          }
          if (nColNames.includes('icon')) { notifFields.push('icon'); notifParams.push(null); }
          if (nColNames.includes('is_read')) { notifFields.push('is_read'); notifParams.push(0); }
          if (nColNames.includes('related_id')) { notifFields.push('related_id'); notifParams.push(ins.insertId || null); }
          if (notifFields.length > 0) {
            let notifSql;
            if (nColNames.includes('created_at')) {
              notifSql = `INSERT INTO notifications (${notifFields.join(',')}, created_at) VALUES (${notifFields.map(_=>'?').join(',')}, NOW())`;
            } else {
              notifSql = `INSERT INTO notifications (${notifFields.join(',')}) VALUES (${notifFields.map(_=>'?').join(',')})`;
            }
            const _res = await conn.query(notifSql, notifParams);
            const notifIns = Array.isArray(_res) ? _res[0] : _res;
            createdNotificationId = notifIns.insertId || null;
          }
        }
      } catch (e) {
        // non-fatal: log and continue (do not fail booking because notifications failed)
        try { const fs = require('fs'); const p = require('path'); const logDir = p.join(__dirname, '..', 'logs'); if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true }); fs.appendFileSync(p.join(logDir,'bookings_error.log'), `${new Date().toISOString()} notification insert error: ${e && e.stack ? e.stack : e}\n`); } catch(ex){}
      }

      await conn.commit();
      // Fetch the inserted booking row to return full data to clients
      let bookingRow = null;
      try {
        const [rows] = await conn.query('SELECT * FROM bookings WHERE id = ? LIMIT 1', [ins.insertId || null]);
        if (rows && rows.length > 0) bookingRow = rows[0];
      } catch (e) {
        // non-fatal: we'll still return booking_id below
        try {
          const fs = require('fs'); const p = require('path'); const logDir = p.join(__dirname, '..', 'logs'); if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true }); fs.appendFileSync(p.join(logDir,'bookings_error.log'), `${new Date().toISOString()} booking_fetch_error: ${e && e.stack ? e.stack : e}\n`);
        } catch (ex) {}
      }
      conn.release();
      // If we created a notification, fetch it to include in the response
      let notificationRow = null;
      if (createdNotificationId) {
        try {
          const [nRows] = await conn.query('SELECT * FROM notifications WHERE id = ? LIMIT 1', [createdNotificationId]);
          if (nRows && nRows.length > 0) notificationRow = nRows[0];
        } catch (e) {
          // non-fatal
        }
      }

      if (bookingRow) return res.status(201).json({ booking: bookingRow, notification: notificationRow });
      return res.status(201).json({ booking_id: ins.insertId || null, notification: notificationRow });
    } catch (err) {
      await conn.rollback();
      conn.release();
    console.error('Booking transaction failed', err);
    try { dumpFullError(err, 'Booking transaction failed'); } catch(e) { console.error('dumpFullError failed', e); }
      try {
        const fs = require('fs');
        const p = require('path');
        const logDir = p.join(__dirname, '..', 'logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        const logFile = p.join(logDir, 'bookings_error.log');
        const payload = `${new Date().toISOString()} Booking transaction failed: ${err && err.stack ? err.stack : (err && err.message ? err.message : JSON.stringify(err))}\n`;
        fs.appendFileSync(logFile, payload);
      } catch (e) {
        console.error('Failed to write bookings_error.log', e && e.message ? e.message : e);
      }
      return res.status(500).json({ error: 'Server error' });
    }
  } catch (err) {
  console.error('Booking route error', err);
  try { dumpFullError(err, 'Booking route error'); } catch(e) { console.error('dumpFullError failed', e); }
    try {
      const fs = require('fs');
      const p = require('path');
      const logDir = p.join(__dirname, '..', 'logs');
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const logFile = p.join(logDir, 'bookings_error.log');
      const payload = `${new Date().toISOString()} Booking route error: ${err && err.stack ? err.stack : (err && err.message ? err.message : JSON.stringify(err))}\n`;
      fs.appendFileSync(logFile, payload);
    } catch (e) {
      console.error('Failed to write bookings_error.log', e && e.message ? e.message : e);
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

// Tutor respond endpoint (accept/reject a booking)
// POST /api/bookings/:bookingId/respond
router.post('/:bookingId/respond', tutorRespond);

// Dev-only debug endpoint: list bookings for an available_time_id
// Usage: GET /api/bookings/debug/available/:id
if (process.env.NODE_ENV !== 'production') {
  router.get('/debug/available/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'id required' });
    try {
      const conn = await pool.getConnection();
      try {
        const [rows] = await conn.query('SELECT id, available_time_id, session_id, user_id, status, price_charged, booked_at FROM bookings WHERE available_time_id = ? ORDER BY booked_at DESC', [id]);
        conn.release();
        return res.json({ bookings: rows || [] });
      } catch (err) {
        conn.release();
        console.error('Debug fetch bookings failed', err);
        return res.status(500).json({ error: 'Server error' });
      }
    } catch (err) {
      console.error('Debug booking route error', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });
}

// Allow booking owner to update simple fields (e.g., status) via PATCH /api/bookings/:id
// This enables clients to set status='pending' after creating a booking if desired.
router.patch('/:id', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing token' });
  let payload;
  try {
    const token = auth.split(' ')[1];
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const bookingId = req.params.id;
  if (!bookingId) return res.status(400).json({ error: 'booking id required' });
  const { status } = req.body || {};
  if (typeof status === 'undefined') return res.status(400).json({ error: 'status required' });

  try {
    const conn = await pool.getConnection();
    try {
      // Resolve authenticated user's student_id_no to match bookings.user_id
      const [uRows] = await conn.query('SELECT student_id_no FROM users WHERE user_id = ? LIMIT 1', [payload.userId]);
      if (!uRows || uRows.length === 0) {
        conn.release();
        return res.status(403).json({ error: 'User not found' });
      }
      const studentIdNo = uRows[0].student_id_no;

      // Only allow owner to update their booking
      const [bRows] = await conn.query('SELECT * FROM bookings WHERE id = ? LIMIT 1', [bookingId]);
      if (!bRows || bRows.length === 0) {
        conn.release();
        return res.status(404).json({ error: 'Booking not found' });
      }
      const booking = bRows[0];
      if (String(booking.user_id) !== String(studentIdNo)) {
        conn.release();
        return res.status(403).json({ error: 'Not authorized to modify this booking' });
      }

      // Perform update (only update status field here)
      const [upd] = await conn.query('UPDATE bookings SET status = ? WHERE id = ? AND user_id = ?', [status, bookingId, studentIdNo]);
      const affected = upd && (upd.affectedRows || upd.affected_rows || upd.affected) ? (upd.affectedRows || upd.affected_rows || upd.affected) : 0;
      conn.release();
      if (affected === 0) return res.status(409).json({ error: 'No rows updated' });
      return res.json({ ok: true, booking_id: bookingId, status });
    } catch (err) {
      conn.release();
      console.error('PATCH booking failed', err);
      return res.status(500).json({ error: 'Server error' });
    }
  } catch (err) {
    console.error('PATCH booking route error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
