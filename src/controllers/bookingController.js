const { pool } = require('../models/user') || require('../utils/mysqlQuery');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/secret');

/**
 * Tutor responds to a booking: accept or reject with optional reason.
 * Endpoint should verify JWT and ensure the caller is the tutor for the session
 * (basic check implemented here using tutor_id on bookings/sessions when available).
 */
async function tutorRespond(req, res) {
	const auth = req.headers.authorization;
	if (!auth) return res.status(401).json({ error: 'Missing token' });
	let payload;
	try {
		const token = auth.split(' ')[1];
		payload = jwt.verify(token, JWT_SECRET);
	} catch (err) {
		return res.status(401).json({ error: 'Invalid token' });
	}

	const tutorUserId = payload.userId;
	const bookingId = req.params.bookingId;
	const { decision, reason } = req.body || {};
	if (!bookingId) return res.status(400).json({ error: 'bookingId required' });
	if (!decision || (decision !== 'accepted' && decision !== 'rejected')) return res.status(400).json({ error: 'decision must be "accepted" or "rejected"' });

	try {
		const conn = await pool.getConnection();
		try {
			await conn.beginTransaction();

			// Lock the booking row
			const [rows] = await conn.query('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [bookingId]);
			if (!rows || rows.length === 0) {
				await conn.rollback();
				conn.release();
				return res.status(404).json({ error: 'Booking not found' });
			}
			const booking = rows[0];

			// Optional: verify caller is tutor for this booking's session
			// bookings.tutor_id may be present, otherwise try to resolve via sessions table
			let bookingTutorId = booking.tutor_id;
			if (!bookingTutorId && booking.session_id) {
				const [srows] = await conn.query('SELECT tutor_id FROM sessions WHERE session_id = ? LIMIT 1', [booking.session_id]);
				if (srows && srows.length > 0) bookingTutorId = srows[0].tutor_id;
			}

			if (bookingTutorId) {
				// tutorUserId may be a user_id, while bookingTutorId may be numeric id — best-effort string compare
				if (String(bookingTutorId) !== String(tutorUserId)) {
					await conn.rollback();
					conn.release();
					return res.status(403).json({ error: 'Not authorized to respond to this booking' });
				}
			}

			// Only allow response when booking is pending
			const current = booking.status || '';
			if (current !== 'pending') {
				await conn.rollback();
				conn.release();
				return res.status(409).json({ error: 'Booking already responded', status: current });
			}

			// Perform update
			const [upd] = await conn.query('UPDATE bookings SET status = ?, tutor_reason = ?, tutor_responded_at = NOW() WHERE id = ? AND status = ?', [decision, reason || null, bookingId, 'pending']);
			const affected = upd && (upd.affectedRows || upd.affected_rows || upd.affected) ? (upd.affectedRows || upd.affected_rows || upd.affected) : 0;
			if (affected === 0) {
				await conn.rollback();
				conn.release();
				return res.status(409).json({ error: 'Concurrent update or no-op' });
			}

			// Insert notification to student if notifications table exists
			try {
				const studentId = booking.user_id;
				if (studentId) {
					const [cols] = await conn.query('SHOW COLUMNS FROM notifications');
					const colNames = (cols || []).map(c => c.Field);

					const title = `Your booking was ${decision}`;
					const message = reason || `Your booking was ${decision} by the tutor.`;

										// Build a sensible INSERT using available columns on this installation
										const notifFields = [];
										const notifParams = [];
										// Try to resolve bookings.user_id (student_id_no) to users.user_id
										let resolvedStudentUserId = null;
										try {
											const [urows] = await conn.query('SELECT user_id FROM users WHERE student_id_no = ? LIMIT 1', [studentId]);
											if (urows && urows.length > 0) resolvedStudentUserId = urows[0].user_id;
										} catch (e) {}
										if (colNames.includes('user_id')) { notifFields.push('user_id'); notifParams.push(resolvedStudentUserId || studentId); }
					if (colNames.includes('type')) { notifFields.push('type'); notifParams.push('booking_response'); }
					if (colNames.includes('title')) { notifFields.push('title'); notifParams.push(title); }
					// prefer 'message' column name; fall back to 'body' for legacy schemas
					if (colNames.includes('message')) { notifFields.push('message'); notifParams.push(message); }
					else if (colNames.includes('body')) { notifFields.push('body'); notifParams.push(message); }
															if (colNames.includes('related_id')) { notifFields.push('related_id'); notifParams.push(bookingId); }
															if (colNames.includes('payload')) {
																notifFields.push('payload');
																notifParams.push(JSON.stringify({ booking_id: bookingId, session_id: booking.session_id || null, available_time_id: booking.available_time_id || null, student_user_id: resolvedStudentUserId || null }));
															}
					if (colNames.includes('is_read')) { notifFields.push('is_read'); notifParams.push(0); }

					if (notifFields.length > 0) {
						let notifSql;
						if (colNames.includes('created_at')) {
							notifSql = `INSERT INTO notifications (${notifFields.join(',')}, created_at) VALUES (${notifFields.map(_=>'?').join(',')}, NOW())`;
						} else {
							notifSql = `INSERT INTO notifications (${notifFields.join(',')}) VALUES (${notifFields.map(_=>'?').join(',')})`;
						}
						await conn.query(notifSql, notifParams);
					}
				}
			} catch (e) {
				// non-fatal: log but do not rollback booking change
				try { console.error('Failed to insert notification', e); } catch (_) {}
			}

			await conn.commit();
			conn.release();
			return res.json({ ok: true });
		} catch (err) {
			await conn.rollback();
			conn.release();
			console.error('tutorRespond transaction failed', err);
			return res.status(500).json({ error: 'Server error' });
		}
	} catch (err) {
		console.error('tutorRespond route error', err);
		return res.status(500).json({ error: 'Server error' });
	}
}

module.exports = { tutorRespond };

