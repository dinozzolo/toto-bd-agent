import axios from 'axios';
import db, { save } from './database.js';
import { client } from './twitter-client.js';

/**
 * TickerResolver - Looks up tickers from @whalewatchalert and finds project details
 */
export async function resolveTicker(ticker) {
  console.log(`[TickerResolver] 🔍 Resolving $${ticker}...`);
  
  let project = {
    symbol: ticker.toUpperCase(),
    name: null,
    twitter_username: null,
    mcap: 0,
    sources_checked: []
  };

  // 1. Try CoinGecko first (most reliable)
  try {
    const cgData = await searchCoinGecko(ticker);
    if (cgData && cgData.symbol.toUpperCase() === ticker.toUpperCase()) {
      project.name = cgData.name;
      project.mcap = cgData.market_cap?.usd || 0;
      project.twitter_username = cgData.links?.twitter_screen_name;
      project.sources_checked.push('coingecko');
      
      if (project.twitter_username) {
        console.log(`[TickerResolver] ✅ Found $${ticker} on CoinGecko: @${project.twitter_username}`);
        return project;
      }
    }
  } catch (e) {
    console.log(`[TickerResolver] ⚠️ CoinGecko lookup failed: ${e.message}`);
  }

  // 2. Try CoinMarketCap
  try {
    const cmcData = await searchCoinMarketCap(ticker);
    if (cmcData) {
      project.name = cmcData.name;
      project.twitter_username = cmcData.twitter;
      project.sources_checked.push('coinmarketcap');
      
      if (project.twitter_username) {
        console.log(`[TickerResolver] ✅ Found $${ticker} on CMC: @${project.twitter_username}`);
        return project;
      }
    }
  } catch (e) {
    console.log(`[TickerResolver] ⚠️ CMC lookup failed: ${e.message}`);
  }

  // 3. Try DexScreener for Solana tokens
  try {
    const dexData = await searchDexScreener(ticker);
    if (dexData && dexData.twitter) {
      project.name = dexData.name;
      project.twitter_username = dexData.twitter.replace('@', '');
      project.mcap = dexData.marketCap || 0;
      project.sources_checked.push('dexscreener');
      
      console.log(`[TickerResolver] ✅ Found $${ticker} on DexScreener: @${project.twitter_username}`);
      return project;
    }
  } catch (e) {
    console.log(`[TickerResolver] ⚠️ DexScreener lookup failed: ${e.message}`);
  }

  // 4. Twitter search as fallback
  if (!project.twitter_username) {
    try {
      const twitterHandle = await searchTwitterForProject(ticker);
      if (twitterHandle) {
        project.twitter_username = twitterHandle;
        project.sources_checked.push('twitter_search');
        console.log(`[TickerResolver] ✅ Found $${ticker} on Twitter: @${twitterHandle}`);
        return project;
      }
    } catch (e) {
      console.log(`[TickerResolver] ⚠️ Twitter search failed: ${e.message}`);
    }
  }

  if (!project.twitter_username) {
    console.log(`[TickerResolver] ❌ Could not find Twitter for $${ticker}`);
    return null;
  }

  return project;
}

async function searchCoinGecko(symbol) {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/search?query=${symbol}`,
      { timeout: 10000 }
    );
    
    const coin = response.data.coins.find(c => 
      c.symbol.toUpperCase() === symbol.toUpperCase()
    );
    
    if (coin) {
      const detailResponse = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false`,
        { timeout: 10000 }
      );
      
      return detailResponse.data;
    }
    
    return null;
  } catch (error) {
    console.error('[TickerResolver] CoinGecko error:', error.message);
    return null;
  }
}

async function searchCoinMarketCap(symbol) {
  try {
    // Search via public API
    const response = await axios.get(
      `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=1&limit=100&sort_dir=desc&sort=market_cap`,
      { 
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    const coin = response.data?.data?.cryptoCurrencyList?.find(c => 
      c.symbol.toUpperCase() === symbol.toUpperCase()
    );
    
    if (coin) {
      // Try to fetch more details
      const detailResponse = await axios.get(
        `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/detail?slug=${coin.slug}`,
        { timeout: 10000 }
      );
      
      const detail = detailResponse.data?.data?.[coin.id];
      if (detail) {
        return {
          name: coin.name,
          symbol: coin.symbol,
          twitter: detail.urls?.twitter?.[0]?.replace('https://twitter.com/', '').replace('@', '')
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('[TickerResolver] CMC error:', error.message);
    return null;
  }
}

async function searchDexScreener(symbol) {
  try {
    // Search on DexScreener
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/search/?q=${symbol}`,
      { timeout: 10000 }
    );
    
    // Find best match (highest liquidity)
    const pairs = response.data?.pairs || [];
    const matchingPairs = pairs.filter(p => 
      p.baseToken?.symbol?.toUpperCase() === symbol.toUpperCase() ||
      p.quoteToken?.symbol?.toUpperCase() === symbol.toUpperCase()
    );
    
    if (matchingPairs.length > 0) {
      // Get the one with highest liquidity
      const bestPair = matchingPairs.sort((a, b) => 
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      )[0];
      
      // Fetch profile for Twitter
      const profileResponse = await axios.get(
        `https://api.dexscreener.com/token-profiles/latest/v1`,
        { timeout: 10000 }
      );
      
      // Check if profile exists for this token address
      const tokenAddress = bestPair.baseToken?.symbol?.toUpperCase() === symbol.toUpperCase() 
        ? bestPair.baseToken.address 
        : bestPair.quoteToken.address;
      
      const profile = profileResponse.data?.find(p => 
        p.tokenAddress?.toLowerCase() === tokenAddress.toLowerCase()
      );
      
      return {
        name: bestPair.baseToken?.symbol?.toUpperCase() === symbol.toUpperCase()
          ? bestPair.baseToken.name
          : bestPair.quoteToken.name,
        symbol: symbol,
        twitter: profile?.twitter || bestPair.info?.socials?.twitter,
        marketCap: bestPair.marketCap || 0
      };
    }
    
    return null;
  } catch (error) {
    console.error('[TickerResolver] DexScreener error:', error.message);
    return null;
  }
}

async function searchTwitterForProject(symbol) {
  try {
    // Search for the project on Twitter
    const searchQuery = `$${symbol} token crypto project`;
    const searchResult = await client.v2.search(searchQuery, {
      max_results: 10,
      'tweet.fields': ['author_id'],
      expansions: ['author_id'],
      'user.fields': ['public_metrics', 'description']
    });
    
    for (const tweet of searchResult.data?.data || []) {
      // Get the user who posted
      const author = searchResult.data?.includes?.users?.find(u => u.id === tweet.author_id);
      if (author && author.public_metrics?.followers_count > 1000) {
        // Verify it's actually about this token
        if (tweet.text.toLowerCase().includes(symbol.toLowerCase())) {
          return author.username;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('[TickerResolver] Twitter search error:', error.message);
    return null;
  }
}

export default resolveTicker;
