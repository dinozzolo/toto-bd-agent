import fetch from 'node-fetch';
import { dbQueries } from './src/database.js';
import db from './src/database.js';

const MIN_MCAP = 300000;

console.log('🚀 MEGA SCAN - Target: 2000+ projects with Twitter\n');
console.log('Minimum market cap:', MIN_MCAP);
console.log('');

let totalAdded = 0;
let totalChecked = 0;

// Massive list of search terms across all categories
const searchTerms = [
  // A-Z memecoins and tokens
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  
  // Popular memes
  'pepe', 'doge', 'shib', 'floki', 'bonk', 'wif', 'popcat', 'mew', 'bome', 'slerf',
  'brett', 'andy', 'ponke', 'wen', 'mog', 'wojak', 'chad', 'toshi', 'degen', 'higher',
  'retardio', 'giga', 'fwog', 'michi', 'moo', 'toly', 'jason', 'mother', 'daddy',
  'trump', 'melania', 'fartcoin', 'goat', 'act', 'pnut', 'neiro', 'turbo', 'ladys',
  'pepefork', 'bob', 'harrypotter', 'spx', 'queen', 'harry', 'jfk', 'maga',
  'pepe2', 'shib2', 'doge2', 'elon', 'musk', 'based', 'only', 'up',
  
  // DeFi protocols
  'jup', 'pyth', 'jito', 'raydium', 'orca', 'marinade', 'drift', 'tensor', 'magic',
  'kamino', 'marginfi', 'solend', 'parcl', 'zeta', 'meteora', 'cyclo', 'dym',
  'celestia', 'injective', 'sei', 'pendle', 'eigen', 'ethfi', 'puffer', 'renzo',
  'kelp', 'swell', 'etherfi', 'bedrock', 'kelp', 'rsETH', 'ezETH', 'weETH',
  'aave', 'uni', 'link', 'comp', 'mkr', 'crv', 'cvx', 'ldo', 'ssv', 'gmx',
  'gns', 'snx', 'velo', 'op', 'arb', 'metis', 'mnt', 'manta', 'strk', 'zksync',
  
  // Gaming/Metaverse
  'gala', 'imx', 'blur', 'super', 'gods', 'ilv', 'axs', 'sand', 'mana', 'ape',
  'star', 'atlas', 'aurory', 'genopets', 'stepn', 'gmt', 'primate', 'naka',
  'beam', 'ron', 'pixel', 'portal', 'xai', 'ygg', 'mc', 'dia', 'alice',
  
  // AI tokens
  'fet', 'agix', 'ocean', 'rndr', 'tao', 'arkm', 'worldcoin', 'ai16z', 'aixbt',
  'virtuals', 'luna', 'zerebro', 'ai', 'agents', 'fetch', 'singularity', 'phala',
  'grass', 'io', 'akash', 'clore', 'psdn', 'enqai', 'nimble', 'codex',
  
  // Infrastructure/Storage
  'render', 'hnt', 'mobile', 'iot', 'theta', 'arweave', 'filecoin', 'storj',
  'lpt', 'livepeer', 'gnt', 'golem', 'ocean', 'pha', 'cent', 'fil', 'ar',
  
  // Layer 1s
  'sol', 'eth', 'btc', 'avax', 'near', 'atom', 'dot', 'ada', 'xrp', 'bnb',
  'trx', 'matic', 'ftm', 'one', 'harmony', 'klay', 'cro', 'bsc', 'rose',
  'oasis', 'celo', 'mina', 'kas', 'icp', 'algo', 'vet', 'egld', 'xtz',
  'sui', 'apt', 'sei', 'ton', 'xdc', 'kda', 'flow', 'imx', 'stx',
  
  // Solana ecosystem
  'sol', 'jto', 'jup', 'pyth', 'ray', 'orca', 'msol', 'bsol', 'jitosol',
  'helium', 'hnt', 'mobile', 'iot', 'dew', 'dialect', 'squads', 'phantom',
  'backpack', 'tensor', 'madlads', 'degods', 'okaybears', 'cets', 'solana',
  'samoyed', 'samo', 'sam', 'myro', 'solama', 'loco', 'mumu', 'honey',
  
  // Base ecosystem
  'base', 'aerodrome', 'friend', 'farcaster', 'warpcast', 'degen', 'higher',
  'toshi', 'brett', 'andy', 'tybg', 'spx', 'miggles', 'normie', 'bald',
  'basegod', 'based', 'baseball', 'build', 'basebros', 'basebear',
  
  // Arbitrum
  'arb', 'gmx', 'gns', 'rdnt', 'magic', 'spa', 'dpx', 'jones', 'plv', 'pendle',
  'ram', 'vela', 'mux', 'lyra', 'premia', 'dopex', 'yamato', 'vsta',
  
  // Optimism
  'op', 'velo', 'sonne', 'lyra', 'perp', 'kwenta', 'snx', 'thales', 'exactly',
  'overn', 'dforce', 'granary', 'weeth', 'ezeth',
  
  // BSC ecosystem
  'cake', 'xvs', 'alpaca', 'bunny', 'belt', 'ellipsis', 'mdex', 'apeswap',
  'biswap', 'thena', 'thena', 'chapel', 'bnbx', 'ankr', 'stkbnb',
  
  // ETH LSDs
  'steth', 'reth', 'cbeth', 'wsteth', 'frxeth', 'sfrxeth', 'oseth', 'ethx',
  'ankreth', 'geth', 'rseth', 'pxeth', 'oeth', 'keth', 'ankr',
  
  // RWA/DePIN
  'ondo', 'cfg', 'mpl', 'gfi', 'gold', 'silver', 'land', 'prop', 'real',
  'estate', 'tokenized', 'treasuries', 'bonds', 'tbill', 'ousg', 'usdyc',
  
  // Other categories
  'nft', 'dao', 'launchpad', 'bridge', 'oracle', 'dex', 'perp', 'lending',
  'yield', 'staking', 'restaking', 'derivatives', 'options', 'insurance',
  'privacy', 'identity', 'data', 'compute', 'storage', 'bandwidth',
  
  // Animal tokens
  'dog', 'cat', 'frog', 'wolf', 'bear', 'bull', 'ape', 'monkey', 'lion',
  'tiger', 'panda', 'rabbit', 'mouse', 'rat', 'hamster', 'penguin', 'bird',
  'eagle', 'hawk', 'fish', 'shark', 'whale', 'dolphin', 'octopus', 'snake',
  
  // Food tokens
  'sushi', 'cake', 'burger', 'pizza', 'donut', 'taco', 'burrito', 'ramen',
  'coffee', 'tea', 'beer', 'wine', 'champagne', 'vodka', 'rum',
  
  // Celeb/Influencer themed
  'musk', 'elon', 'trump', 'biden', 'crypto', 'cz', 'sbf', 'garyvee',
  'andrew', 'tate', 'jake', 'logan', 'ksi', 'mrbeast', 'pewdiepie',
  
  // Countries/Cities
  'usa', 'uk', 'china', 'japan', 'korea', 'india', 'brazil', 'russia',
  'dubai', 'tokyo', 'london', 'nyc', 'miami', 'vegas', 'paris', 'berlin',
  
  // Colors
  'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black',
  'white', 'gold', 'silver', 'bronze', 'rainbow', 'neon', 'dark', 'light',
  
  // Generic
  'moon', 'mars', 'venus', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'star', 'galaxy', 'universe', 'space', 'rocket', 'launch', 'orbit', 'cosmos',
  'alpha', 'beta', 'gamma', 'delta', 'omega', 'sigma', 'tau', 'lambda',
  'zero', 'one', 'first', 'prime', 'core', 'base', 'root', 'source',
  'new', 'next', 'future', 'meta', 'cyber', 'digital', 'crypto', 'block',
  'chain', 'web3', 'defi', 'dao', 'nft', 'game', 'play', 'win',
  'rich', 'wealth', 'money', 'cash', 'gold', 'diamond', 'gem', 'treasure',
  'lucky', 'fortune', 'success', 'victory', 'champion', 'king', 'queen',
  'god', 'legend', 'myth', 'hero', 'super', 'ultra', 'mega', 'giga',
  'nano', 'micro', 'macro', 'hyper', 'super', 'max', 'pro', 'elite'
];

