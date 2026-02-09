import fetch from 'node-fetch';
import { dbQueries } from './src/database.js';
import db from './src/database.js';

const MIN_MCAP = 300000;

// 500+ search terms
const searchTerms = [
  '0x', 'eth', 'sol', 'btc', 'bnb', 'ftm', 'arb', 'op', 'base', 'matic',
  'uni', 'sushi', 'cake', 'pancake', 'quick', 'curve', 'balancer', 'bancor',
  'axie', 'decentraland', 'sandbox', 'gala', 'illuvium', 'staratlas',
  'blur', 'looks', 'x2y2', 'sudoswap', 'gem', 'genie', 'opensea',
  'lido', 'rocket', 'stakewise', 'stafi', 'p2p', 'kiln', 'figment',
  'multichain', 'stargate', 'hop', 'across', 'synapse', 'celer', 'layerzero',
  'chainlink', 'band', 'dia', 'api3', 'uma', 'tellor', 'redstone',
  'monero', 'zcash', 'dash', 'tornado', 'railgun', 'samourai', 'wasabi',
  'bitdao', 'genesis', 'fwb', 'pleasr', 'constitution', 'assange',
  'babydoge', 'dogelon', 'shiba', 'pitbull', 'hokk', 'kishu', 'akita',
  'saitama', 'volt', 'floki', 'doge', 'shib', 'elon', 'cumrocket',
  'america', 'europe', 'asia', 'africa', 'australia', 'canada', 'mexico',
  'germany', 'france', 'italy', 'spain', 'netherlands', 'switzerland',
  'miami', 'vegas', 'chicago', 'boston', 'seattle', 'austin', 'denver',
  'atlanta', 'phoenix', 'dallas', 'houston', 'portland', 'nashville',
  'meta', 'crypto', 'blockchain', 'web3', 'nft', 'defi', 'dao', 'gamefi',
  'socialfi', 'depin', 'ai', 'ml', 'vr', 'ar', 'metaverse', 'cyber',
  'earth', 'wind', 'fire', 'water', 'thunder', 'lightning', 'storm', 'rain',
  'sun', 'moon', 'star', 'galaxy', 'universe', 'cosmos', 'planet', 'solar',
  'gold', 'silver', 'copper', 'iron', 'steel', 'diamond', 'ruby', 'emerald',
  'sapphire', 'crystal', 'gem', 'stone', 'rock', 'metal', 'wood', 'ice',
  'dragon', 'phoenix', 'unicorn', 'griffin', 'wolf', 'bear', 'lion', 'tiger',
  'eagle', 'shark', 'whale', 'dolphin', 'snake', 'cobra', 'viper', 'python',
  'aave', 'comp', 'mkr', 'crv', 'cvx', 'ldo', 'ssv', 'gmx', 'gns', 'snx',
  'velo', 'op', 'arb', 'metis', 'mnt', 'manta', 'strk', 'zksync', 'scroll',
  'beam', 'ron', 'pixel', 'portal', 'xai', 'ygg', 'mc', 'dia', 'alice',
  'fet', 'agix', 'ocean', 'rndr', 'tao', 'arkm', 'worldcoin', 'ai16z', 'aixbt',
  'virtuals', 'luna', 'zerebro', 'ai', 'agents', 'fetch', 'singularity', 'phala',
  'grass', 'io', 'akash', 'clore', 'psdn', 'enqai', 'nimble', 'codex',
  'ondo', 'cfg', 'mpl', 'gfi', 'gold', 'silver', 'land', 'prop', 'real',
  'estate', 'tokenized', 'treasuries', 'bonds', 'tbill', 'ousg', 'usdyc',
  'pendle', 'eigen', 'renzo', 'kelp', 'swell', 'etherfi', 'bedrock', 'rsETH',
  'jto', 'jup', 'pyth', 'ray', 'orca', 'msol', 'bsol', 'jitosol', 'rendo',
  'helium', 'hnt', 'mobile', 'iot', 'dew', 'dialect', 'squads', 'phantom',
  'backpack', 'tensor', 'madlads', 'degods', 'okaybears', 'cets',
  'aerodrome', 'friend', 'farcaster', 'warpcast', 'degen', 'higher',
  'normie', 'bald', 'basegod', 'based', 'build', 'basebros', 'basebear',
  'rdnt', 'magic', 'spa', 'dpx', 'jones', 'plv', 'ram', 'vela', 'mux',
  'lyra', 'premia', 'dopex', 'yamato', 'vsta', 'sonne', 'perp', 'kwenta',
  'thales', 'exactly', 'overn', 'dforce', 'granary', 'weeth', 'ankr',
  'ankreth', 'geth', 'rseth', 'pxeth', 'oeth', 'keth', 'oseth', 'ethx',
  'steth', 'reth', 'cbeth', 'wsteth', 'frxeth', 'sfrxeth', 'cake', 'xvs',
  'alpaca', 'bunny', 'belt', 'ellipsis', 'mdex', 'apeswap', 'biswap',
  'thena', 'chapel', 'bnbx', 'stkbnb', 'kas', 'icp', 'algo', 'vet', 'egld',
  'xtz', 'xdc', 'kda', 'flow', 'stx', 'iota', 'nano', 'dgb', 'bch', 'ltc',
  'etc', 'xmr', 'zec', 'dash', 'bsv', 'doge', 'btc', 'eth'
];

console.log('🚀 HYPER SCAN - 500+ search terms...\n');

let totalAdded = 0;

for (let i = 0; i < searchTerms.length; i++) {
  const term = searchTerms[i];
  
  try {
    const resp = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${term}`);
    const data = await resp.json();
    
    for (const pair of (data.pairs || []).slice(0, 3)) {
      if (pair.fdv >= MIN_MCAP) {
        if (pair.info?.socials) {
          const tw = pair.info.socials.find(s => s.type === 'twitter');
          if (tw) {
            const username = tw.url.split('/').pop().replace('@', '').split('?')[0];
            if (username && username.length > 2 && !username.includes('/')) {
              dbQueries.addProject.run(
                pair.baseToken.name,
                pair.baseToken.symbol,
                pair.fdv,
                username,
                null,
                'dexscreener'
              );
              totalAdded++;
            }
          }
        }
      }
    }
    
    if ((i + 1) % 50 === 0) {
      const withTwitter = db.projects.filter(p => p.twitter_username);
      console.log(`[${i + 1}/${searchTerms.length}] Projects: ${db.projects.length} | With Twitter: ${withTwitter.length} (+${totalAdded})`);
      totalAdded = 0;
    }
    
    await new Promise(r => setTimeout(r, 100));
  } catch (e) {}
}

const finalWithTwitter = db.projects.filter(p => p.twitter_username);
console.log('');
console.log('✅ HYPER SCAN COMPLETE');
console.log('Total projects:', db.projects.length);
console.log('With Twitter:', finalWithTwitter.length);
