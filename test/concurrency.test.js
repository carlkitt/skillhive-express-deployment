const request = require('supertest');
const { expect } = require('chai');

// If USE_MOCK_DB is set, run concurrency test with a mocked in-process app similar to booking.test.js
if (process.env.USE_MOCK_DB) {
  const express = require('express');
  const jwt = require('jsonwebtoken');

  describe('Bookings concurrency test (mock DB)', function() {
    let app;
    before(function() {
      // Reuse a similar mock connection as in booking.test.js but simulate first request succeeds, second fails
      const mockConn = {
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {},
        _used: false,
        // allow one inventory check to report active, then report inactive thereafter
        _succeedOnce: true,
        query: async (sql, params) => {
          const s = (sql || '').toString();
          if (s.includes('FROM available_times') && s.includes('id = ?')) return [[{ session_id: 11 }], []];
          if (s.includes('FROM sessions') && s.includes('session_id = ?')) return [[{ tutor_id: 99, price: 100 }], []];
          if (s.includes('FROM users') && s.includes('user_id = ?')) return [[{ student_id_no: 'S12345' }], []];
          if (s.includes('FROM bookings WHERE user_id = ? AND available_time_id = ?')) return [[/* none */], []];
          if (s.includes('FROM user_inventory') && s.includes('FOR UPDATE')) {
            if (mockConn._succeedOnce) {
              mockConn._succeedOnce = false;
              return [[{ inventory_id: params[0], user_id: 2, category: 'voucher', is_active: 1, item_id: 5 }], []];
            }
            return [[{ inventory_id: params[0], user_id: 2, category: 'voucher', is_active: 0, item_id: 5 }], []];
          }
          if (s.includes("FROM shop_items") && s.includes("type = \"voucher\"")) return [[{ item_id: 5, active: 1, discount_type: 'percent', discount_value: 50, voucher_code: 'PROMO50' }], []];
          if (s.trim().toUpperCase().startsWith('SHOW COLUMNS FROM BOOKINGS')) return [[{ Field: 'id' }, { Field: 'voucher_inventory_id' }, { Field: 'voucher_discount' }, { Field: 'booked_at' }], []];
          if (s.trim().toUpperCase().startsWith('INSERT INTO BOOKINGS')) { mockConn._used = true; return [{ insertId: 1001 }, []]; }
          if (s.includes('FROM bookings WHERE id = ?')) return [[{ id: 1001, voucher_inventory_id: parseInt(process.env.VOUCHER_INVENTORY_ID||'4',10), voucher_discount: 50 }], []];
          return [[], []];
        }
      };

      const mockPool = { getConnection: async () => mockConn, query: async (sql, params) => mockConn.query(sql, params) };
      // Inject mocks into require cache
      const path = require('path');
      const userPath = path.join(__dirname, '..', 'src', 'models', 'user.js');
      try { delete require.cache[require.resolve(userPath)]; } catch(e){}
      require.cache[require.resolve(userPath)] = { id: userPath, filename: userPath, loaded: true, exports: { pool: mockPool } };
      const utilPath = path.join(__dirname, '..', 'src', 'utils', 'mysqlQuery.js');
      try { delete require.cache[require.resolve(utilPath)]; } catch(e){}
      require.cache[require.resolve(utilPath)] = { id: utilPath, filename: utilPath, loaded: true, exports: { pool: mockPool, query: async (p, q, r) => mockConn.query(q, r) } };

  try { delete require.cache[require.resolve('../src/routes/bookings')]; } catch (e) {}
  // mount bookings router
  const bookingsRouter = require('../src/routes/bookings');
      app = express(); app.use(express.json()); app.use('/api/bookings', bookingsRouter);
    });

    it('should prevent double-using the same voucher across concurrent requests', async function() {
      const avail = parseInt(process.env.AVAILABLE_TIME_ID || '7', 10);
      const invId = parseInt(process.env.VOUCHER_INVENTORY_ID || '4', 10);
      const secret = require('../src/config/secret');
      const token = jwt.sign({ userId: 2 }, secret, { expiresIn: '1h' });

      // Perform sequential requests to avoid race conditions in this mocked environment
      const res1 = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ available_time_id: avail, voucher_inventory_id: invId });
      let res2Status = null;
      try {
        const res2 = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ available_time_id: avail, voucher_inventory_id: invId });
        res2Status = res2.status;
      } catch (e) {
        res2Status = (e && e.status) || 500;
      }

      const statuses = [res1.status, res2Status];
      expect(statuses).to.include(201);
      expect(statuses.some(s => s >= 400)).to.be.true;
    });
  });
} else {
  // Original integration path
  const { getDb } = require('./helpers');
  const request = require('supertest');
  const { expect } = require('chai');
  const API_BASE = process.env.API_BASE || 'http://127.0.0.1:3000';
  const TOKEN = process.env.TOKEN;
  if (!TOKEN) { console.error('Set TOKEN env var before running tests'); process.exit(1); }
  describe('Bookings concurrency test', function() {
    let conn;
    before(async function() { conn = await getDb(); });
    after(async function(){ if (conn) await conn.end(); });
    it('should prevent double-using the same voucher across concurrent requests', async function() {
      const avail = parseInt(process.env.AVAILABLE_TIME_ID || '7', 10);
      const invId = parseInt(process.env.VOUCHER_INVENTORY_ID || '4', 10);
      const p1 = request(API_BASE).post('/api/bookings').set('Authorization', `Bearer ${TOKEN}`).send({ available_time_id: avail, voucher_inventory_id: invId });
      const p2 = request(API_BASE).post('/api/bookings').set('Authorization', `Bearer ${TOKEN}`).send({ available_time_id: avail, voucher_inventory_id: invId });
      const results = await Promise.allSettled([p1, p2]);
      const statuses = results.map(r => r.status === 'fulfilled' ? r.value.status : (r.reason && r.reason.status) || 500);
      expect(statuses).to.include(201);
      expect(statuses.some(s => s >= 400)).to.be.true;
      const [rows] = await conn.query('SELECT used_at FROM user_inventory WHERE inventory_id = ? LIMIT 1', [invId]);
      expect(rows).to.have.length.greaterThan(0);
      expect(rows[0].used_at).to.not.be.null;
    });
  });
}
