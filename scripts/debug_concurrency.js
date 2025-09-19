const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

(async function(){
  // ensure mocks are used by loading test file's setup (USE_MOCK_DB should be set externally)
  process.env.USE_MOCK_DB = '1';
  // Clear any cached modules that may hold old mocks
  delete require.cache[require.resolve('../src/routes/bookings')];
  const bookings = require('../src/routes/bookings');
  const app = express();
  app.use(express.json());
  app.use('/api/bookings', bookings);

  const secret = require('../src/config/secret');
  const token = jwt.sign({ userId: 2 }, secret, { expiresIn: '1h' });

  const p1 = request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ available_time_id: 7, voucher_inventory_id: 4 });
  const p2 = request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ available_time_id: 7, voucher_inventory_id: 4 });

  const results = await Promise.allSettled([p1, p2]);
  console.log(results.map(r => r.status === 'fulfilled' ? r.value.status : (r.reason && r.reason.status) || 500));
})();
