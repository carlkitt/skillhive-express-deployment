// Simple integration test: POST booking with voucher_inventory_id then query DB to confirm used_at
// Usage: node integration_test_booking.js
// Requires env: API_BASE (e.g. http://localhost:3000), TOKEN (Bearer token), DB_HOST, DB_USER, DB_PASS, DB_NAME

const fetch = require('node-fetch');
const mysql = require('mysql2/promise');

(async function main(){
  const apiBase = process.env.API_BASE || 'http://localhost:3000';
  const token = process.env.TOKEN;
  const avail = process.env.AVAILABLE_TIME_ID || 7;
  const invId = process.env.VOUCHER_INVENTORY_ID || 3;
  if (!token) {
    console.error('Set TOKEN env var with Bearer token');
    process.exit(1);
  }

  try {
    console.log('Posting booking...');
    const resp = await fetch(`${apiBase}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ available_time_id: parseInt(avail,10), voucher_inventory_id: parseInt(invId,10) })
    });
    const data = await resp.json();
    console.log('Booking response status:', resp.status);
    console.log(JSON.stringify(data, null, 2));

    if (resp.status >=200 && resp.status < 300) {
      const bookingId = data.booking ? data.booking.id : data.booking_id || null;
      console.log('Booking created:', bookingId);

      // connect to DB to inspect inventory
      const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  // accept either DB_PASSWORD or DB_PASS for flexibility
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'skillhivedb',
      });
      const [rows] = await conn.query('SELECT * FROM user_inventory WHERE inventory_id = ? LIMIT 1', [invId]);
      console.log('Inventory row:', rows[0]);
      if (bookingId) {
        const [brows] = await conn.query('SELECT * FROM bookings WHERE id = ? LIMIT 1', [bookingId]);
        console.log('Booking row snapshot:', brows[0]);
      }
      await conn.end();
    }
  } catch (e) {
    console.error('Test failed', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();
