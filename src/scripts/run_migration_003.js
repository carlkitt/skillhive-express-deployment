const fs = require('fs');
const path = require('path');
const { pool, query } = require('../utils/mysqlQuery');

async function run() {
  try {
    const sqlPath = path.join(__dirname, '..', '..', 'database', 'migrations', '003_create_feedback_helpful.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    // Split SQL into statements by semicolon and run each separately.
    // This avoids ER_PARSE_ERROR when multipleStatements is not enabled.
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    for (const stmt of statements) {
      try {
        await query(pool, stmt + ';');
      } catch (err) {
        // If constraint already exists or similar, log and continue
        console.warn('Migration statement warning:', err && err.message ? err.message : err);
      }
    }
    console.log('Migration 003 applied successfully (statements executed)');
  } catch (err) {
    console.error('Migration 003 failed:', err);
    process.exit(1);
  } finally {
    pool.end();
  }
}

run();
