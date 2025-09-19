const { query, pool } = require('../utils/mysqlQuery');

async function test() {
  try {
    console.log('Testing DB connectivity...');
    const res = await query(pool, 'SELECT 1 AS ok');
    console.log('DB test result:', res);
    process.exit(0);
  } catch (err) {
    console.error('DB connectivity test failed:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
}

test();
