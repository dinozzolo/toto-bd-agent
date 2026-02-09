import fetch from 'node-fetch';
import { dbQueries } from './src/database.js';
import db from './src/database.js';

const MIN_MCAP = 300000;

console.log('🚀 ULTIMATE SCAN - Target: 2000+ Twitter usernames\n');

let totalFound = 0;

// 1. DexScreener - All major chains top pairs
console.log('📊 Phase 1: DexScreener Top Pairs...');
const chains = ['solana', 'ethereum', 'bsc', 'base', 'arbitrum', 'optimism', 'avalanche', 'polygon'];

for (const chain of chains) {
  try {
    const resp = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chain}`);
    const data = await resp.json();
    
    let chainFound = 0;
    for (const pair of (data.pairs || []).slice(0, 100)) {
      if (pair.fdv >= MIN_MCAP) {
        if (pair.info?.socials) {
          const tw = pair.info.socials.find(s => s.type === 'twitter');
          if (tw) {
            const username = tw.url.split('/').pop().replace('@', '').split('?')[0];
            if (username && username.length > 2) {
              dbQueries.addProject.run(
                pair.baseToken.name,
                pair.baseToken.symbol,
                pair.fdv,
                username,
                null,
                'dexscreener_' + chain
              );
              chainFound++;
              totalFound++;
            }
          }
        }
      }
    }
    console.log(`  ${chain}: ${chainFound} projects`);
    await new Promise(r => setTimeout(r, 300));
  } catch (e) {}
}

// 2. DexScreener - Token boosts
console.log('\n📊 Phase 2: DexScreener Token Boosts...');
try {
  const boostsResp = await fetch('https://api.dexscreener.com/token-boosts/top/v1');
  const boosts = await boostsResp.json();
  
  let boostFound = 0;
  for (const boost of boosts.slice(0, 200)) {
    try {
      const tokenResp = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${boost.tokenAddress}`);
      const tokenData = await tokenResp.json();
      
      for (const pair of tokenData.pairs || []) {
        if (pair.fdv >= MIN_MCAP && pair.info?.socials) {
          const tw = pair.info.socials.find(s => s.type === 'twitter');
          if (tw) {
            const username = tw.url.split('/').pop().replace('@', '').split('?')[0];
            if (username && username.length > 2) {
              dbQueries.addProject.run(
                pair.baseToken.name,
                pair.baseToken.symbol,
                pair.fdv,
                username,
                null,
                'dexscreener_boost'
              );
              boostFound++;
              totalFound++;
            }
          }
        }
      }
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {}
  }
  console.log(`  Boosts: ${boostFound} projects`);
} catch (e) {}

// 3. Massive search terms
console.log('\n📊 Phase 3: Comprehensive Search...');
const searchTerms = [
  // Letters
  'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
  // Memes
  'pepe','doge','shib','floki','bonk','wif','popcat','mew','bome','slerf','brett','andy','ponke','wen',
  'mog','wojak','chad','toshi','degen','higher','retardio','giga','fwog','michi','moo','mother','daddy',
  'trump','melania','fartcoin','goat','act','pnut','neiro','turbo','ladys','pepefork','bob','harrypotter',
  'spx','pepe2','shib2','doge2','elon','musk','trump2024','based','only','up','baby','rocket','moon',
  // DeFi
  'jup','pyth','jito','raydium','orca','marinade','drift','tensor','magic','kamino','marginfi','solend',
  'parcl','zeta','meteora','cyclo','dymension','celestia','injective','sei','pendle','eigen','ethfi',
  'puffer','renzo','kelp','swell','etherfi','bedrock','aave','uni','link','comp','mkr','crv','cvx','ldo',
  'ssv','gmx','gns','snx','velo','ram','vela','mux','lyra','premia','dopex',
  // Gaming
  'gala','imx','blur','super','gods','ilv','axs','sand','mana','ape','star','atlas','aurory','genopets',
  'stepn','gmt','primate','naka','beam','ron','pixel','portal','xai','ygg','mc',
  // AI
  'fet','agix','ocean','rndr','tao','arkm','worldcoin','ai16z','aixbt','virtuals','luna','zerebro',
  'fetch','singularity','phala','grass','io','akash','clore','enqai','nimble','codex',
  // Infrastructure
  'render','hnt','mobile','iot','theta','arweave','filecoin','storj','lpt','livepeer','golem',
  // L1s
  'sol','eth','btc','avax','near','atom','dot','ada','xrp','bnb','trx','ftm','one','klay','cro','rose',
  'oasis','celo','mina','kas','icp','algo','vet','egld','xtz','sui','apt','ton','xdc','kda','flow','stx',
  // Solana
  'jto','ray','msol','bsol','jitosol','helium','dew','dialect','squads','phantom','backpack','tensor',
  'samoyed','samo','solama','loco','mumu','honey','wen','jup','pyth','ray','orca',
  // Base
  'aerodrome','friend','farcaster','warpcast','degen','tybg','spx','miggles','normie','bald','basegod',
  // Arbitrum
  'rdnt','magic','spa','dpx','jones','plv','ram','vela','mux','yamato','vsta',
  // Optimism
  'sonne','perp','kwenta','thales','exactly','overn','dforce','granary',
  // LSDs
  'steth','reth','cbeth','wsteth','frxeth','sfrxeth','oseth','ethx','ankreth','geth','rseth','pxeth',
  'oeth','keth','weeth','ezeth',
  // RWA
  'ondo','cfg','mpl','gfi','land','prop','real','estate','gold','silver','tbill','ousg','usdyc',
  // Misc
  'nft','dao','launchpad','bridge','oracle','dex','perp','lending','yield','staking','restaking',
  'dog','cat','frog','wolf','bear','bull','ape','lion','tiger','eagle','shark','whale','dragon',
  'sushi','cake','burger','pizza','donut','taco','burrito','ramen','coffee','tea',
  'musk','elon','cz','sbf','garyvee','andrew','tate','jake','logan','ksi','mrbeast',
  'usa','uk','china','japan','korea','india','brazil','russia','dubai','tokyo','london',
  'nyc','miami','vegas','chicago','boston','seattle','austin','denver','atlanta','phoenix',
  'red','blue','green','yellow','purple','orange','pink','black','white','gold','silver',
  'moon','mars','venus','jupiter','star','galaxy','universe','space','rocket','launch',
  'alpha','beta','gamma','delta','omega','sigma','zero','one','first','prime','core',
  'new','next','future','meta','cyber','digital','web3','play','win','rich','wealth',
  'money','cash','diamond','gem','treasure','lucky','fortune','success','victory','king',
  'queen','god','legend','myth','hero','super','ultra','mega','giga','nano','micro','macro'
];

