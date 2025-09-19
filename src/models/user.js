// Deduct points from user in gamification table
async function deductPoints(userId, cost) {
  const [result] = await pool.query(
    'UPDATE gamification SET points = points - ? WHERE user_id = ? AND points >= ?',
    [cost, userId, cost]
  );
  return result;
}
// Use MySQL database for users
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
   host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'skillhivedb',

});

async function getUsers() {
  const [rows] = await pool.query('SELECT * FROM users');
  return rows;
}

function generateToken(userId) {
  const secretKey = process.env.JWT_SECRET || 'your_secret_key'; // Use a secure key
  const token = jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
  return token;
}

async function findUserByCredentials(username, password) {
  // Fetch user by username only, then compare provided password with stored hash
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  if (rows.length === 0) return null;

  const user = rows[0];
  // DB column for password is `PASSWORD` in the schema
  const storedHash = user.PASSWORD || user.password || '';

  try {
    // First try bcrypt.compare (normal, secure flow)
    const match = await bcrypt.compare(password, storedHash);
    if (!match) {
      // Dev fallback: some DB dumps contain plain-text passwords instead of bcrypt hashes.
      // If the stored value doesn't look like a bcrypt hash, allow a direct equality check
      // so local testing with the SQL dump works. This is ONLY for development convenience.
      const looksHashed = typeof storedHash === 'string' && storedHash.startsWith('$2');
      if (!looksHashed && storedHash === password) {
        console.warn('[dev] plain-text password match for user', username);
        // allow login for dev/test
      } else {
        return null;
      }
    }

    // Return the user object expected by the auth route
    return {
      user_id: user.user_id,
      username: user.username,
      is_verified: user.is_verified || 0,
    };
  } catch (err) {
    console.error('Error comparing password hash:', err);
    return null;
  }
}

// Fetch user stats (xp, points, level) by user_id from gamification table
async function getUserStatsById(userId) {
  try {
    const [rows] = await pool.query(
      `SELECT g.xp AS exp, g.points, g.level, u.full_name, u.profile_pic_url
       FROM gamification g
       JOIN users u ON g.user_id = u.user_id
       WHERE g.user_id = ?`,
      [userId]
    );
    
    return rows[0]; // returns stats object if found, else undefined
  } catch (err) {
    console.error('SQL error in getUserStatsById:', err);
    throw err;
  }
}

async function getAllUsers() {
  // Fetch users but avoid relying on message table schema (is_read may not exist).
  // Return safe defaults for unread / last_message so the API doesn't fail.
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    return rows.map(r => Object.assign({}, r, {
      unread: 0,
      last_message: null,
      last_message_time: null,
    }));
  } catch (err) {
    console.error('SQL error in getAllUsers:', err);
    throw err;
  }
}

async function getUserById(userId) {
  const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
  return rows && rows.length > 0 ? rows[0] : null;
}

module.exports = {
  getAllUsers,
  getUsers,
  findUserByCredentials,
  getUserStatsById,
  deductPoints,
  pool,
  getUserById,
};
