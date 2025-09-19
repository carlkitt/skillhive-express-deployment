const { query, pool } = require('../utils/mysqlQuery');

async function check() {
  try {
    console.log('Checking distinct user_id values in feedback...');
    const ids = await query(pool, 'SELECT DISTINCT user_id FROM feedback');
    const userIds = ids.map(r => r.user_id).filter(Boolean);
    console.log('Found user_ids in feedback:', userIds);

    if (userIds.length === 0) {
      console.log('No user_id values present in feedback.');
      process.exit(0);
    }

    const placeholders = userIds.map(() => '?').join(',');
    const users = await query(pool, `SELECT user_id, username, full_name, profile_pic_url FROM users WHERE user_id IN (${placeholders})`, userIds);
    console.log('Users matching those ids:\n', JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error checking feedback users:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

check();
