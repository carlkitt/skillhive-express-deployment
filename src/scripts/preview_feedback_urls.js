const { query, pool } = require('../utils/mysqlQuery');

async function run() {
  try {
    const rows = await query(pool, 'SELECT f.id, u.profile_pic_url FROM feedback f LEFT JOIN users u ON u.user_id=f.user_id LIMIT 5');
    const baseUrl = (process.env.API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    rows.forEach(r => {
      let profileUrl = r.profile_pic_url || '';
      if (profileUrl && !profileUrl.startsWith('http://') && !profileUrl.startsWith('https://')) {
        const pathPart = profileUrl.startsWith('/') ? profileUrl : `/${profileUrl}`;
        profileUrl = `${baseUrl}${pathPart}`;
      }
      console.log('feedback id', r.id, '->', profileUrl);
    });
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
