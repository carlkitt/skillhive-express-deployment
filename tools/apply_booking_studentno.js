const { pool } = require('../src/models/user');

async function run() {
  const bookingId = 47;
  const notifId = 42;
  const canonicalUserId = 2;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // find student_id_no for canonical user_id
    const [urows] = await conn.query('SELECT student_id_no FROM users WHERE user_id = ? LIMIT 1', [canonicalUserId]);
    if (!urows || urows.length === 0) throw new Error('canonical user not found');
    const studentIdNo = urows[0].student_id_no;
    if (!studentIdNo) throw new Error('user has no student_id_no');

    // update booking.user_id to the student_id_no (satisfies FK)
    await conn.query('UPDATE bookings SET user_id = ? WHERE id = ?', [studentIdNo, bookingId]);

    // update notification payload student_user_id -> canonicalUserId
    const [nrows] = await conn.query('SELECT payload FROM notifications WHERE id = ? LIMIT 1', [notifId]);
    if (nrows && nrows.length > 0) {
      let payload = null;
      try { payload = JSON.parse(nrows[0].payload); } catch(e) { payload = null; }
      if (payload && typeof payload === 'object') {
        payload.student_user_id = canonicalUserId;
        await conn.query('UPDATE notifications SET payload = ? WHERE id = ?', [JSON.stringify(payload), notifId]);
      } else {
        // if no payload, set user_id to canonical
        await conn.query('UPDATE notifications SET user_id = ? WHERE id = ?', [canonicalUserId, notifId]);
      }
    }

    await conn.commit();
    console.log('Updated booking.user_id to student_id_no and notification payload student_user_id');
  } catch (e) {
    try { await conn.rollback(); } catch(_){}
    console.error('Error', e);
    process.exitCode = 1;
  } finally {
    conn.release();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
