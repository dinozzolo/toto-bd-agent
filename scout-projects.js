// Project scouting using CoinGecko API
import { config } from './src/config.js';

const CG_API_KEY = config.COINGECKO_API_KEY || '';

async function scoutNewProjects() {
  console.log('=== SCOUTING NEW CRYPTO PROJECTS ===\n');
  
  try {
    // Fetch trending coins from CoinGecko
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?' +
      'vs_currency=usd&' +
      'order=volume_desc&' +
      'per_page=50&' +
      'page=1&' +
      'sparkline=false&' +
      'price_change_percentage=24h',
      {
        headers: CG_API_KEY ? { 'x-cg-pro-api-key': CG_API_KEY } : {}
      }
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const coins = await response.json();
    console.log(`Found ${coins.length} coins\n`);
    
    // Filter for promising projects (300K-100M mcap, positive volume)
    const promising = coins.filter(c => 
      c.market_cap >= 300000 && 
      c.market_cap <= 100000000 &&
      c.total_volume > 100000
    );
    
    console.log(`Promising projects (${promising.length}):\n`);
    
    for (const coin of promising.slice(0, 10)) {
      console.log(`${coin.name} (${coin.symbol.toUpperCase()})`);
      console.log(`  Market Cap: $${(coin.market_cap/1000000).toFixed(2)}M`);
      console.log(`  Volume 24h: $${(coin.total_volume/1000000).toFixed(2)}M`);
      console.log(`  Price Change: ${coin.price_change_percentage_24h?.toFixed(2)}%`);
      console.log('');
    }
    
    return promising;
    
  } catch (err) {
    console.error('Error scouting projects:', err.message);
    return [];
  }
}

scoutNewProjects();
