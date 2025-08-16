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

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'skillhivedb',

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
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ? AND PASSWORD = ?',
    [username, password]
  );
  if (rows.length > 0) {
    const user = rows[0];
    return {
      token: generateToken(user.user_id), // Generate JWT token
      user_id: user.user_id,
      is_verified: user.is_verified || 0, // Include is_verified in the response
    };
  }
  
  return null;
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
  // Use your DB connection to fetch all users
  const [rows] = await pool.query('SELECT * FROM users');
  return rows;
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
