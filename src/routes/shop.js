const express = require('express');
const router = express.Router();
const shop = require('../models/shop');

// GET /api/shop/borders
router.get('/borders', async (req, res) => {
  try {
    const borders = await shop.getProfileBorders();
    res.json(borders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile borders.' });
  }
});

// GET /api/shop/badges
router.get('/badges', async (req, res) => {
  try {
    const badges = await shop.getBadges();
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch badges.' });
  }
});

// GET /api/shop/vouchers
router.get('/vouchers', async (req, res) => {
  try {
    const vouchers = await shop.getVouchers();
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vouchers.' });
  }
});

module.exports = router;
