const express = require('express');
const axios = require('axios');
const router = express.Router();
const { users } = require('./auth');

// Pricing plans (prices in cents for USD)
const PLANS = {
  basic: {
    name: 'Basic',
    price: 500, // $5.00 in cents
    searches: 50,
    features: ['50 searches/month', 'Standard video playback'],
    resetPeriod: 30 // days
  },
  pro: {
    name: 'Pro',
    price: 1500, // $15.00 in cents
    searches: 200,
    features: ['200 searches/month', 'Downloadable videos', 'Priority support'],
    resetPeriod: 30 // days
  },
  unlimited: {
    name: 'Unlimited',
    price: 3000, // $30.00 in cents
    searches: -1, // unlimited
    features: ['Unlimited searches', 'Downloadable videos', 'Priority support', 'API access'],
    resetPeriod: 30 // days
  }
};

// Get pricing plans
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

// Initialize payment
router.post('/initialize', async (req, res) => {
  try {
    const { email, plan } = req.body;
    
    if (!email || !plan || !PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: PLANS[plan].price,
        currency: 'USD',
        metadata: {
          plan,
          custom_fields: [
            {
              display_name: 'Plan',
              variable_name: 'plan',
              value: PLANS[plan].name
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Payment initialization error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// Verify payment
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const { data } = response.data;

    if (data.status === 'success') {
      const plan = data.metadata.plan;
      const email = data.customer.email;
      
      // Update user plan
      const user = users.get(email);
      if (user) {
        user.plan = plan;
        user.searchLimit = PLANS[plan].searches;
        user.searchesUsed = 0;
        user.lastResetDate = new Date();
        user.nextResetDate = new Date(Date.now() + PLANS[plan].resetPeriod * 24 * 60 * 60 * 1000);
        users.set(email, user);
      }

      res.json({
        success: true,
        plan,
        message: 'Payment verified successfully'
      });
    } else {
      res.status(400).json({ error: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

module.exports = router;
