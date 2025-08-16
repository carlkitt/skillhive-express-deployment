const express = require('express');
const router = express.Router();
const users = require('../models/user');

// POST /api/user/:user_id/deduct_points
router.post('/:user_id/deduct_points', async (req, res) => {
  const { user_id } = req.params;
  const { cost } = req.body;
  if (!cost || isNaN(cost)) {
    return res.status(400).json({ error: 'Invalid cost' });
  }
  try {
    const result = await users.deductPoints(user_id, cost);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deducting points:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
