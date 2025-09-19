const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { expect } = require('chai');

describe('Tutor Bookings API (mock DB)', function() {
  let app;
  before(function() {
    // Mock pool/connection for expected queries
    const mockConn = {
      query: async (sql, params) => {
        const s = (sql || '').toString();
        if (s.includes('FROM bookings')) {
          return [[
            {
              booking_id: 1,
              available_time_id: 7,
              slot_start: '2025-09-05T10:00:00Z',
              slot_end: '2025-09-05T10:30:00Z',
              student_user_id: 'S12345',
              student_name: 'Jane Doe',
              profile_pic_url: 'http://example.com/jane.jpg',
              voucher_inventory_id: 3,
              voucher_item_id: 5,
              voucher_code: 'PROMO50',
              voucher_discount: '50.00',
              voucher_used_at: '2025-09-03T12:00:00Z',
              price_before: '100.00',
              price_after: '50.00',
              booked_at: '2025-09-03T11:50:00Z'
            },
            {
              booking_id: 2,
              available_time_id: 7,
              slot_start: '2025-09-05T10:00:00Z',
              slot_end: '2025-09-05T10:30:00Z',
              student_user_id: 'S67890',
              student_name: 'John Smith',
              profile_pic_url: null,
              voucher_inventory_id: null,
              voucher_item_id: null,
              voucher_code: null,
              voucher_discount: null,
              voucher_used_at: null,
              price_before: '100.00',
              price_after: '100.00',
              booked_at: '2025-09-03T11:55:00Z'
            }
          ], []];
        }
        return [[], []];
      },
      release: () => {}
    };
    const mockPool = {
      getConnection: async () => mockConn
    };
    // Inject mock pool into require cache
    const path = require('path');
    const userPath = path.join(__dirname, '..', 'src', 'models', 'user.js');
    require.cache[require.resolve(userPath)] = { id: userPath, filename: userPath, loaded: true, exports: { pool: mockPool } };
    // Mount route
  try { delete require.cache[require.resolve('../src/routes/tutor_bookings')]; } catch (e) {}
  const tutorBookingsRouter = require('../src/routes/tutor_bookings');
    app = express();
    app.use(express.json());
    app.use('/api', tutorBookingsRouter);
  });

  it('should return grouped slots with students and voucher info', async function() {
    const res = await request(app)
      .get('/api/tutors/99/sessions/11/bookings')
      .set('Authorization', 'Bearer dummy')
      .expect(200);
    expect(res.body).to.have.property('slots');
    expect(res.body.slots).to.be.an('array').with.length.greaterThan(0);
    const slot = res.body.slots[0];
    expect(slot.students).to.be.an('array').with.length(2);
    expect(slot.students[0]).to.have.property('voucher_code', 'PROMO50');
    expect(slot.students[1]).to.have.property('voucher_code', null);
  });
});
