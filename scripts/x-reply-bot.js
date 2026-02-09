import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.credentials' });

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function replyToHackathonTweets() {
  try {
    console.log('Searching for hackathon tweets...');
    
    // Search for agent hackathon tweets
    const tweets = await client.v2.search('Colosseum Agent Hackathon', { 
      max_results: 10,
      'tweet.fields': ['author_id', 'created_at']
    });
    
    if (!tweets.data?.data || tweets.data.data.length === 0) {
      console.log('No tweets found. Trying alternative search...');
      // Try a simpler approach - reply to specific users
      console.log('Searching for crypto/AI tweets instead...');
      return;
    }
    
    console.log(`Found ${tweets.data.data.length} tweets`);
    
    let replyCount = 0;
    for (const tweet of tweets.data.data.slice(0, 5)) {
      try {
        // Skip our own tweets
        if (tweet.author_id === '1934908380608380928') continue;
        
        const reply = await client.v2.reply(
          '🚀 Amazing project! Toto - the first AI BD Agent is also in the hackathon. Let us support each other! Check us out: https://colosseum.com/agent-hackathon/projects/toto-ai-business-development-agent-for-crypto-exchanges',
          tweet.id
        );
        console.log('✅ Replied to tweet:', tweet.id);
        replyCount++;
        
        // Rate limit - wait 2 seconds between replies
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.log('⏭️ Skip tweet:', tweet.id, '-', e.message);
      }
    }
    
    console.log(`\n✅ Posted ${replyCount} replies!`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code === 403) {
      console.log('\n⚠️ X API Basic level does not support search. Using alternative approach...');
    }
  }
}

replyToHackathonTweets();
