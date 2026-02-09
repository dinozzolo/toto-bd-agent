// Test X API with new credentials
import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.credentials' });

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function testX() {
  try {
    console.log('Testing X API...');
    
    // Test user lookup
    const user = await client.v2.userByUsername('elonmusk');
    console.log('✅ User lookup works:', user.data.name);
    
    // Test my own account
    const me = await client.v2.me();
    console.log('✅ My account:', me.data.username);
    
    console.log('\n✅ X API IS WORKING!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Code:', err.code);
  }
}

testX();
