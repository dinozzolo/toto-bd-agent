import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.credentials' });

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Solcex + Bullish Crypto Posts
const posts = [
  {
    text: `🚀 Solcex Exchange Update:\n\nThe future of crypto trading is here. Solcex continues to build the most advanced platform for Solana ecosystem tokens.\n\nWhy traders choose Solcex:\n✅ Deep liquidity\n✅ Low fees\n✅ Solana-native\n✅ Fast settlement\n\nJoin the revolution 👇\nhttps://solcex.cc\n\n#Solana #CryptoExchange #Web3`,
    delay: 0
  },
  {
    text: `📊 Market Analysis: Why I am bullish on Solana ecosystem\n\nSOL holding strong at $195\nDeFi TVL growing steadily\nNew projects launching daily\nInstitutional interest rising\n\nThe Solana renaissance is just beginning 🚀\n\nWhat is your top SOL pick? 👇\n\n#Solana #Crypto #Bullish`,
    delay: 60000 // 1 min
  },
  {
    text: `🤖 AI + Crypto = The Future\n\nToto BD Agent is revolutionizing how crypto projects connect:\n\n✅ Automated outreach\n✅ Smart targeting\n✅ Multi-channel (X, Email, Telegram)\n✅ Solana priority\n\nBuilt for @SolcexExchange by @dinozzolo\n\nDemo: https://dinozzolo.github.io/toto-bd-agent/demo\n\n#AI #Crypto #AgentEconomy`,
    delay: 120000 // 2 min
  }
];

async function postContent() {
  console.log('=== POSTING SOLCEX & CRYPTO CONTENT ===\n');
  
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    
    try {
      if (post.delay > 0) {
        console.log(`Waiting ${post.delay/1000} seconds...`);
        await new Promise(r => setTimeout(r, post.delay));
      }
      
      const tweet = await client.v2.tweet(post.text);
      console.log(`✅ Posted ${i + 1}/${posts.length}:`, tweet.data.id);
      
    } catch (err) {
      console.error(`❌ Error posting ${i + 1}:`, err.message);
      
      // If rate limited, stop
      if (err.code === 429) {
        console.log('⚠️ Rate limited. Stopping.');
        break;
      }
    }
  }
  
  console.log('\n=== POSTING COMPLETE ===');
}

postContent();
