// Aggressive project scouting from multiple sources
import { config } from './src/config.js';

const CG_API_KEY = config.COINGECKO_API_KEY || '';

async function scoutDexScreener() {
  console.log('=== SCOUTING DEXSCREENER ===\n');
  try {
    // DexScreener API for trending Solana tokens
    const response = await fetch('https://api.dexscreener.com/token-boosts/top/v1');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    console.log(`Found ${data.length} boosted tokens\n`);
    
    // Filter for promising projects
    const promising = data
      .filter(t => t.totalAmount && t.totalAmount > 1000)
      .slice(0, 10);
    
    console.log('Top boosted tokens:');
    promising.forEach(t => {
      console.log(`  - ${t.tokenAddress?.substring(0, 20)}... (${t.totalAmount} BOOST)`);
    });
    
    return promising;
  } catch (err) {
    console.log('DexScreener error:', err.message);
    return [];
  }
}

async function scoutCoinGeckoTrending() {
  console.log('\n=== SCOUTING COINGECKO TRENDING ===\n');
  try {
    // Trending searches
    const response = await fetch(
      'https://api.coingecko.com/api/v3/search/trending',
      {
        headers: CG_API_KEY ? { 'x-cg-pro-api-key': CG_API_KEY } : {}
      }
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    console.log(`Found ${data.coins?.length || 0} trending coins\n`);
    
    const coins = data.coins?.slice(0, 10) || [];
    coins.forEach(c => {
      console.log(`  - ${c.item.name} (${c.item.symbol}) - Rank #${c.item.market_cap_rank}`);
    });
    
    return coins;
  } catch (err) {
    console.log('CoinGecko error:', err.message);
    return [];
  }
}

async function scoutNewListings() {
  console.log('\n=== SCOUTING NEW LISTINGS ===\n');
  try {
    // Recently added coins
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/list?include_platform=true',
      {
        headers: CG_API_KEY ? { 'x-cg-pro-api-key': CG_API_KEY } : {}
      }
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    // Get last 20 added
    const recent = data.slice(-20);
    
    console.log(`Found ${recent.length} recent listings\n`);
    recent.forEach(c => {
      console.log(`  - ${c.name} (${c.symbol})`);
    });
    
    return recent;
  } catch (err) {
    console.log('New listings error:', err.message);
    return [];
  }
}

async function fullScout() {
  console.log('🚀 AGGRESSIVE PROJECT SCOUTING - ALL SOURCES\n');
  console.log('=====================================\n');
  
  const dex = await scoutDexScreener();
  const trending = await scoutCoinGeckoTrending();
  const newListings = await scoutNewListings();
  
  console.log('\n=====================================');
  console.log('TOTAL PROJECTS SCOUTED:');
  console.log(`  DexScreener: ${dex.length}`);
  console.log(`  CoinGecko Trending: ${trending.length}`);
  console.log(`  New Listings: ${newListings.length}`);
  console.log('=====================================\n');
}

fullScout();
