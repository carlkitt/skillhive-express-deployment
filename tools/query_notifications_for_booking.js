const { pool } = require('../src/models/user');

async function run() {
  const relatedId = 19;
  const conn = pool;
  try {
    const [cols] = await conn.query('SHOW COLUMNS FROM notifications');
    const names = (cols || []).map(c => c.Field);
    const sel = ['id','user_id','type','title','message','body','related_id','created_at'].filter(c => names.includes(c));
    if (sel.length === 0) {
      console.log('No selectable columns found on notifications table');
      process.exit(0);
    }
    const orderBy = names.includes('created_at') ? 'created_at' : 'id';
    const [rows] = await conn.query(`SELECT ${sel.join(',')} FROM notifications WHERE related_id = ? ORDER BY ${orderBy} DESC LIMIT 20`, [relatedId]);
    console.log('notifications columns:', names);
    console.log('selected columns:', sel);
    console.log('rows:', rows);
  } catch (e) {
    console.error('Query failed:', e);
  } finally {
    process.exit(0);
  }
}

run();
