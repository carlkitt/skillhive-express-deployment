const request = require('supertest');
const { expect } = require('chai');
const express = require('express');
const jwt = require('jsonwebtoken');

// We'll run the bookings router in-process with a mocked DB so tests don't need MySQL running.
// Prepare a simple mock pool/connection that responds to the queries the route performs for this happy-path test.
describe('Bookings API - voucher happy path (mock DB)', function() {
  let app;
  before(function() {
    // Create a mock connection object
    const mockConn = {
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      // Very small SQL router for expected queries in bookings.js
      query: async (sql, params) => {
        const s = (sql || '').toString();
        // available_times -> return session_id
        if (s.includes('FROM available_times') && s.includes('id = ?')) {
          return [[{ session_id: 11 }], []];
        }
        // sessions -> return tutor_id and price
        if (s.includes('FROM sessions') && s.includes('session_id = ?')) {
          return [[{ tutor_id: 99, price: 100 }], []];
        }
        // users -> return student_id_no for user mapping
        if (s.includes('FROM users') && s.includes('user_id = ?')) {
          return [[{ student_id_no: 'S12345' }], []];
        }
        // bookings existence check -> none
        if (s.includes('FROM bookings WHERE user_id = ? AND available_time_id = ?')) {
          return [[/* no rows */], []];
        }
        // Lock inventory row
        if (s.includes('FROM user_inventory') && s.includes('FOR UPDATE')) {
          return [[{ inventory_id: params[0], user_id: 2, category: 'voucher', is_active: 1, item_id: 5 }], []];
        }
        // shop_items lookup
        if (s.includes("FROM shop_items") && s.includes("type = \"voucher\"")) {
          return [[{ item_id: 5, active: 1, discount_type: 'percent', discount_value: 50, voucher_code: 'PROMO50' }], []];
        }
        // SHOW COLUMNS FROM bookings -> include voucher columns expected
        if (s.trim().toUpperCase().startsWith('SHOW COLUMNS FROM BOOKINGS')) {
          return [[
            { Field: 'id' }, { Field: 'available_time_id' }, { Field: 'session_id' }, { Field: 'tutor_id' },
            { Field: 'user_id' }, { Field: 'status' }, { Field: 'price_charged' }, { Field: 'voucher_inventory_id' },
            { Field: 'voucher_item_id' }, { Field: 'voucher_code' }, { Field: 'voucher_discount' }, { Field: 'price_before' },
            { Field: 'price_after' }, { Field: 'voucher_used_at' }, { Field: 'booked_at' }
          ], []];
        }
        // Simulate insert returning insertId
        if (s.trim().toUpperCase().startsWith('INSERT INTO BOOKINGS')) {
          return [{ insertId: 999 }, []];
        }
        // Update available_times/book inventory/update voucher_usage/other writes -> return ok
        if (s.trim().toUpperCase().startsWith('UPDATE') || s.trim().toUpperCase().startsWith('INSERT')) {
          return [{ affectedRows: 1 }, []];
        }
        // Fetch booking after insert
        if (s.includes('FROM bookings WHERE id = ?')) {
          const inv = parseInt(process.env.VOUCHER_INVENTORY_ID || '3', 10);
          return [[{ id: 999, voucher_inventory_id: inv, voucher_discount: 50, price_after: 50 }], []];
        }
        // Default empty
        return [[], []];
      }
    };

    // Minimal mock pool exposing getConnection that returns mockConn
    const mockPool = {
      getConnection: async () => mockConn,
      query: async (sql, params) => mockConn.query(sql, params),
    };

    // Inject mock modules into require cache so bookings route picks them up
    const path = require('path');
    const Module = require('module');
    const resolve = (p) => require.resolve(p);
    // Provide a fake ../src/models/user that exports { pool: mockPool }
    const userPath = path.join(__dirname, '..', 'src', 'models', 'user.js');
    try { delete require.cache[require.resolve(userPath)]; } catch(e){}
    require.cache[require.resolve(userPath)] = { id: userPath, filename: userPath, loaded: true, exports: { pool: mockPool } };
    // Also ensure utils/mysqlQuery pool is mocked
    const utilPath = path.join(__dirname, '..', 'src', 'utils', 'mysqlQuery.js');
    try { delete require.cache[require.resolve(utilPath)]; } catch(e){}
    require.cache[require.resolve(utilPath)] = { id: utilPath, filename: utilPath, loaded: true, exports: { pool: mockPool, query: async (p, q, r) => mockConn.query(q, r) } };

  // Ensure any cached bookings router is removed so our mocks are used
  try { delete require.cache[require.resolve('../src/routes/bookings')]; } catch (e) {}
  // Now require the bookings router and mount it
  const bookingsRouter = require('../src/routes/bookings');
    app = express();
    app.use(express.json());
    app.use('/api/bookings', bookingsRouter);
  });

  it('should create booking with voucher and return booking data', async function() {
    const avail = parseInt(process.env.AVAILABLE_TIME_ID || '7', 10);
    const invId = parseInt(process.env.VOUCHER_INVENTORY_ID || '3', 10);

    // generate a token signed with app secret (userId=2)
    const secret = require('../src/config/secret');
    const token = jwt.sign({ userId: 2 }, secret, { expiresIn: '1h' });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ available_time_id: avail, voucher_inventory_id: invId })
      .expect(201);

    expect(res.body).to.have.property('booking');
    const b = res.body.booking;
    expect(b).to.have.property('id');
    expect(b.voucher_inventory_id).to.equal(invId);
    expect(b).to.have.property('voucher_discount');
  });
});
