import fetch from 'node-fetch';
import { dbQueries } from './database.js';
import db from './database.js';

const MIN_MCAP = 300000;

class ExpandedScanner {
  async scanDeFiLlama() {
    console.log('[Scanner] Scanning DeFiLlama...');
    try {
      const response = await fetch('https://api.llama.fi/protocols');
      const protocols = await response.json();
      
      let count = 0;
      for (const protocol of protocols) {
        // Check if protocol has Twitter and sufficient TVL
        if (protocol.twitter && protocol.tvl > 1000000) {
          const twitter = protocol.twitter.replace('@', '').trim();
          
          // Check if Twitter already exists
          const exists = db.projects.some(p => 
            p.twitter_username?.toLowerCase() === twitter.toLowerCase()
          );
          
          if (!exists && twitter && /^[a-zA-Z0-9_]+$/.test(twitter)) {
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

  async scanTokenTerminal() {
    console.log('[Scanner] Scanning TokenTerminal...');
    try {
      // Token Terminal API requires auth, skip for now
      console.log('[Scanner] TokenTerminal requires API key - skipping');
    } catch (error) {
      console.error('[Scanner] TokenTerminal error:', error.message);
    }
  }

  async scanCoinMarketCapSocial() {
    console.log('[Scanner] Scanning CoinMarketCap social data...');
    try {
      // Get trending coins and check for social links
      const response = await fetch('https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=1&limit=500&sortBy=market_cap&sortType=desc');
      const data = await response.json();
      
      let count = 0;
      for (const coin of data.data?.cryptoCurrencyList || []) {
        const mcap = coin.quotes?.[0]?.marketCap;
        if (mcap >= MIN_MCAP) {
          // Try to get detailed info with social links
          try {
            await new Promise(r => setTimeout(r, 500)); // Rate limiting
          } catch (e) {}
        }
      }
      console.log(`[Scanner] Processed CMC trending`);
    } catch (error) {
      console.error('[Scanner] CMC social error:', error.message);
    }
  }

  async scanCryptoRank() {
    console.log('[Scanner] Scanning CryptoRank...');
    try {
      // CryptoRank API for trending
      const response = await fetch('https://api.cryptorank.io/v1/currencies?api_key=YOUR_API_KEY&limit=500');
      if (!response.ok) {
        console.log('[Scanner] CryptoRank requires API key - skipping');
        return;
      }
    } catch (error) {
      console.error('[Scanner] CryptoRank error:', error.message);
    }
  }

  async scanMessari() {
    console.log('[Scanner] Scanning Messari...');
    try {
      // Messari API is mostly paid
      console.log('[Scanner] Messari requires paid API - skipping');
    } catch (error) {
      console.error('[Scanner] Messari error:', error.message);
    }
  }

  async scanGitHubCrypto() {
    console.log('[Scanner] Scanning GitHub for crypto projects...');
    try {
      // This would require GitHub API key and complex parsing
      console.log('[Scanner] GitHub scanning requires custom implementation');
    } catch (error) {
      console.error('[Scanner] GitHub error:', error.message);
    }
  }

  async scanLunarCrush() {
    console.log('[Scanner] Scanning LunarCrush...');
    try {
      // LunarCrush requires API key
      console.log('[Scanner] LunarCrush requires API key - skipping');
    } catch (error) {
      console.error('[Scanner] LunarCrush error:', error.message);
    }
  }

  async scanDappRadar() {
    console.log('[Scanner] Scanning DappRadar...');
    try {
      // DappRadar API
      const response = await fetch('https://apis.dappradar.com/v2/dapps?chain=ethereum&page=1&resultsPerPage=100', {
        headers: {
          'X-BLOBR-KEY': process.env.DAPPRADAR_API_KEY || ''
        }
      });
      if (!response.ok) {
        console.log('[Scanner] DappRadar requires API key - skipping');
        return;
      }
    } catch (error) {
      console.error('[Scanner] DappRadar error:', error.message);
    }
  }

  async run() {
    console.log('[Scanner] Starting expanded daily scan...');
    
    await this.scanDeFiLlama();
    await this.scanCoinMarketCapSocial();
    
    // Skip paid APIs for now
    // await this.scanTokenTerminal();
    // await this.scanCryptoRank();
    // await this.scanMessari();
    // await this.scanLunarCrush();
    // await this.scanDappRadar();
    
    const withTwitter = db.projects.filter(p => p.twitter_username);
    console.log('[Scanner] Expanded scan complete');
    console.log(`[Scanner] Total with Twitter: ${withTwitter.length}`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scanner = new ExpandedScanner();
  scanner.run().then(() => process.exit(0));
}

export default ExpandedScanner;
