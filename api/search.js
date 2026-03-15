const DialogueSearcher = require('../src/DialogueSearcher');
const searcher = new DialogueSearcher();

module.exports = async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { query } = req.query;
    console.log('Search request received:', query);
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log('Starting search for:', query);
    const results = await searcher.search(query);
    console.log('Search completed, found', results.length, 'results');
    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
};