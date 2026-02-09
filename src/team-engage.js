import { client } from './twitter-client.js';
import { config } from './config.js';
import { dbQueries } from './database.js';

class TeamEngagement {
  async checkAndReply(username) {
    try {
      const user = await client.v2.userByUsername(username);
      const tweets = await client.v2.userTimeline(user.data.id, {
        max_results: 5,
        exclude: 'retweets,replies'
      });

      if (!tweets.data.data || tweets.data.data.length === 0) return;

      const latestTweet = tweets.data.data[0];
      
      // CRITICAL: Check database for recent engagement with this tweet
      const db = (await import('./database.js')).default;
      const recentEngagement = db.team_engagement.find(e => 
        e.username === username && 
        e.tweet_id === latestTweet.id &&
        new Date(e.replied_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      
      if (recentEngagement) {
        console.log(`[Team] Already replied to @${username}'s tweet ${latestTweet.id}`);
        return;
      }

      // Generate contextual reply
      const reply = this.generateTeamReply(username, latestTweet.text);
      
      await client.v2.reply(reply, latestTweet.id);
      dbQueries.logTeamEngagement.run(username, latestTweet.id, reply);
      
      console.log(`[Team] ✅ Replied to @${username}`);
    } catch (error) {
      console.error(`[Team] ❌ Error engaging with @${username}:`, error.message);
    }
  }

  generateTeamReply(username, tweetContent) {
    const responses = {
      dinozzolo: [
        'Fully aligned on this. Let me know if you need support on any outreach.',
        'Great perspective. I am working on expanding our pipeline to match this vision.',
        'Agreed. Our BD efforts are ramping up to support these goals.',
      ],
      Solcex_intern: [
        'Good work. Let me know if you need any data or contacts from my outreach.',
        'Nice insight. We should coordinate on this.',
        'Solid take. I will follow up on the BD side.',
      ],
      arloxshot: [
        'Understood. Prioritizing this in outreach strategy.',
        'On it. Will report progress soon.',
        'Copy that. Aligning BD efforts accordingly.',
      ],
      Alexanderbtcc: [
        'Noted. Adjusting pipeline to reflect this.',
        'Makes sense. Will incorporate into outreach.',
        'Agreed. Moving forward with this approach.',
      ],
      SolCex_Exchange: [
        'Bullish on Solcex. Our listings pipeline is growing strong.',
        'The future is bright for Solcex. Onboarding quality projects daily.',
        'Excited about where we are heading. Great things coming.',
      ],
    };

    const options = responses[username] || [
      'Fully support this direction.',
      'Great to see the progress.',
      'Bullish on what we are building.',
    ];

    return options[Math.floor(Math.random() * options.length)];
  }

  async run() {
    console.log('[Team] Checking team tweets...');
    for (const username of config.team) {
      await this.checkAndReply(username);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay between checks
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const teamEng = new TeamEngagement();
  teamEng.run().then(() => process.exit(0));
}

export default TeamEngagement;
