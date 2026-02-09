import { client } from './twitter-client.js';
import db, { saveDb } from './database.js';

class MentionMonitor {
  constructor() {
    this.botUsername = 'theprincetoto';
    this.processedMentions = new Set();
  }

  async checkMentions() {
    console.log('[Mentions] Checking for new replies...');
    
    try {
      // Get mentions of the bot account
      const mentions = await client.v2.mentions(this.botUsername, { 
        max_results: 10,
        'tweet.fields': ['author_id', 'created_at', 'referenced_tweets'],
        'user.fields': ['verified', 'verified_type', 'public_metrics']
      });
      
      if (!mentions.data || mentions.data.length === 0) {
        console.log('[Mentions] No new mentions');
        return;
      }

      // Get user data for mentions
      const userIds = mentions.data.map(t => t.author_id);
      const users = await client.v2.users(userIds, {
        'user.fields': ['verified', 'verified_type', 'public_metrics']
      });
      
      const userMap = new Map();
      users.data.forEach(u => userMap.set(u.id, u));

      for (const tweet of mentions.data) {
        // Skip if already processed
        if (this.processedMentions.has(tweet.id)) continue;
        this.processedMentions.add(tweet.id);
        
        const author = userMap.get(tweet.author_id);
        if (!author) continue;

        // Check if verified (blue checkmark)
        const isVerified = author.verified || author.verified_type === 'blue';
        
        if (!isVerified) {
          console.log(`[Mentions] ⏩ Skipping unverified @${author.username}`);
          continue;
        }

        console.log(`[Mentions] ✅ Verified account @${author.username} replied`);
        
        // Reply back
        await this.replyToMention(tweet, author);
      }
      
    } catch (error) {
      console.error('[Mentions] Error:', error.message);
    }
  }

  async replyToMention(tweet, author) {
    try {
      const replies = [
        `Thanks for reaching out @${author.username}! Interested in listing? DM @dinozzolo to discuss how @SolCex_Exchange can help your project grow 🚀`,
        `Appreciate the engagement @${author.username}! Let's talk exchange listings - DM @dinozzolo for details on @SolCex_Exchange 💎`,
        `Hey @${author.username}! Thanks for connecting. Ready to take your project to the next level? DM @dinozzolo 🔥`
      ];
      
      const reply = replies[Math.floor(Math.random() * replies.length)];
      
      const response = await client.v2.reply(reply, tweet.id);
      
      // Log it
      db.outreach.push({
        project_id: null,
        type: 'mention_reply',
        content: reply,
        tweet_id: response.data.id,
        to_user: author.username,
        sent_at: new Date().toISOString()
      });
      saveDb();
      
      console.log(`[Mentions] ✅ Replied to @${author.username}`);
      
    } catch (error) {
      console.error(`[Mentions] ❌ Failed to reply:`, error.message);
    }
  }
}

export default MentionMonitor;
