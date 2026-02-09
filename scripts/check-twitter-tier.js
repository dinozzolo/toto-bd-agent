import { TwitterApi } from 'twitter-api-v2';
import { config } from './src/config.js';

console.log('Checking Twitter API tier...\n');
console.log('API Key:', config.twitter.apiKey.substring(0, 10) + '...');
console.log('Access Token:', config.twitter.accessToken.substring(0, 20) + '...');

const client = new TwitterApi({
  appKey: config.twitter.apiKey,
  appSecret: config.twitter.apiSecret,
  accessToken: config.twitter.accessToken,
  accessSecret: config.twitter.accessSecret,
});

try {
  // Test 1: Get own user
  const me = await client.v2.me();
  console.log('\n✅ Auth works - Logged in as @' + me.data.username);
  
  // Test 2: Post a tweet
  console.log('\n📝 Testing tweet posting...');
  const tweet = await client.v2.tweet('Testing API access - Solcex Exchange BD Agent active. DM @dinozzolo for listings on @SolCex_Exchange');
  console.log('✅ Posting works! Tweet ID:', tweet.data.id);
  
  // Test 3: Get user timeline (this is what we need for replies)
  console.log('\n📖 Testing timeline read...');
  const timeline = await client.v2.userTimeline(me.data.id, { max_results: 5 });
  console.log('✅ Timeline read works!');
  
  // Test 4: Get another user's tweets
  console.log('\n🔍 Testing reading other users...');
  const user = await client.v2.userByUsername('bonk_inu');
  console.log('User found:', user.data.username, 'ID:', user.data.id);
  
  const userTweets = await client.v2.userTimeline(user.data.id, { max_results: 5 });
  console.log('✅ Can read other users tweets!');
  console.log('Latest tweet:', userTweets.data.data[0].text.substring(0, 100) + '...');
  
  console.log('\n🎉 FULL ACCESS - Paid tier confirmed!');
  
} catch (error) {
  console.error('\n❌ Error:', error.code, '-', error.message);
  
  if (error.code === 402) {
    console.log('\n💳 API TIER: FREE');
    console.log('This endpoint requires Basic ($100/mo) or higher tier');
    console.log('Upgrade at: https://developer.twitter.com/en/portal/products');
  } else if (error.code === 403) {
    console.log('\n🔒 Permission denied - check app permissions');
  } else if (error.code === 429) {
    console.log('\n⏳ Rate limited - wait and try again');
  }
  
  if (error.data) {
    console.log('\nError details:', JSON.stringify(error.data, null, 2));
  }
}
