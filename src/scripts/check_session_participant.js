const { query, pool } = require('../utils/mysqlQuery');

async function run() {
  try {
    const rows = await query(pool, 'SELECT * FROM session_participants WHERE session_id = ? AND user_id = ? LIMIT 1', [42, 2]);
    console.log('Row:', rows && rows.length ? rows[0] : null);
  } catch (e) {
    console.error('Failed to query session_participants', e && e.message ? e.message : e);
  } finally {
    process.exit(0);
  }
}

run();
