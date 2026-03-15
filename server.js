const express = require('express');
const cors = require('cors');
const path = require('path');
const DialogueSearcher = require('./src/DialogueSearcher');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const searcher = new DialogueSearcher();

app.get('/api/search', async (req, res) => {
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
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});