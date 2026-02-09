import fetch from 'node-fetch';
import { config } from './config.js';
import { dbQueries } from './database.js';

class ProjectScanner {
  async scanDexScreener() {
    console.log('[Scanner] Scanning DexScreener...');
    try {
      let count = 0;
      
      // Get token boosts (promoted/trending tokens)
      const boosts = await fetch('https://api.dexscreener.com/token-boosts/top/v1');
      const boostsData = await boosts.json();
      
      for (const boost of boostsData.slice(0, 20) || []) {
        try {
          // Get pair info for this token
          const pairResp = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${boost.tokenAddress}`);
          const pairData = await pairResp.json();
          
          if (pairData.pairs && pairData.pairs[0]) {
            const pair = pairData.pairs[0];
            
            if (pair.fdv >= config.bd.minMcap) {
              let twitter = null;
              if (pair.info?.socials) {
                const twitterSocial = pair.info.socials.find(s => s.type === 'twitter');
                if (twitterSocial) {
                  twitter = twitterSocial.url.split('/').pop().replace('@', '');
                }
              }
              
              dbQueries.addProject.run(
                pair.baseToken.name,
                pair.baseToken.symbol,
                pair.fdv,
                twitter,
                null,
                'dexscreener',
                pair.volume?.h24 || 0
              );
              count++;
            }
          }
          
          await new Promise(r => setTimeout(r, 300)); // Rate limiting
        } catch (e) {
          console.error('[Scanner] Error processing boost:', e.message);
        }
      }
      
      // Also scan ordered pairs by liquidity
      const chainsToScan = ['solana', 'ethereum', 'bsc'];
      for (const chain of chainsToScan) {
        try {
          const pairsResp = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chain}`);
          const pairsData = await pairsResp.json();
          
          for (const pair of (pairsData.pairs || []).slice(0, 10)) {
            if (pair.fdv >= config.bd.minMcap) {
              let twitter = null;
              if (pair.info?.socials) {
                const twitterSocial = pair.info.socials.find(s => s.type === 'twitter');
                if (twitterSocial) {
                  twitter = twitterSocial.url.split('/').pop().replace('@', '');
                }
              }
              
              dbQueries.addProject.run(
                pair.baseToken.name,
                pair.baseToken.symbol,
                pair.fdv,
                twitter,
                null,
                'dexscreener_' + chain,
                pair.volume?.h24 || 0
              );
              count++;
            }
          }
          
          await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
          console.error(`[Scanner] Error scanning ${chain}:`, e.message);
        }
      }
      
      console.log(`[Scanner] Added ${count} projects from DexScreener`);
    } catch (error) {
      console.error('[Scanner] DexScreener error:', error.message);
    }
  }

  async scanCoinGecko() {
    console.log('[Scanner] Scanning CoinGecko...');
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1');
      const data = await response.json();
      
      let count = 0;
      for (const coin of data) {
        if (coin.market_cap >= config.bd.minMcap) {
          // Get detailed coin info to extract Twitter
          let twitter = null;
          try {
            const detailResponse = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}`);
            const detail = await detailResponse.json();
            
            if (detail.links?.twitter_screen_name) {
              twitter = detail.links.twitter_screen_name;
            }
            
            await new Promise(r => setTimeout(r, 1200)); // Rate limit: 50 calls/min for free tier
          } catch (e) {
            console.error(`[Scanner] Error getting details for ${coin.id}:`, e.message);
          }
          
          dbQueries.addProject.run(
            coin.name,
            coin.symbol.toUpperCase(),
            coin.market_cap,
            twitter,
            null,
            'coingecko'
          );
          count++;
        }
      }
      console.log(`[Scanner] Added ${count} projects from CoinGecko`);
    } catch (error) {
      console.error('[Scanner] CoinGecko error:', error.message);
    }
  }

  async scanCoinMarketCap() {
    console.log('[Scanner] Scanning CoinMarketCap...');
    try {
      // Free API endpoint (limited)
      const response = await fetch('https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=1&limit=100&sortBy=market_cap&sortType=desc&convert=USD');
      const data = await response.json();
      
      let count = 0;
      for (const crypto of data.data?.cryptoCurrencyList || []) {
        const mcap = crypto.quotes?.[0]?.marketCap;
        if (mcap >= config.bd.minMcap) {
          dbQueries.addProject.run(
            crypto.name,
            crypto.symbol,
            mcap,
            null,
            null,
            'coinmarketcap'
          );
          count++;
        }
      }
      console.log(`[Scanner] Added ${count} projects from CoinMarketCap`);
    } catch (error) {
      console.error('[Scanner] CoinMarketCap error:', error.message);
    }
  }

  async scanDeFiLlama() {
    console.log('[Scanner] Scanning DeFiLlama...');
    try {
      const response = await fetch('https://api.llama.fi/protocols');
      const protocols = await response.json();
      
      let count = 0;
      for (const protocol of protocols) {
        if (protocol.twitter && protocol.tvl > 1000000) {
          const twitter = protocol.twitter.replace('@', '').trim();
          
          // Check for duplicates
          const exists = db.projects.some(p => 
            p.twitter_username?.toLowerCase() === twitter.toLowerCase()
          );
          
          if (!exists && /^[a-zA-Z0-9_]+$/.test(twitter) && twitter.length >= 2 && twitter.length <= 15) {
            dbQueries.addProject.run(
              protocol.name,
              protocol.symbol || protocol.name.substring(0, 10).toUpperCase(),
              protocol.tvl,
              twitter,
              null,
              'defillama'
            );
            count++;
          }
        }
      }
      console.log(`[Scanner] Added ${count} protocols from DeFiLlama`);
    } catch (error) {
      console.error('[Scanner] DeFiLlama error:', error.message);
    }
  }

  async run() {
    console.log('[Scanner] Starting daily scan...');
    await this.scanDeFiLlama();
    await this.scanDexScreener();
    await this.scanCoinGecko();
    await this.scanCoinMarketCap();
    
    const withTwitter = db.projects.filter(p => p.twitter_username);
    console.log(`[Scanner] Scan complete. Total with Twitter: ${withTwitter.length}`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scanner = new ProjectScanner();
  scanner.run().then(() => process.exit(0));
}

export default ProjectScanner;
