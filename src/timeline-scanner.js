import { client } from './twitter-client.js';
import { dbQueries } from './database.js';

class TimelineScanner {
  constructor() {
    this.seenTweets = new Set();
  }

  async scanTimeline() {
    console.log('[TimelineScanner] Scanning home timeline for new projects...');
    
    try {
      // Get home timeline (accounts the bot follows)
      const timeline = await client.v2.homeTimeline({
        max_results: 50,
        'tweet.fields': ['created_at', 'author_id'],
        expansions: ['author_id']
      });
      
      if (!timeline?.data || !Array.isArray(timeline.data) || timeline.data.length === 0) {
        console.log('[TimelineScanner] No new tweets');
        return 0;
      }

      let newProjects = 0;
      
      for (const tweet of timeline.data) {
        if (!tweet) continue;
        // Skip if already processed
        if (this.seenTweets.has(tweet.id)) continue;
        this.seenTweets.add(tweet.id);
        
        // Extract potential project symbols
        const symbols = this.extractSymbols(tweet.text);
        
        for (const symbol of symbols) {
          // Check if already in database
          const exists = await this.checkExists(symbol);
          if (exists) continue;
          
          // Try to get info from DexScreener
          const projectInfo = await this.getProjectInfo(symbol);
          
          if (projectInfo && projectInfo.mcap >= 300000) {
            dbQueries.addProject.run(
              projectInfo.name,
              projectInfo.symbol,
              projectInfo.mcap,
              projectInfo.twitter,
              null,
              'timeline_scan',
              projectInfo.volume || 0
            );
            newProjects++;
            console.log(`[TimelineScanner] ✅ Added ${symbol} from timeline`);
          }
        }
      }
      
      console.log(`[TimelineScanner] Found ${newProjects} new projects`);
      return newProjects;
      
    } catch (error) {
      console.error('[TimelineScanner] Error:', error.message);
      return 0;
    }
  }

  extractSymbols(text) {
    if (!text) return [];
    
    // Find $SYMBOL patterns
    const matches = text.match(/\$[A-Za-z0-9]+/g);
    if (!matches) return [];
    
    // Clean up and deduplicate
    return [...new Set(matches.map(s => s.replace('$', '').toUpperCase()))]
      .filter(s => s.length >= 2 && s.length <= 10) // Reasonable token symbol length
      .filter(s => !['USD', 'BTC', 'ETH', 'SOL', 'USDT', 'USDC'].includes(s)); // Skip major stables/coins
  }

  async checkExists(symbol) {
    const { default: db } = await import('./database.js');
    return db.projects.some(p => p.symbol === symbol);
  }

  async getProjectInfo(symbol) {
    try {
      const fetch = (await import('node-fetch')).default;
      
      // Search DexScreener
      const resp = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${symbol}`);
      const data = await resp.json();
      
      if (!data.pairs || data.pairs.length === 0) return null;
      
      // Find best pair (highest liquidity)
      const pair = data.pairs
        .filter(p => p.baseToken.symbol.toUpperCase() === symbol)
        .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
      
      if (!pair) return null;
      
      // Extract Twitter
      let twitter = null;
      if (pair.info?.socials) {
        const tw = pair.info.socials.find(s => s.type === 'twitter');
        if (tw) {
          twitter = tw.url.split('/').pop().replace('@', '');
        }
      }
      
      return {
        name: pair.baseToken.name,
        symbol: pair.baseToken.symbol,
        mcap: pair.fdv || 0,
        twitter: twitter,
        volume: pair.volume?.h24 || 0
      };
      
    } catch (e) {
      return null;
    }
  }
}

export default TimelineScanner;
