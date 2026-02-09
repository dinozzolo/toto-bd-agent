import axios from 'axios';
import db, { save } from './database.js';
import { client } from './twitter-client.js';

class ExchangeMonitor {
  constructor() {
    this.exchanges = [
      { name: 'Binance', cmcId: 270, twitter: 'binance', cgId: 'binance' },
      { name: 'Coinbase', cmcId: 89, twitter: 'coinbase', cgId: 'coinbase' },
      { name: 'Kraken', cmcId: 24, twitter: 'krakenfx', cgId: 'kraken' },
      { name: 'OKX', cmcId: 294, twitter: 'okx', cgId: 'okex' },
      { name: 'Bybit', cmcId: 521, twitter: 'Bybit_Official', cgId: 'bybit_spot' },
      { name: 'KuCoin', cmcId: 311, twitter: 'kucoincom', cgId: 'kucoin' },
      { name: 'Gate.io', cmcId: 302, twitter: 'gate_io', cgId: 'gate' },
      { name: 'MEXC', cmcId: 544, twitter: 'MEXC_Official', cgId: 'mexc' },
      { name: 'Bitget', cmcId: 1186, twitter: 'bitgetglobal', cgId: 'bitget' },
      { name: 'HTX', cmcId: 102, twitter: 'HTX_Global', cgId: 'huobi' },
    ];
    this.alphaAccounts = [
      { name: 'LeakMeAlpha', twitter: 'leakmealpha', type: 'alpha_leaks' },
      { name: 'WhaleWatchAlert', twitter: 'whalewatchalert', type: 'ticker_alerts' },
    ];
    this.lastCheckTimes = {};
  }

  async run() {
    console.log('[ExchangeMonitor] 🏛️ Monitoring exchange listings and alpha accounts...');
    
    let newTokens = 0;
    
    // Monitor exchanges
    for (const exchange of this.exchanges) {
      try {
        const listings = await this.checkExchangeTwitter(exchange);
        
        for (const listing of listings) {
          const added = await this.processListing(listing, exchange);
          if (added) newTokens++;
        }
        
        await this.delay(2000);
      } catch (error) {
        console.error(`[ExchangeMonitor] ❌ ${exchange.name}:`, error.message);
      }
    }
    
    // Monitor alpha leak accounts
    for (const account of this.alphaAccounts) {
      try {
        const projects = await this.checkAlphaAccount(account);
        
        for (const project of projects) {
          const added = await this.processAlphaProject(project, account);
          if (added) newTokens++;
        }
        
        await this.delay(2000);
      } catch (error) {
        console.error(`[ExchangeMonitor] ❌ ${account.name}:`, error.message);
      }
    }
    
    console.log(`[ExchangeMonitor] ✅ Found ${newTokens} new tokens`);
    return newTokens;
  }

  async checkExchangeTwitter(exchange) {
    try {
      // Get exchange's recent tweets
      const user = await client.v2.userByUsername(exchange.twitter);
      if (!user || !user.data) {
        console.log(`[ExchangeMonitor] ⚠️ Could not find Twitter user: ${exchange.twitter}`);
        return [];
      }
      const tweets = await client.v2.userTimeline(user.data.id, {
        max_results: 20,
        exclude: 'retweets,replies',
        'tweet.fields': ['created_at', 'text']
      });
      
      const listings = [];
      const listingKeywords = ['list', 'listing', 'trading', 'new', 'now available', 'deposits open'];
      
      for (const tweet of tweets.data.data || []) {
        const text = tweet.text.toLowerCase();
        
        // Check if it's a listing announcement
        const isListing = listingKeywords.some(kw => text.includes(kw));
        
        if (isListing) {
          // Extract token symbol (looking for $SYMBOL or SYMBOL/USDT patterns)
          const symbolMatch = text.match(/\$([A-Z]{2,10})|([A-Z]{2,10})\/USDT|([A-Z]{2,10})\/BTC/);
          
          if (symbolMatch) {
            const symbol = symbolMatch[1] || symbolMatch[2] || symbolMatch[3];
            listings.push({
              symbol: symbol.toUpperCase(),
              exchange: exchange.name,
              tweetText: tweet.text,
              tweetId: tweet.id,
              announcedAt: tweet.created_at
            });
          }
        }
      }
      
      return listings;
    } catch (error) {
      console.error(`[ExchangeMonitor] Twitter check failed for ${exchange.name}:`, error.message);
      return [];
    }
  }

