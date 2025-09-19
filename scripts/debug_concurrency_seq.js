const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

(async function(){
  process.env.USE_MOCK_DB = '1';
  delete require.cache[require.resolve('../src/routes/bookings')];
  const bookings = require('../src/routes/bookings');
  const app = express(); app.use(express.json()); app.use('/api/bookings', bookings);
  const secret = require('../src/config/secret');
  const token = jwt.sign({ userId: 2 }, secret, { expiresIn: '1h' });

  const res1 = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ available_time_id:7, voucher_inventory_id:4});
  console.log('res1.status', res1.status);
  console.log('res1.body', JSON.stringify(res1.body));
  let res2Status;
  try {
    const res2 = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ available_time_id:7, voucher_inventory_id:4});
    console.log('res2.status', res2.status);
    console.log('res2.body', JSON.stringify(res2.body));
    res2Status = res2.status;
  } catch(e) {
    console.log('res2.err', JSON.stringify(e && e.response && e.response.body ? e.response.body : e));
    res2Status = (e && e.status) || 500;
  }
  console.log('final statuses', [res1.status, res2Status]);
})();
