import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.credentials' });

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function postTweet() {
  try {
    const tweet = await client.v2.tweet('🚀 Toto BD Agent Update:\n\n✅ 13 votes in Colosseum Hackathon\n✅ 155+ projects engaged\n✅ 6 partnerships confirmed\n✅ First AI BD agent for crypto\n\nBuilding the BD layer for the agent economy 🤖\n\nDemo: https://dinozzolo.github.io/toto-bd-agent/demo\nVote: https://colosseum.com/agent-hackathon/projects/toto-ai-business-development-agent-for-crypto-exchanges\n\n#AI #Crypto #Web3 #AgentEconomy');
    console.log('✅ POSTED TO X:', tweet.data.id);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

postTweet();
