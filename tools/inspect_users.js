const { pool } = require('../src/models/user');

async function run() {
  const conn = await pool.getConnection();
  try {
    const [u2] = await conn.query('SELECT * FROM users WHERE user_id = ?', [2]);
    const [uByStudentNo] = await conn.query('SELECT * FROM users WHERE student_id_no = ?', ['S_TEMP_1758174680530']);
    console.log('user_id=2 =>', JSON.stringify(u2 && u2[0] ? u2[0] : u2, null, 2));
    console.log('student_id_no=S_TEMP_1758174680530 =>', JSON.stringify(uByStudentNo && uByStudentNo[0] ? uByStudentNo[0] : uByStudentNo, null, 2));
  } catch (e) {
    console.error('Error', e);
    process.exitCode = 1;
  } finally {
    conn.release();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
