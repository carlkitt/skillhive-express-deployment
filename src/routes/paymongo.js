const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/create-payment-link', async (req, res) => {
  const { amount, description, remarks } = req.body;
  const secretKey = process.env.PAYMONGO_SECRET_KEY; // Store in .env

  try {
    const response = await axios.post(
      'https://api.paymongo.com/v1/links',
      {
        data: {
          attributes: {
            amount: amount * 100, // centavos
            description: description || 'Tutor Payment',
            remarks: remarks || 'Payment for session',
            currency: 'PHP',
          },
        },
      },
      {
        headers: {
          Authorization: 'Basic ' + Buffer.from(secretKey + ':').toString('base64'),
          'Content-Type': 'application/json',
        },
      }
    );
    res.json({ checkout_url: response.data.data.attributes.checkout_url });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

module.exports = router;
