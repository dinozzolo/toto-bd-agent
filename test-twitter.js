import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ path: '.env.credentials' });

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = client.readWrite;

async function test() {
  try {
    console.log('Testing Twitter API...');
    
    // Test 1: Get my info
    const me = await rwClient.v2.me();
    console.log('✅ Authenticated as @' + me.data.username);
    
    // Test 2: Get user by username
    const user = await rwClient.v2.userByUsername('MISAKA_BTC');
    console.log('✅ Found user @MISAKA_BTC, ID:', user.data.id);
    
    // Test 3: Get user timeline
    const tweets = await rwClient.v2.userTimeline(user.data.id, { max_results: 5 });
    console.log('✅ Got timeline, tweets:', tweets.data?.data?.length || 0);
    
    console.log('\nAll tests passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Code:', error.code);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
  }
}

test();
