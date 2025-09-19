const { pool } = require('../src/models/user');

async function run() {
  const bookingId = 47;
  const notifId = 42;
  const targetUserId = 2;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update bookings.user_id to the canonical numeric user id
    await conn.query('UPDATE bookings SET user_id = ? WHERE id = ?', [targetUserId, bookingId]);

    // Fetch existing notification payload
    const [nrows] = await conn.query('SELECT * FROM notifications WHERE id = ? LIMIT 1', [notifId]);
    if (!nrows || nrows.length === 0) {
      throw new Error('Notification not found');
    }
    const n = nrows[0];
    const payloadStr = n.payload || null;
    let payload = null;
    if (payloadStr) {
      try { payload = JSON.parse(payloadStr); } catch(e) { payload = null; }
    }

    if (payload && typeof payload === 'object') {
      payload.student_user_id = targetUserId;
      const newPayload = JSON.stringify(payload);
      await conn.query('UPDATE notifications SET payload = ? WHERE id = ?', [newPayload, notifId]);
    } else {
      // If no payload, update related_id mapping only
      await conn.query('UPDATE notifications SET user_id = ? WHERE id = ?', [targetUserId, notifId]);
    }

    await conn.commit();
    console.log('Updated booking and notification payload.');
  } catch (e) {
    try { await conn.rollback(); } catch(_){}
    console.error('Error', e);
    process.exitCode = 1;
  } finally {
    conn.release();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
