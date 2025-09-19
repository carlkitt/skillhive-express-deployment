const { pool } = require('../src/models/user');

/**
 * Paginated, idempotent backfill for notifications.payload
 * Usage:
 *  node backfill_notifications_payload.js [--batch=500] [--dry-run]
 * Environment: uses DB from backend/src/models/user.js
 */
async function run() {
  const argv = process.argv.slice(2);
  const batchArg = argv.find(a => a.startsWith('--batch='));
  const dryRun = argv.includes('--dry-run');
  const batchSize = batchArg ? Math.max(1, parseInt(batchArg.split('=')[1] || '1000')) : (process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 1000);

  console.log(`Backfill: running idempotent paginated backfill (batch=${batchSize}, dryRun=${dryRun})`);

  const conn = await pool.getConnection();
  let totalFound = 0;
  let totalUpdated = 0;
  try {
    while (true) {
      // Select a page of notifications that still need payload
      const [rows] = await conn.query(
        "SELECT id, related_id FROM notifications WHERE (payload IS NULL OR payload = '') AND related_id IS NOT NULL ORDER BY id ASC LIMIT ?",
        [batchSize]
      );
      if (!rows || rows.length === 0) break;
      totalFound += rows.length;
      console.log(`Processing page: ${rows.length} notifications`);

      for (const r of rows) {
        const notifId = r.id;
        const related = r.related_id;
        try {
          // Resolve booking row
          const [brows] = await conn.query('SELECT id, session_id, available_time_id, user_id FROM bookings WHERE id = ? LIMIT 1', [related]);
          if (!brows || brows.length === 0) {
            console.warn(`Notification ${notifId}: related booking ${related} not found, skipping`);
            continue;
          }
          const b = brows[0];
          // Try to resolve bookings.user_id (student_id_no) to users.user_id
          let studentUserId = null;
          try {
            const [urows] = await conn.query('SELECT user_id FROM users WHERE student_id_no = ? LIMIT 1', [b.user_id]);
            if (urows && urows.length > 0) studentUserId = urows[0].user_id;
          } catch (e) {
            // ignore resolution errors
          }

          const payloadObj = { booking_id: b.id || related, session_id: b.session_id || null, available_time_id: b.available_time_id || null, student_user_id: studentUserId };
          const payload = JSON.stringify(payloadObj);

          if (dryRun) {
            console.log(`[dry-run] would update notification ${notifId} -> ${payload} (resolve user -> ${studentUserId})`);
            continue;
          }

          // Update payload and, if we resolved a real user_id, update notifications.user_id to reference users.user_id
          if (studentUserId) {
            const [u] = await conn.query('UPDATE notifications SET payload = ?, user_id = ? WHERE id = ? AND (payload IS NULL OR payload = "")', [payload, studentUserId, notifId]);
            const affected = u && (u.affectedRows || u.affected_rows || Object.values(u)[0]) ? (u.affectedRows || u.affected_rows || Object.values(u)[0]) : 0;
            if (affected > 0) {
              totalUpdated++;
              console.log(`Updated notification ${notifId} (payload + user_id=${studentUserId})`);
            } else {
              console.log(`Notification ${notifId} was already updated concurrently, skipping`);
            }
          } else {
            const [u] = await conn.query('UPDATE notifications SET payload = ? WHERE id = ? AND (payload IS NULL OR payload = "")', [payload, notifId]);
            const affected = u && (u.affectedRows || u.affected_rows || Object.values(u)[0]) ? (u.affectedRows || u.affected_rows || Object.values(u)[0]) : 0;
            if (affected > 0) {
              totalUpdated++;
              console.log(`Updated notification ${notifId}`);
            } else {
              console.log(`Notification ${notifId} was already updated concurrently, skipping`);
            }
          }
        } catch (e) {
          console.error('Failed to backfill notification', notifId, e && e.message ? e.message : e);
        }
      }

      // If we processed less than batchSize, we're done
      if (rows.length < batchSize) break;
      // otherwise continue to next page
    }

    console.log(`Backfill complete. Found=${totalFound} Updated=${totalUpdated}`);
  } catch (e) {
    console.error('Backfill failed:', e && e.message ? e.message : e);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
