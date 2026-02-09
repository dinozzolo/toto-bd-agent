import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.credentials' });

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = client.readWrite;

async function testReply() {
  try {
    // Get a tweet to reply to
    const user = await rwClient.v2.userByUsername('MISAKA_BTC');
    const tweets = await rwClient.v2.userTimeline(user.data.id, { max_results: 5 });
    
    if (!tweets.data?.data?.[0]) {
      console.log('No tweets found');
      return;
    }
    
    const tweetId = tweets.data.data[0].id;
    console.log('Found tweet ID:', tweetId);
    
    // Try to reply
    console.log('Attempting to reply...');
    const reply = await rwClient.v2.reply('Test reply from Toto BD Agent', tweetId);
    console.log('✅ Reply successful!', reply.data.id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Code:', error.code);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
  }
}

testReply();
