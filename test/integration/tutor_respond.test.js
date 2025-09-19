const request = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { pool } = require('../../src/models/user');
const JWT_SECRET = require('../../src/config/secret');

describe('Tutor respond integration', function() {
  this.timeout(20000);

  let conn;
  let tutorUserId;
  let studentUserId;
  let bookingId;
  let sessionId;
  let availableTimeId;

  before(async () => {
    conn = await pool.getConnection();
    // Create tutor and student users (or reuse existing test accounts if present)
    const [tu] = await conn.query("INSERT INTO users (username, student_id_no) VALUES (?, ?)", ['test_tutor_' + Date.now(), null]);
    tutorUserId = tu.insertId;
    const studentStudentNo = 'S_TEST_' + Date.now();
    const [su] = await conn.query("INSERT INTO users (username, student_id_no) VALUES (?, ?)", ['test_student_' + Date.now(), studentStudentNo]);
    studentUserId = su.insertId;

    // Create session for tutor
    const [sres] = await conn.query('INSERT INTO sessions (tutor_id, title, price) VALUES (?, ?, ?)', [tutorUserId, 'Test Session', 0]);
    sessionId = sres.insertId || sres.insert_id || sres.insertId;

  // Create an available_time required by bookings
  const [atres] = await conn.query('INSERT INTO available_times (user_id, session_id, day, time, booked, capacity) VALUES (?, ?, ?, ?, ?, ?)', [tutorUserId, sessionId, '2099-01-01', '10:00', 0, 1]);
  availableTimeId = atres.insertId;

    // Insert a booking: bookings.user_id stores student.student_id_no in this schema
    const [bres] = await conn.query('INSERT INTO bookings (available_time_id, user_id, status, session_id, tutor_id) VALUES (?, ?, ?, ?, ?)', [availableTimeId, studentStudentNo, 'pending', sessionId, tutorUserId]);
    bookingId = bres.insertId;
  });

  after(async () => {
    try { await conn.query('DELETE FROM notifications WHERE related_id = ?', [bookingId]); } catch(e){}
    try { await conn.query('DELETE FROM bookings WHERE id = ?', [bookingId]); } catch(e){}
    try { await conn.query('DELETE FROM available_times WHERE id = ?', [availableTimeId]); } catch(e){}
    try { await conn.query('DELETE FROM sessions WHERE session_id = ?', [sessionId]); } catch(e){}
    try { await conn.query('DELETE FROM users WHERE user_id IN (?, ?)', [tutorUserId, studentUserId]); } catch(e){}
    conn.release();
  });

  it('should create notification with resolved user_id and payload when tutor accepts', async () => {
    // Create JWT for tutor
    const token = jwt.sign({ userId: tutorUserId }, JWT_SECRET);

    const resp = await request(app)
      .post(`/api/bookings/${bookingId}/respond`)
      .set('Authorization', 'Bearer ' + token)
      .send({ decision: 'accepted', reason: 'OK' });

  console.log('DEBUG resp.status, body ->', resp.status, resp.body);
  expect(resp.status).to.be.oneOf([200,201,204]);

    // Find notification created for this booking
    const [nrows] = await conn.query('SELECT * FROM notifications WHERE related_id = ? ORDER BY created_at DESC LIMIT 1', [bookingId]);
    expect(nrows).to.have.length.greaterThan(0);
    const n = nrows[0];
    console.log('DEBUG notification row ->', n);
    // user_id should point to studentUserId (resolved from student_id_no)
    expect(n.user_id == studentUserId).to.be.true;

    // payload should include session_id and booking_id
    const payload = n.payload ? JSON.parse(n.payload) : null;
    expect(payload).to.be.an('object');
    expect(Number(payload.booking_id)).to.equal(Number(bookingId));
    expect(Number(payload.session_id)).to.equal(Number(sessionId));
  });
});
