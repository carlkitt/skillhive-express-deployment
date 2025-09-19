const { pool } = require('../src/models/user');

async function run() {
  const bookingId = 19;
  const decision = 'accepted'; // accepted or rejected
  const reason = 'Simulated accept for testing';
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the booking row
    const [rows] = await conn.query('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [bookingId]);
    if (!rows || rows.length === 0) throw new Error('Booking not found');
    const booking = rows[0];
    if (booking.status !== 'pending') {
      console.log('Booking not pending, current status:', booking.status);
    }

    // Update booking status
    const [res] = await conn.query('UPDATE bookings SET status = ?, tutor_reason = ?, tutor_responded_at = NOW() WHERE id = ? AND status = ?', [decision, reason, bookingId, 'pending']);
    if (res.affectedRows === 0) {
      console.log('No rows updated - maybe already responded');
      await conn.rollback();
      return;
    }

    // Insert notification safely
    try {
      const studentId = booking.user_id;
      if (studentId) {
        const [cols] = await conn.query('SHOW COLUMNS FROM notifications');
        const colNames = (cols || []).map(c => c.Field);

        const title = `Your booking was ${decision}`;
        const message = reason || `Your booking was ${decision} by the tutor.`;

        const notifFields = [];
        const notifParams = [];
        // Try to resolve bookings.user_id (student_id_no) to users.user_id
        let resolvedStudentUserId = null;
        try {
          const [urows] = await conn.query('SELECT user_id FROM users WHERE student_id_no = ? LIMIT 1', [studentId]);
          if (urows && urows.length > 0) resolvedStudentUserId = urows[0].user_id;
        } catch (e) {}

        if (resolvedStudentUserId && colNames.includes('user_id')) { notifFields.push('user_id'); notifParams.push(resolvedStudentUserId); }
        else if (colNames.includes('user_id')) { notifFields.push('user_id'); notifParams.push(studentId); }
        if (colNames.includes('type')) { notifFields.push('type'); notifParams.push('booking_response'); }
        if (colNames.includes('title')) { notifFields.push('title'); notifParams.push(title); }
        if (colNames.includes('message')) { notifFields.push('message'); notifParams.push(message); }
        else if (colNames.includes('body')) { notifFields.push('body'); notifParams.push(message); }
        if (colNames.includes('related_id')) { notifFields.push('related_id'); notifParams.push(bookingId); }
        if (colNames.includes('payload')) { notifFields.push('payload'); notifParams.push(JSON.stringify({ booking_id: bookingId, session_id: booking.session_id || null, available_time_id: booking.available_time_id || null, student_user_id: resolvedStudentUserId })); }
        if (colNames.includes('is_read')) { notifFields.push('is_read'); notifParams.push(0); }

        if (notifFields.length > 0) {
          let notifSql;
          if (colNames.includes('created_at')) {
            notifSql = `INSERT INTO notifications (${notifFields.join(',')}, created_at) VALUES (${notifFields.map(_=>'?').join(',')}, NOW())`;
          } else {
            notifSql = `INSERT INTO notifications (${notifFields.join(',')}) VALUES (${notifFields.map(_=>'?').join(',')})`;
          }
          const [r] = await conn.query(notifSql, notifParams);
          console.log('Inserted notification id:', r.insertId);
        } else {
          console.log('No compatible notification columns found; skipping insert');
        }
      }
    } catch (e) {
      console.error('Notification insert failed:', e);
    }

    await conn.commit();
    console.log('Simulated tutor respond committed.');
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Simulation failed:', e);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
