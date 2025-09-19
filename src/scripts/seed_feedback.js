const { query, pool } = require('../utils/mysqlQuery');

async function seed() {
  try {
    console.log('Seeding feedback table with sample rows...');

    // Each sample now references an existing user_id in the users table
    const samples = [
      { user_id: 10, helpful_count: 3, rating: 5, comment: 'Great session — very clear explanations!', date: new Date(), is_helpful: 1, tutor_id: 1, session_id: 101 },
      { user_id: 11, helpful_count: 1, rating: 4, comment: 'Useful examples, would recommend.', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), is_helpful: 1, tutor_id: 1, session_id: 101 },
      { user_id: 12, helpful_count: 0, rating: 3, comment: 'Good, but pacing was a little fast.', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), is_helpful: 0, tutor_id: 2, session_id: 102 },
      { user_id: 13, helpful_count: 2, rating: 5, comment: 'Excellent — helped me pass my test!', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), is_helpful: 1, tutor_id: 2, session_id: 102 },
    ];

    for (const s of samples) {
      const dateStr = s.date instanceof Date ? s.date.toISOString().slice(0, 19).replace('T', ' ') : s.date;
      const res = await query(
        pool,
        `INSERT INTO feedback (user_id, helpful_count, rating, comment, date, is_helpful, tutor_id, session_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.user_id, s.helpful_count, s.rating, s.comment, dateStr, s.is_helpful, s.tutor_id, s.session_id]
      );
      // mysql package returns an object with insertId for insert operations
      console.log('Inserted feedback id:', res && res.insertId ? res.insertId : JSON.stringify(res));
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

seed();