let searchFound = 0;
for (let i = 0; i < searchTerms.length; i++) {
  try {
    const resp = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${searchTerms[i]}`);
    const data = await resp.json();
    
    for (const pair of (data.pairs || []).slice(0, 2)) {
      if (pair.fdv >= MIN_MCAP && pair.info?.socials) {
        const tw = pair.info.socials.find(s => s.type === 'twitter');
        if (tw) {
          const username = tw.url.split('/').pop().replace('@', '').split('?')[0];
          if (username && username.length > 2) {
            dbQueries.addProject.run(
              pair.baseToken.name,
              pair.baseToken.symbol,
              pair.fdv,
              username,
              null,
              'dexscreener_search'
            );
            searchFound++;
            totalFound++;
          }
        }
      }
    }
    
    if ((i + 1) % 100 === 0) {
      const withTwitter = db.projects.filter(p => p.twitter_username);
      console.log(`  [${i + 1}/${searchTerms.length}] Twitter found: ${withTwitter.length} (+${totalFound})`);
      totalFound = 0;
    }
    
    await new Promise(r => setTimeout(r, 80));
  } catch (e) {}
}

console.log(`  Search terms: ${searchFound} projects`);

// 4. CoinGecko top 500
console.log('\n📊 Phase 4: CoinGecko Top 500...');
let cgFound = 0;
for (let page = 1; page <= 5; page++) {
  try {
    const resp = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page}`);
    const coins = await resp.json();
    
    for (const coin of coins) {
      if (coin.market_cap >= MIN_MCAP) {
        try {
          const detailResp = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}`);
          const detail = await detailResp.json();
          
          if (detail.links?.twitter_screen_name) {
            dbQueries.addProject.run(
              coin.name,
              coin.symbol.toUpperCase(),
              coin.market_cap,
              detail.links.twitter_screen_name,
              null,
              'coingecko'
            );
            cgFound++;
          }
          await new Promise(r => setTimeout(r, 1500));
        } catch (e) {}
      }
    }
    console.log(`  Page ${page}: ${cgFound} new this page`);
  } catch (e) {
    console.log(`  Page ${page}: error -`, e.message);
  }
}

// Final stats
console.log('\n✅ ULTIMATE SCAN COMPLETE');
console.log('=========================');
const finalWithTwitter = db.projects.filter(p => p.twitter_username);
console.log('Total projects:', db.projects.length);
console.log('With Twitter username:', finalWithTwitter.length);
console.log('');

if (finalWithTwitter.length >= 2000) {
  console.log('🎉 TARGET REACHED: 2000+ projects!');
} else if (finalWithTwitter.length >= 1000) {
  console.log('🎯 HALFWAY: 1000+ projects');
  console.log('Run again to reach 2000+');
} else {
  console.log(`📈 Progress: ${finalWithTwitter.length} projects`);
  console.log('Run again to reach 2000+');
}
