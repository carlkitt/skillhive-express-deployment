const { pool } = require('../src/models/user');

async function run() {
  const bookingId = 19;
  try {
    const [res] = await pool.query('UPDATE bookings SET status = ?, tutor_reason = NULL, tutor_responded_at = NULL WHERE id = ?', ['pending', bookingId]);
    console.log('Revert result:', res.affectedRows, 'row(s) updated');
  } catch (e) {
    console.error('Revert failed:', e);
  } finally {
    process.exit(0);
  }
}

run();
