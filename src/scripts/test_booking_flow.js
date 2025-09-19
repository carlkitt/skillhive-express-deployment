const axios = require('axios');
const fs = require('fs');

// Use 127.0.0.1 to avoid IPv6 localhost (::1) connection issues on some Windows setups
const BASE = process.env.BASE || 'http://127.0.0.1:3000/api';
const CREDENTIALS = { username: 'carl', password: '@a333333' }; // adjust if needed

async function run() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post(`${BASE}/login`, CREDENTIALS);
    const token = loginRes.data && loginRes.data.token;
    if (!token) return console.error('Login did not return token', loginRes.data);
    console.log('Token acquired');

    const headers = { Authorization: `Bearer ${token}` };

  // Query available times and pick a free slot (capacity > booked and not ongoing)
  console.log('Fetching available times...');
  const atRes = await axios.get(`${BASE}/available-times`);
  const slots = atRes.data || [];
    const candidates = (slots || []).filter(s => (s.capacity || 0) > (s.booked || 0) && !s.ongoing);
    if (!candidates || candidates.length === 0) return console.error('No free available_time found to book');

    let bookRes = null;
    for (const free of candidates) {
      console.log('Trying slot', free.id, free.day, free.time, `booked=${free.booked}/${free.capacity}`);
      try {
        bookRes = await axios.post(`${BASE}/bookings`, { available_time_id: free.id }, { headers });
        console.log('Booked slot', free.id);
        break;
      } catch (err) {
        if (err.response && err.response.status === 409) {
          console.log('Slot already booked by this user, trying next slot');
          continue;
        }
        throw err;
      }
    }
    if (!bookRes) return console.error('Failed to book any available slot (all candidates prevented booking)');
    console.log('Booking response:', bookRes.data);
    const bookingId = bookRes.data && (bookRes.data.booking_id || (bookRes.data.booking && bookRes.data.booking.id));
    if (!bookingId) return console.error('Booking did not return id');

    console.log('Fetching booking row id=', bookingId);
    const getRes = await axios.get(`${BASE}/bookings/${bookingId}`, { headers });
    console.log('Booking row:', getRes.data);

  } catch (err) {
    if (err.response) {
      console.error('HTTP error', err.response.status, err.response.data);
    } else {
      const msg = err && err.message ? err.message : String(err);
      console.error('Error', msg);
      if (msg.includes('ECONNREFUSED')) {
        console.error('\nConnection refused. Is the backend running? Start it with:');
        console.error('  cd backend; npm run dev');
        console.error('Or set BASE env to your server URL, e.g. $env:BASE = "http://127.0.0.1:3000/api"');
      }
    }
  }
}

run();
