const { pool } = require('../src/models/user');

async function run() {
  console.log('Starting migration: add payload to notifications if missing');
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query("SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'payload'");
      const cnt = rows && rows[0] && (rows[0].cnt || rows[0].CNT || rows[0].Cnt) ? Number(rows[0].cnt) : (rows[0] && Object.values(rows[0])[0]) || 0;
      if (cnt > 0) {
        console.log('Column payload already exists; nothing to do.');
        conn.release();
        process.exit(0);
      }

      // Try to add JSON column first
      try {
        await conn.query('ALTER TABLE notifications ADD COLUMN payload JSON NULL');
        console.log('Added JSON payload column to notifications');
      } catch (e) {
        console.warn('Adding JSON column failed (attempting TEXT):', e && e.message ? e.message : e);
        try {
          await conn.query('ALTER TABLE notifications ADD COLUMN payload TEXT NULL');
          console.log('Added TEXT payload column to notifications');
        } catch (e2) {
          console.error('Failed to add payload column (JSON and TEXT attempts failed):', e2 && e2.message ? e2.message : e2);
          conn.release();
          process.exit(1);
        }
      }

      // Verify
      const [verify] = await conn.query("SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'payload'");
      const vcnt = verify && verify[0] && (verify[0].cnt || Object.values(verify[0])[0]) ? Number(verify[0].cnt) : 0;
      console.log('Post-migration payload column count:', vcnt);
      conn.release();
      process.exit(vcnt > 0 ? 0 : 2);
    } catch (e) {
      console.error('Migration query failed:', e && e.message ? e.message : e);
      try { conn.release(); } catch(_){}
      process.exit(1);
    }
  } catch (e) {
    console.error('Failed to get DB connection for migration:', e && e.message ? e.message : e);
    process.exit(1);
  }
}

run();
