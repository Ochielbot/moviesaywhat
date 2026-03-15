const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { users } = require('./auth');

// Helper function to check and reset searches if needed
function checkAndResetSearches(user) {
  const now = new Date();
  if (user.nextResetDate && now >= new Date(user.nextResetDate)) {
    user.searchesUsed = 0;
    user.lastResetDate = now;
    user.nextResetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    users.set(user.email, user);
  }
  return user;
}

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  let user = Array.from(users.values()).find(u => u.id === req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check and reset searches if needed
  user = checkAndResetSearches(user);

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    searchesUsed: user.searchesUsed,
    searchLimit: user.searchLimit,
    nextResetDate: user.nextResetDate
  });
});

// Increment search count
router.post('/increment-search', authenticateToken, (req, res) => {
  let user = Array.from(users.values()).find(u => u.id === req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check and reset searches if needed
  user = checkAndResetSearches(user);

  // Check if user has reached limit
  if (user.searchLimit !== -1 && user.searchesUsed >= user.searchLimit) {
    return res.status(403).json({ error: 'Search limit reached', upgrade: true });
  }

  user.searchesUsed += 1;
  users.set(user.email, user);

  res.json({
    searchesUsed: user.searchesUsed,
    searchLimit: user.searchLimit,
    nextResetDate: user.nextResetDate
  });
});

module.exports = router;
module.exports.checkAndResetSearches = checkAndResetSearches;
