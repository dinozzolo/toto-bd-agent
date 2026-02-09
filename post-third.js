import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.credentials' });

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function postThird() {
  try {
    const tweet = await client.v2.tweet(`🤖 AI + Crypto = The Future

Toto BD Agent is revolutionizing how crypto projects connect:

✅ Automated outreach
✅ Smart targeting
✅ Multi-channel (X, Email, Telegram)
✅ Solana priority

Built for @SolcexExchange by @dinozzolo

Demo: https://dinozzolo.github.io/toto-bd-agent/demo

#AI #Crypto #AgentEconomy`);
    
    console.log('✅ Third post published:', tweet.data.id);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

postThird();
