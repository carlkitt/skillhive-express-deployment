const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ userId: 4 }, 'your_secret_key');
const data = JSON.stringify({ available_time_id: 1 });

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/bookings',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Bearer ' + token,
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (c) => (body += c));
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (e) => {
  console.error('ERR', e);
});

req.write(data);
req.end();
