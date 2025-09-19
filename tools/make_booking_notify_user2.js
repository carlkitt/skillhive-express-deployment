// Script: create a session, available_time, booking, and notification for user_id=2
const { pool } = require('../src/models/user');

async function run() {
  const tutorId = 6; // as requested
  const notifyUserId = 2; // target user to receive notification

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // create session
    const [sres] = await conn.query('INSERT INTO sessions (tutor_id, title, price) VALUES (?, ?, ?)', [tutorId, 'Scripted Test Session', 0]);
    const sessionId = (sres && (sres.insertId || sres.insert_id)) ? (sres.insertId || sres.insert_id) : null;

    // create an available_time (schema may differ across envs)
    const day = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const time = '10:00';
    const [atres] = await conn.query('INSERT INTO available_times (user_id, session_id, day, time, booked, capacity) VALUES (?, ?, ?, ?, ?, ?)', [tutorId, sessionId, day, time, 0, 1]);
    const availableTimeId = (atres && (atres.insertId || atres.insert_id)) ? (atres.insertId || atres.insert_id) : null;

    // Create a student user record to get a student_id_no (bookings.user_id often stores student_id_no)
    const studentNo = 'S_TEMP_' + Date.now();
    const [ures] = await conn.query('INSERT INTO users (username, student_id_no) VALUES (?, ?)', ['temp_student_' + Date.now(), studentNo]);
    const studentUserId = (ures && (ures.insertId || ures.insert_id)) ? (ures.insertId || ures.insert_id) : null;

    // Insert booking (bookings.user_id stores student_id_no in this schema)
    const [bres] = await conn.query('INSERT INTO bookings (available_time_id, user_id, status, session_id, tutor_id, booked_at) VALUES (?, ?, ?, ?, ?, NOW())', [availableTimeId, studentNo, 'pending', sessionId, tutorId]);
    const bookingId = (bres && (bres.insertId || bres.insert_id)) ? (bres.insertId || bres.insert_id) : null;

    // Prepare notification payload
    const payload = JSON.stringify({ booking_id: bookingId, session_id: sessionId, available_time_id: availableTimeId, student_user_id: studentUserId });

    // Detect notifications columns and insert only existing ones
    const [ncols] = await conn.query('SHOW COLUMNS FROM notifications');
    const ncolNames = (ncols || []).map(c => c.Field);
    const fields = [];
    const params = [];
    if (ncolNames.includes('user_id')) { fields.push('user_id'); params.push(notifyUserId); }
    if (ncolNames.includes('sender_id')) { fields.push('sender_id'); params.push(tutorId); }
    if (ncolNames.includes('type')) { fields.push('type'); params.push('booking_created'); }
    if (ncolNames.includes('title')) { fields.push('title'); params.push('Booking created for you'); }
    if (ncolNames.includes('message')) { fields.push('message'); params.push('A booking was created for you'); }
    if (ncolNames.includes('payload')) { fields.push('payload'); params.push(payload); }
    if (ncolNames.includes('is_read')) { fields.push('is_read'); params.push(0); }
    if (ncolNames.includes('related_id')) { fields.push('related_id'); params.push(bookingId); }

    let notifId = null;
    if (fields.length > 0) {
      let sql;
      if (ncolNames.includes('created_at')) {
        sql = `INSERT INTO notifications (${fields.join(',')}, created_at) VALUES (${fields.map(_=>'?').join(',')}, NOW())`;
      } else {
        sql = `INSERT INTO notifications (${fields.join(',')}) VALUES (${fields.map(_=>'?').join(',')})`;
      }
      const [nres] = await conn.query(sql, params);
      notifId = (nres && (nres.insertId || nres.insert_id)) ? (nres.insertId || nres.insert_id) : null;
    }

    await conn.commit();
    console.log('Created sessionId=', sessionId, 'availableTimeId=', availableTimeId, 'studentUserId=', studentUserId, 'bookingId=', bookingId, 'notificationId=', notifId);
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch(e){}
    }
    console.error('Error creating booking/notification:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    if (conn) conn.release();
  }
}

run().catch(e => { console.error('Fatal', e); process.exit(1); });
