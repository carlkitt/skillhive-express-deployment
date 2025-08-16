const express = require('express');
const router = express.Router();
const users = require('../models/user');

// GET /api/user - return all users
router.get('/', async (req, res) => {
  try {
    const allUsers = await users.getAllUsers();
    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/:id - return single user
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await users.getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Normalize common profile fields so frontend can rely on consistent keys
    const normalized = Object.assign({}, user);
    normalized.id = user.user_id ?? user.id ?? '';
    normalized.profile_pic_url = (user.profile_pic_url || user.profile_pic || user.profile_picture || '').toString();
    // If your DB has a different column for border/badge adjust mappings here
    normalized.profile_border_url = (user.profile_border_url || user.profile_border || '').toString();
    // Map current_badge or badge_url to badge_url
    normalized.badge_url = (user.badge_url || user.current_badge || user.badge || '').toString();

    // Return consistent object wrapper
    res.json({ user: normalized });
  } catch (err) {
    console.error('Error fetching user by id:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/user/:user_id/stats
router.get('/:user_id/stats', async (req, res) => {
  const { user_id } = req.params;
  try {
    const stats = await users.getUserStatsById(user_id);
    if (!stats) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(stats);
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
