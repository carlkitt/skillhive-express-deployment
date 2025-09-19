const request = require('supertest');
const { expect } = require('chai');
const { getDb } = require('./helpers');

// Integration test: only runs when RUN_INTEGRATION=1 and both API_BASE and TOKEN are provided
if (!process.env.RUN_INTEGRATION) {
  console.log('Skipping integration test booking.integration.test.js (set RUN_INTEGRATION=1 to enable)');
} else if (!process.env.API_BASE) {
  console.log('Skipping integration test booking.integration.test.js (set API_BASE to enable)');
} else if (!process.env.TOKEN) {
  console.error('Set TOKEN env var before running integration tests');
  process.exit(1);
} else {
  const API_BASE = process.env.API_BASE;
  const TOKEN = process.env.TOKEN;

  describe('Bookings API - voucher happy path (integration)', function() {
    let conn;
    before(async function() { conn = await getDb(); });
    after(async function(){ if (conn) await conn.end(); });

    it('should create booking with voucher and mark inventory used', async function() {
      const avail = parseInt(process.env.AVAILABLE_TIME_ID || '7', 10);
      const invId = parseInt(process.env.VOUCHER_INVENTORY_ID || '3', 10);

      const res = await request(API_BASE)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${TOKEN}`)
        .send({ available_time_id: avail, voucher_inventory_id: invId })
        .expect(201);

      expect(res.body).to.have.property('booking');
      const b = res.body.booking;
      expect(b).to.have.property('id');
      expect(b.voucher_inventory_id).to.equal(invId);
      expect(b).to.have.property('voucher_discount');

      const [rows] = await conn.query('SELECT used_at FROM user_inventory WHERE inventory_id = ? LIMIT 1', [invId]);
      expect(rows).to.have.length.greaterThan(0);
      expect(rows[0].used_at).to.not.be.null;
    });
  });
}
