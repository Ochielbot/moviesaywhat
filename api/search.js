const DialogueSearcher = require('../src/DialogueSearcher');
const jwt = require('jsonwebtoken');
const { users } = require('./auth');
const { checkAndResetSearches } = require('./user');

const searcher = new DialogueSearcher();

module.exports = async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { query } = req.query;
    const token = req.headers.authorization?.split(' ')[1];
    
    console.log('Search request received:', query);
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Check authentication
    if (!token) {
      return res.status(401).json({ error: 'Authentication required', requiresAuth: true });
    }

    let user;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      user = Array.from(users.values()).find(u => u.id === decoded.userId);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found', requiresAuth: true });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token', requiresAuth: true });
    }

    // Check and reset searches if needed
    user = checkAndResetSearches(user);

    // Check search limit
    if (user.searchLimit !== -1 && user.searchesUsed >= user.searchLimit) {
      return res.status(403).json({ 
        error: 'Search limit reached', 
        upgrade: true,
        searchesUsed: user.searchesUsed,
        searchLimit: user.searchLimit,
        nextResetDate: user.nextResetDate
      });
    }

    console.log('Starting search for:', query);
    const results = await searcher.search(query);
    console.log('Search completed, found', results.length, 'results');
    
    // Increment search count
    user.searchesUsed += 1;
    users.set(user.email, user);

    // Add download capability for pro and unlimited plans
    const canDownload = user.plan === 'pro' || user.plan === 'unlimited';
    
    res.json({ 
      results,
      canDownload,
      searchesUsed: user.searchesUsed,
      searchLimit: user.searchLimit,
      nextResetDate: user.nextResetDate
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
};