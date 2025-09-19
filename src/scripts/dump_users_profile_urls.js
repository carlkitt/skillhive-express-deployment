const { query, pool } = require('../utils/mysqlQuery');

async function run() {
  try {
    const rows = await query(pool, 'SELECT user_id, username, profile_pic_url FROM users WHERE profile_pic_url IS NOT NULL LIMIT 20');
    console.log('rows:', rows);
  } catch (err) {
    console.error('err', err);
  } finally {
    pool.end();
  }
}

run();