  async processListing(listing, exchange) {
    try {
      // Check if already in database
      const exists = db.projects.find(p => 
        p.symbol === listing.symbol && 
        new Date(p.discovered_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
      
      if (exists) {
        console.log(`[ExchangeMonitor] ⏩ ${listing.symbol} already in database`);
        return false;
      }

      console.log(`[ExchangeMonitor] 🔍 Found ${listing.symbol} listed on ${exchange.name}`);
      
      // Search CoinGecko for token details
      const cgData = await this.searchCoinGecko(listing.symbol);
      
      if (cgData) {
        // Add to database
        const newProject = {
          id: db.projects.length + 1,
          name: cgData.name,
          symbol: cgData.symbol.toUpperCase(),
          mcap: cgData.market_cap?.usd || 0,
          twitter_username: await this.findTwitterHandle(cgData),
          email: null,
          source: 'exchange_listing',
          listing_exchange: exchange.name,
          listing_tweet: listing.tweetId,
          discovered_at: new Date().toISOString()
        };
        
        db.projects.push(newProject);
        save();
        
        console.log(`[ExchangeMonitor] ✅ Added ${newProject.symbol}: ${newProject.name}`);
        if (newProject.twitter_username) {
          console.log(`[ExchangeMonitor]    Twitter: @${newProject.twitter_username}`);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`[ExchangeMonitor] ❌ Failed to process ${listing.symbol}:`, error.message);
      return false;
    }
  }

  async searchCoinGecko(symbol) {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/search?query=${symbol}`,
        { timeout: 10000 }
      );
      
      const coin = response.data.coins.find(c => 
        c.symbol.toUpperCase() === symbol.toUpperCase()
      );
      
      if (coin) {
        // Get detailed data
        const detailResponse = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false`,
          { timeout: 10000 }
        );
        
        return detailResponse.data;
      }
      
      return null;
    } catch (error) {
      console.error(`[ExchangeMonitor] CoinGecko search failed:`, error.message);
      return null;
    }
  }

  async findTwitterHandle(cgData) {
    try {
      // Check CoinGecko links
      const twitterUrl = cgData.links?.twitter_screen_name;
      if (twitterUrl) {
        return twitterUrl.replace('@', '').trim();
      }
      
      // Try searching Twitter
      const searchResult = await client.v2.search(
        `${cgData.name} ${cgData.symbol} crypto`,
        { max_results: 10 }
      );
      
      for await (const tweet of searchResult) {
        // Return first verified/big account
        return tweet.author_id; // Simplified - would need user lookup
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async checkAlphaAccount(account) {
    try {
      console.log(`[ExchangeMonitor] 🔍 Checking @${account.twitter} for project leaks...`);
      
      const user = await client.v2.userByUsername(account.twitter);
      if (!user || !user.data) {
        console.log(`[ExchangeMonitor] ⚠️ Could not find Twitter user: ${account.twitter}`);
        return [];
      }
      
      const tweets = await client.v2.userTimeline(user.data.id, {
        max_results: 30,
        exclude: 'retweets',
        'tweet.fields': ['created_at', 'text']
      });
      
      const projects = [];
      
      for (const tweet of tweets.data.data || []) {
        const text = tweet.text;
        
        // Extract Twitter handles from tweet
        const handles = text.match(/@([a-zA-Z0-9_]{3,15})/g);
        
        if (handles) {
          for (const handle of handles) {
            const username = handle.replace('@', '').toLowerCase();
            
            // Skip common non-project handles
            const skipList = ['binance', 'coinbase', 'krakenfx', 'okx', 'bybit_official', 
              'kucoincom', 'gate_io', 'mexc_official', 'bitgetglobal', 'htx_global',
              'solcex_exchange', 'dinozzolo', 'arloxshot', 'alexanderbtcc'];
            
            if (!skipList.includes(username)) {
              projects.push({
                twitter_username: username,
                source_tweet: tweet.id,
                discovered_at: tweet.created_at,
                alpha_account: account.name
              });
            }
          }
        }
      }
      
      return projects;
    } catch (error) {
      console.error(`[ExchangeMonitor] Alpha check failed for ${account.name}:`, error.message);
      return [];
    }
  }

  async processAlphaProject(project, account) {
    try {
      // Check if already in database
      const exists = db.projects.find(p => 
        p.twitter_username?.toLowerCase() === project.twitter_username.toLowerCase()
      );
      
      if (exists) {
        return false;
      }

      console.log(`[ExchangeMonitor] 🔍 Found new project from @${account.twitter}: @${project.twitter_username}`);
      
      // Try to get project info from Twitter
      try {
        const userInfo = await client.v2.userByUsername(project.twitter_username, {
          'user.fields': ['description', 'public_metrics', 'created_at']
        });
        
        if (userInfo && userInfo.data) {
          const user = userInfo.data;
          
          // Try to extract symbol from bio or name
          const symbolMatch = user.description?.match(/\$([A-Z]{2,10})/) || 
                             user.name?.match(/\$([A-Z]{2,10})/);
          
          const symbol = symbolMatch ? symbolMatch[1] : project.twitter_username.toUpperCase().substring(0, 8);
          
          const newProject = {
            id: db.projects.length + 1,
            name: user.name || project.twitter_username,
            symbol: symbol,
            mcap: 0, // Will be updated by scanner
            twitter_username: project.twitter_username,
            twitter_followers: user.public_metrics?.followers_count || 0,
            email: null,
            source: 'alpha_leak',
            alpha_account: account.name,
            alpha_tweet: project.source_tweet,
            discovered_at: new Date().toISOString()
          };
          
          db.projects.push(newProject);
          save();
          
          console.log(`[ExchangeMonitor] ✅ Added ${newProject.symbol}: @${newProject.twitter_username} (${newProject.twitter_followers} followers)`);
          return true;
        }
      } catch (e) {
        console.log(`[ExchangeMonitor] ⚠️ Could not get info for @${project.twitter_username}`);
      }
      
      return false;
    } catch (error) {
      console.error(`[ExchangeMonitor] ❌ Failed to process alpha project:`, error.message);
      return false;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ExchangeMonitor;
