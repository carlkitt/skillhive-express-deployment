const { pool } = require('../src/models/user');

async function run() {
  const notifId = 42;
  const bookingId = 47;
  const conn = await pool.getConnection();
  try {
    const [nrows] = await conn.query('SELECT * FROM notifications WHERE id = ? LIMIT 1', [notifId]);
    const [brows] = await conn.query('SELECT * FROM bookings WHERE id = ? LIMIT 1', [bookingId]);
    console.log('notification:', JSON.stringify(nrows && nrows[0] ? nrows[0] : nrows, null, 2));
    console.log('booking:', JSON.stringify(brows && brows[0] ? brows[0] : brows, null, 2));
  } catch (e) {
    console.error('Error', e);
    process.exitCode = 1;
  } finally {
    conn.release();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
