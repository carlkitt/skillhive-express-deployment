const { pool, query } = require('../src/utils/mysqlQuery');

async function run() {
  try {
    const bookingId = 19;
    // fetch the booking row
    const rows = await query(pool, 'SELECT * FROM bookings WHERE id = ? LIMIT 1', [bookingId]);
    if (!rows || rows.length === 0) {
      console.error('Booking not found:', bookingId);
      process.exit(1);
    }
    const booking = rows[0];

    // Prepare notification fields
    const user_id = booking.user_id || '';
    const type = 'booking_request';
    const title = 'New booking request';
    const message = `${user_id} booked available_time ${booking.available_time_id} for session ${booking.session_id}`;
    const related_id = bookingId;
  // Table `notifications` does not include a `payload` column in this DB schema.
  // Insert the notification using `related_id` to reference the booking.
  const insertSql = 'INSERT INTO notifications (user_id, type, title, message, related_id, created_at, is_read) VALUES (?, ?, ?, ?, ?, NOW(), 0)';
  const params = [user_id, type, title, message, related_id];

    const res = await query(pool, insertSql, params);
    console.log('Inserted notification id:', res.insertId);
    process.exit(0);
  } catch (err) {
    console.error('Error inserting notification', err);
    process.exit(2);
  }
}

run();
