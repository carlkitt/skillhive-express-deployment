// Shop model: fetch shop items from MySQL
const mysql = require('mysql2/promise');
const pool = require('./user').pool; // reuse the pool from user.js

// Get all shop items, optionally filtered by type
async function getShopItems(type = null) {
  let query = 'SELECT * FROM shop_items';
  let params = [];
  if (type) {
    query += ' WHERE type = ?';
    params.push(type);
  }
  const [rows] = await pool.query(query, params);
  return rows;
}

// Convenience functions
async function getProfileBorders() {
  return getShopItems('border');
}

async function getBadges() {
  return getShopItems('badge');
}

async function getVouchers() {
  return getShopItems('voucher');
}

module.exports = {
  getShopItems,
  getProfileBorders,
  getBadges,
  getVouchers,
};
