const { pool, query } = require('../utils/mysqlQuery');
(async function(){
  try {
    const rows = await query(pool, 'SELECT user_id, student_id_no, full_name FROM users WHERE user_id = ? LIMIT 1', [2]);
    console.log('User row for user_id=2:', rows && rows.length ? rows[0] : null);
    process.exit(0);
  } catch (e) {
    console.error('Failed to query users table', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
