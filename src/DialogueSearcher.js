const axios = require('axios');

class DialogueSearcher {
  constructor() {
    // We'll use a simple approach that actually works
  }

  async search(query) {
    console.log('DialogueSearcher.search called with:', query);
    try {
      // Search YouTube for videos containing the dialogue
      console.log('Starting YouTube search...');
      const searchResults = await this.searchYouTube(query);
      console.log('YouTube search returned', searchResults.length, 'videos');
      
      // For each video, try to find the exact timestamp
      const results = [];
      
      for (const video of searchResults.slice(0, 8)) { // Process more videos
        try {
          console.log('Processing video:', video.title);
          const clippedResults = await this.findDialogueTimestamp(video, query);
          results.push(...clippedResults);
        } catch (error) {
          console.log(`Failed to process video ${video.id}:`, error.message);
        }
      }
      
      console.log('Final results:', results.length);
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  async searchYouTube(query) {
    console.log('Searching YouTube for:', query);
    
    // Search for movie/TV clips containing the dialogue
    const searchQueries = [
      `"${query}" movie scene`,
      `"${query}" TV show clip`,
      `"${query}" movie quote`,
      `${query} scene`
    ];

    const allResults = [];
    
    for (const searchQuery of searchQueries) {
      try {
        console.log('Trying search query:', searchQuery);
        const results = await this.scrapeYouTubeSearch(searchQuery);
        console.log('Got', results.length, 'results for query:', searchQuery);
        allResults.push(...results);
        
        // If we got some results, don't need to try all queries
        if (allResults.length >= 5) break;
      } catch (error) {
        console.log(`Search query failed: ${searchQuery}`, error.message);
      }
    }

    // Remove duplicates and return
    const uniqueResults = allResults.filter((video, index, self) => 
      index === self.findIndex(v => v.id === video.id)
    );
    
    console.log('Unique results:', uniqueResults.length);
    return uniqueResults.slice(0, 10); // Limit to 10 results
  }

  async scrapeYouTubeSearch(query) {
    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      console.log('Fetching:', searchUrl);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
      });

      console.log('Got response, parsing...');
      
      // Look for video data in the page
      const videoRegex = /"videoId":"([^"]+)".*?"title":{"runs":\[{"text":"([^"]+)"/g;
      const results = [];
      let match;
      
      while ((match = videoRegex.exec(response.data)) !== null && results.length < 10) {
        const videoId = match[1];
        const title = match[2];
        
        results.push({
          id: videoId,
          title: title,
          url: `https://www.youtube.com/watch?v=${videoId}`
        });
      }

      console.log('Parsed', results.length, 'videos from page');
      return results;
    } catch (error) {
      console.log('YouTube scraping failed:', error.message);
      return [];
    }
  }

  async findDialogueTimestamp(video, query) {
    try {
      console.log(`Finding timestamp for "${query}" in video: ${video.id}`);
      
      // Try to get captions for this video
      const captions = await this.getVideoCaptions(video.id);
      
      if (captions && captions.length > 0) {
        console.log(`Found ${captions.length} caption entries`);
        
        // Search for the dialogue in captions
        const queryLower = query.toLowerCase();
        const matches = [];
        
        for (const caption of captions) {
          const textLower = caption.text.toLowerCase();
          
          // Check if this caption contains our dialogue
          if (this.textContainsDialogue(textLower, queryLower)) {
            const startTime = Math.max(0, caption.start - 2); // Start 2 seconds before
            
            matches.push({
              title: video.title,
              url: video.url,
              dialogue: caption.text,
              timestamp: this.formatTime(caption.start),
              youtubeLink: `${video.url}&t=${Math.floor(startTime)}s`,
              embedUrl: `https://www.youtube.com/embed/${video.id}?start=${Math.floor(startTime)}&autoplay=1`,
              confidence: this.calculateConfidence(query, caption.text),
              source: "Captions",
              startTime: startTime
            });
          }
        }
        
        if (matches.length > 0) {
          console.log(`Found ${matches.length} timestamp matches`);
          return matches.slice(0, 3); // Return top 3 matches per video
        }
      }
      
      // Fallback: return video without timestamp
      console.log('No captions found, returning video without timestamp');
      return [{
        title: video.title,
        url: video.url,
        dialogue: query,
        timestamp: "Unknown",
        youtubeLink: video.url,
        embedUrl: `https://www.youtube.com/embed/${video.id}`,
        confidence: 60,
        source: "YouTube Search",
        startTime: 0
      }];
      
    } catch (error) {
      console.log(`Error finding timestamp: ${error.message}`);
      return [];
    }
  }

  async getVideoCaptions(videoId) {
    try {
      // Try to get captions using youtube-transcript or similar approach
      // For now, we'll use a simple approach to get auto-generated captions
      
      const captionUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`;
      
      try {
        const response = await axios.get(captionUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          },
          timeout: 5000
        });
        
        // Parse the XML captions
        return this.parseCaptionXML(response.data);
      } catch (error) {
        console.log(`Direct caption fetch failed for ${videoId}, trying alternative method`);
        
        // Alternative: try to get captions from video page
        return await this.getCaptionsFromVideoPage(videoId);
      }
      
    } catch (error) {
      console.log(`Failed to get captions for ${videoId}: ${error.message}`);
      return [];
    }
  }

  async getCaptionsFromVideoPage(videoId) {
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const response = await axios.get(videoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      // Look for caption tracks in the page
      const captionRegex = /"captionTracks":\[([^\]]+)\]/;
      const match = response.data.match(captionRegex);
      
      if (match) {
        try {
          const captionData = JSON.parse(`[${match[1]}]`);
          
          // Find English captions
          const englishTrack = captionData.find(track => 
            track.languageCode === 'en' || track.languageCode === 'en-US'
          );
          
          if (englishTrack && englishTrack.baseUrl) {
            console.log('Found caption track, fetching...');
            const captionResponse = await axios.get(englishTrack.baseUrl, {
              timeout: 5000
            });
            
            return this.parseCaptionXML(captionResponse.data);
          }
        } catch (parseError) {
          console.log('Failed to parse caption data:', parseError.message);
        }
      }
      
      return [];
    } catch (error) {
      console.log(`Failed to get captions from video page: ${error.message}`);
      return [];
    }
  }

  parseCaptionXML(xmlData) {
    try {
      const captions = [];
      
      // Simple regex to parse caption XML
      const textRegex = /<text start="([^"]+)"[^>]*>([^<]+)</g;
      let match;
      
      while ((match = textRegex.exec(xmlData)) !== null) {
        const start = parseFloat(match[1]);
        const text = match[2]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
        
        if (text && text.length > 0) {
          captions.push({
            start: start,
            text: text
          });
        }
      }
      
      console.log(`Parsed ${captions.length} captions`);
      return captions;
    } catch (error) {
      console.log('Failed to parse caption XML:', error.message);
      return [];
    }
  }

  textContainsDialogue(text, query) {
    // Remove punctuation and extra spaces for better matching
    const cleanText = text.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanQuery = query.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Check for exact match
    if (cleanText.includes(cleanQuery)) {
      return true;
    }
    
    // Check for word-by-word match (allowing for some missing words)
    const queryWords = cleanQuery.split(' ');
    const textWords = cleanText.split(' ');
    
    let matchedWords = 0;
    for (const queryWord of queryWords) {
      if (textWords.some(textWord => textWord.includes(queryWord) || queryWord.includes(textWord))) {
        matchedWords++;
      }
    }
    
    // Consider it a match if at least 70% of words match
    return (matchedWords / queryWords.length) >= 0.7;
  }

  calculateConfidence(query, text) {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    if (textLower === queryLower) return 100;
    if (textLower.includes(queryLower)) return 90;
    
    // Word matching
    const queryWords = queryLower.split(' ');
    const textWords = textLower.split(' ');
    const matches = queryWords.filter(word => 
      textWords.some(textWord => textWord.includes(word) || word.includes(textWord))
    );
    
    return Math.round((matches.length / queryWords.length) * 85);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

module.exports = DialogueSearcher;