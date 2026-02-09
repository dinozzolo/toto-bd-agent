import fetch from 'node-fetch';
import { dbQueries } from './src/database.js';
import db from './src/database.js';

console.log('🔍 MASS SCAN - Finding all Twitter usernames from APIs\n');

let totalFound = 0;

// DexScreener - Search many tokens
async function scanDexScreener() {
  console.log('📊 Scanning DexScreener...');
  
  const searches = [
    // Popular memecoins
    'pepe', 'doge', 'shib', 'floki', 'bonk', 'wif', 'popcat', 'mew', 'bome', 'slerf',
    'brett', 'andy', 'ponke', 'wen', 'mog', 'wojak', 'chad', 'toshi', 'degen', 'higher',
    // DeFi
    'jup', 'pyth', 'jito', 'raydium', 'orca', 'marinade', 'drift', 'tensor', 'magic',
    // Infrastructure  
    'render', 'hnt', 'mobile', 'iot', 'grass', 'io', 'akash', 'theta', 'arweave',
    // Gaming/NFT
    'gala', 'imx', 'blur', 'super', 'gods', 'ilv', 'axs', 'sand', 'mana', 'ape',
    // L2/Chains
    'arb', 'op', 'matic', 'ftm', 'avax', 'near', 'atom', 'sei', 'sui', 'apt',
    // AI tokens
    'fet', 'agix', 'ocean', 'rndr', 'tao', 'arkm', 'worldcoin', 'ai16z',
    // New trending
    'trump', 'melania', 'fartcoin', 'goat', 'act', 'pnut', 'neiro', 'turbo', 'ladys',
    'bitcoin', 'ethereum', 'solana', 'base', 'ton', 'tron'
  ];
  
  let found = 0;
  for (const q of searches) {
    try {
      const resp = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${q}`);
      const data = await resp.json();
      
      for (const pair of (data.pairs || []).slice(0, 5)) {
        if (pair.fdv >= 400000 && pair.fdv <= 500000000) { // 400K to 500M mcap
          let twitter = null;
          if (pair.info?.socials) {
            const tw = pair.info.socials.find(s => s.type === 'twitter');
            if (tw) {
              twitter = tw.url.split('/').pop().replace('@', '').split('?')[0];
              if (twitter && twitter.length > 2 && !twitter.includes('/')) {
                dbQueries.addProject.run(
                  pair.baseToken.name,
                  pair.baseToken.symbol,
                  pair.fdv,
                  twitter,
                  null,
                  'dexscreener'
                );
                found++;
              }
            }
          }
        }
      }
      await new Promise(r => setTimeout(r, 150));
    } catch (e) {}
  }
  
  console.log(`  Found ${found} projects with Twitter from DexScreener`);
  totalFound += found;
}

// CoinGecko - Get top coins with Twitter
async function scanCoinGecko() {
  console.log('📊 Scanning CoinGecko...');
  
  let found = 0;
  const categories = ['meme-token', 'solana-meme-coins', 'base-meme-coins', 'ai-agents', 'defi'];
  
  for (const cat of categories) {
    try {
      const resp = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=${cat}&order=market_cap_desc&per_page=50&page=1`);
      const data = await resp.json();
      
      for (const coin of data) {
        if (coin.market_cap >= 400000 && coin.market_cap <= 500000000) {
          try {
            const detail = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}`);
            const info = await detail.json();
            
            if (info.links?.twitter_screen_name) {
              dbQueries.addProject.run(
                coin.name,
                coin.symbol.toUpperCase(),
                coin.market_cap,
                info.links.twitter_screen_name,
                null,
                'coingecko'
              );
              found++;
            }
            await new Promise(r => setTimeout(r, 1500)); // CG rate limit
          } catch (e) {}
        }
      }
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.log(`  Error with category ${cat}:`, e.message);
    }
  }
  
  console.log(`  Found ${found} projects with Twitter from CoinGecko`);
  totalFound += found;
}

// CoinMarketCap - Search trending
async function scanCMC() {
  console.log('📊 Scanning CoinMarketCap...');
  
  let found = 0;
  try {
    const resp = await fetch('https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=1&limit=200&sortBy=market_cap&sortType=desc&convert=USD&cryptoType=all');
    const data = await resp.json();
    
    for (const coin of data.data?.cryptoCurrencyList || []) {
      const mcap = coin.quotes?.[0]?.marketCap;
      if (mcap >= 400000 && mcap <= 500000000) {
        // CMC doesn't give Twitter directly in listing, but we can try
        dbQueries.addProject.run(
          coin.name,
          coin.symbol,
          mcap,
          null, // Will need to get from detail page
          null,
          'coinmarketcap'
        );
        found++;
      }
    }
  } catch (e) {
    console.log('  CMC error:', e.message);
  }
  
  console.log(`  Added ${found} projects from CoinMarketCap (Twitter TBD)`);
}

// Run all scans
await scanDexScreener();
await scanCoinGecko();
await scanCMC();

// Summary
const withTwitter = db.projects.filter(p => p.twitter_username);
console.log('\n📈 SCAN COMPLETE');
console.log('================');
console.log('Total projects in database:', db.projects.length);
console.log('Projects WITH Twitter username:', withTwitter.length);
console.log('\nReady for outreach! 🚀');