console.log(`Searching ${searchTerms.length} terms...`);
console.log('');

// Process in batches
const BATCH_SIZE = 20;
const batches = [];
for (let i = 0; i < searchTerms.length; i += BATCH_SIZE) {
  batches.push(searchTerms.slice(i, i + BATCH_SIZE));
}

for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
  const batch = batches[batchIndex];
  
  for (const term of batch) {
    try {
      const resp = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${term}`);
      const data = await resp.json();
      
      for (const pair of (data.pairs || []).slice(0, 5)) {
        totalChecked++;
        
        if (pair.fdv >= MIN_MCAP) {
          if (pair.info?.socials) {
            const tw = pair.info.socials.find(s => s.type === 'twitter');
            if (tw) {
              let username = tw.url.split('/').pop().replace('@', '').split('?')[0];
              if (username && username.length > 2 && !username.includes('/') && !username.includes('=')) {
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
      
      await new Promise(r => setTimeout(r, 80));
    } catch (e) {}
  }
  
  if ((batchIndex + 1) % 5 === 0) {
    process.stdout.write(`[${batchIndex + 1}/${batches.length}] `);
    const withTwitter = db.projects.filter(p => p.twitter_username);
    process.stdout.write(`Projects: ${db.projects.length} | With Twitter: ${withTwitter.length}\n`);
  }
}

console.log('');
console.log('✅ MEGA SCAN COMPLETE');
console.log('===================');
console.log('Pairs checked:', totalChecked);
console.log('New projects with Twitter:', totalAdded);
console.log('');

const withTwitter = db.projects.filter(p => p.twitter_username);
console.log('📊 FINAL DATABASE:');
console.log('Total projects:', db.projects.length);
console.log('With Twitter username:', withTwitter.length);
console.log('');
console.log('🚀 Ready for massive outreach!');
