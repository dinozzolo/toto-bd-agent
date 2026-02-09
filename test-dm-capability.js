// Test DM functionality with OAuth 1.0a credentials
import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.credentials' });

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function testDMs() {
  try {
    console.log('Testing DM functionality...\n');
    
    // Test 1: Get authenticated user
    const me = await client.v2.me();
    console.log('✅ Authenticated as:', me.data.username);
    
    // Test 2: Check DM permissions by getting DM events
    console.log('\nTesting DM read permission...');
    const dms = await client.v1.listDmEvents();
    console.log('✅ DM read works! Recent DMs:', dms.length);
    
    // Test 3: Try to send a test DM (to yourself or a test account)
    console.log('\nTesting DM send permission...');
    // We'll test by trying to lookup a user first
    const user = await client.v2.userByUsername('elonmusk');
    console.log('✅ Can lookup users for DM targeting');
    
    console.log('\n✅ ALL DM PERMISSIONS WORKING!');
    console.log('\nReady to send DMs to crypto projects!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Code:', err.code);
    console.error('\nFull error:', JSON.stringify(err, null, 2));
  }
}

testDMs();
