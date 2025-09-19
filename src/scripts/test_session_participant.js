const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/secret');

async function run() {
  const token = jwt.sign({ userId: 2, username: 'testuser' }, JWT_SECRET, { expiresIn: '1h' });
  const sessionId = 42;
  try {
  const res = await fetch(`http://127.0.0.1:3000/api/session/${sessionId}/participant`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const body = await res.text();
    console.log('Status', res.status);
    console.log(body);
  } catch (e) {
    console.error('Request failed', e);
  }
}

run();
