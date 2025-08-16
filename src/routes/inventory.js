const express = require('express');
const router = express.Router();
const { createPool } = require('../utils/mysqlQuery');

const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'bjhvgr90ewlwfy7hvrrp-mysql.services.clever-cloud.com',
  user: 'umhwrkzsbn2bdp7p',
  password: '0EjHTPEKuIGD9jXtEPbK',
  database: 'bjhvgr90ewlwfy7hvrrp',
});

// Set on_use for a category (border or badge): set all to 0, then one to 1
router.post('/set_on_use', async (req, res) => {
  const { user_id, inventory_id, category } = req.body;
  if (!user_id || !inventory_id || !category) {
    return res.status(400).json({ error: 'user_id, inventory_id, and category are required' });
  }
  try {
    // Set all items in this category for the user to on_use = 0, except the selected one
    await pool.query(
      'UPDATE user_inventory SET on_use = "0" WHERE user_id = ? AND category = ? AND inventory_id != ?',
      [user_id, category, inventory_id]
    );
    // Set the selected item to on_use = 1
    await pool.query(
      'UPDATE user_inventory SET on_use = "1" WHERE inventory_id = ?',
      [inventory_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add item to user inventory after purchase
router.post('/add', async (req, res) => {
  const { user_id, item_id } = req.body;
  if (!user_id || !item_id) {
    return res.status(400).json({ error: 'user_id and item_id are required' });
  }
  try {
    // Get the category from shop_items
    const [rows] = await pool.query('SELECT type FROM shop_items WHERE item_id = ?', [item_id]);
    if (!rows.length) {
      return res.status(400).json({ error: 'Invalid item_id' });
    }
    const category = rows[0].type;
    const result = await pool.query(
      'INSERT INTO user_inventory (user_id, item_id, owned_at, is_active, category) VALUES (?, ?, NOW(), 1, ?)',
      [user_id, item_id, category]
    );
    res.json({ success: true, inventory_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all items in user inventory
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT ui.*, si.name, si.type, si.description, si.image_url, si.cost, si.level_required
       FROM user_inventory ui
       JOIN shop_items si ON ui.item_id = si.item_id
       WHERE ui.user_id = ?`,
      [user_id]
    );
    // Categorize items
    const borders = [];
    const badges = [];
    const vouchers = [];
    for (const item of rows) {
        // Ensure on_use is always an integer for frontend comparison
      if (item.on_use !== undefined) item.on_use = Number(item.on_use);
      if (item.type === 'border') borders.push(item);
      else if (item.type === 'badge') badges.push(item);
      else if (item.type === 'voucher') vouchers.push(item);
    }
    res.json({ borders, badges, vouchers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
