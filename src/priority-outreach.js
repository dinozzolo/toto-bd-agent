// Priority outreach - replies to exchange listing projects first
// X COMPLIANT: Max 100 tweets/day, 30 min minimum intervals
import db from './database.js';
import { client } from './twitter-client.js';
import { ComplianceTracker } from './compliance.js';

class PriorityOutreach {
  constructor() {
    // X COMPLIANT: Minimum 30 minutes between tweets
    this.minInterval = 30 * 60 * 1000;
  }

  // Get HIGH PRIORITY projects (exchange listings)
  getPriorityProjects(limit = 10) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Get projects contacted in last 7 days
    const recentlyContacted = new Set(
      db.outreach
        .filter(o => o.type === 'tweet_reply' && o.sent_at >= sevenDaysAgo)
        .map(o => o.project_id)
    );
    
    // Priority sources - DISABLED alpha_leak (fake projects with 0 mcap)
    const prioritySources = ['exchange_listing'];
    
    // Get priority projects not contacted recently (filter out fake projects with 0 mcap)
    // DELAYED LINK STRATEGY: Also check engagement stage
    const priorityProjects = db.projects
      .filter(p => 
        p.twitter_username && 
        !recentlyContacted.has(p.id) &&
        prioritySources.includes(p.source) &&
        p.mcap > 10000 &&
        !p.invalid_twitter &&
        !p.no_recent_tweets &&
        ComplianceTracker.shouldEngage(p.id)  // Check if we should engage per strategy
      )
      .sort((a, b) => {
        // Sort by follower count (higher first)
        const followersA = a.twitter_followers || 0;
        const followersB = b.twitter_followers || 0;
        return followersB - followersA;
      });
    
    return priorityProjects.slice(0, limit);
  }

  // Get regular projects - prioritize SMALLER trending projects (300K-100M mcap)
  getRegularProjects(limit = 10) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const recentlyContacted = new Set(
      db.outreach
        .filter(o => o.type === 'tweet_reply' && o.sent_at >= sevenDaysAgo)
        .map(o => o.project_id)
    );
    
    return db.projects
      .filter(p => 
        p.twitter_username && 
        !recentlyContacted.has(p.id) &&
        !['alpha_leak', 'exchange_listing'].includes(p.source) &&
        p.mcap >= 300000 &&
        !p.invalid_twitter &&
        !p.no_recent_tweets &&
        p.mcap <= 100000000
      )
      .sort((a, b) => {
        // Prioritize: newer projects + higher volume
        const scoreA = (a.volume_24h || 0) / (a.mcap || 1);
        const scoreB = (b.volume_24h || 0) / (b.mcap || 1);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  async processPriorityQueue() {
    console.log('[PriorityOutreach] 🎯 Checking for priority projects...');
    
    // X COMPLIANCE CHECK
    if (!ComplianceTracker.canTweet()) {
      const stats = ComplianceTracker.getStats();
      console.log(`[PriorityOutreach] ⏸️  Compliance check failed: ${JSON.stringify(stats)}`);
      return false;
    }
    
    // Wait for minimum interval
    await ComplianceTracker.waitForNextSlot();
    
    // Get up to 10 projects (check more to find ones with original tweets)
    let projects = this.getPriorityProjects(10);
    let isPriority = true;
    
    // If no priority, fall back to regular
    if (projects.length === 0) {
      projects = this.getRegularProjects(10);
      isPriority = false;
    }
    
    if (projects.length === 0) {
      console.log('[PriorityOutreach] ⏩ No projects to contact');
      return false;
    }
    
    // Try each project until one succeeds
    for (const project of projects) {
      const sourceLabel = isPriority ? '🔥 PRIORITY' : 'REGULAR';
      console.log(`[PriorityOutreach] ${sourceLabel}: ${project.symbol} @${project.twitter_username}`);
      
      if (project.alpha_account) {
        console.log(`[PriorityOutreach]    Source: @${project.alpha_account} alpha leak`);
      }
      if (project.listing_exchange) {
        console.log(`[PriorityOutreach]    Source: ${project.listing_exchange} listing`);
      }
      
      // Try to reply to this project
      const result = await this.replyToProject(project);
      if (result) {
        return true; // Success - stop here
      }
      // If failed (retweet, etc), continue to next project
      console.log(`[PriorityOutreach] ⏩ Skipped ${project.symbol}, trying next...`);
    }
    
    console.log(`[PriorityOutreach] ⏩ Tried ${projects.length} projects, all skipped`);
    return false;
  }

  async replyToProject(project) {
    try {
      // Skip mega projects ($1B+ mcap)
      if (project.mcap > 1000000000) {
        console.log(`[PriorityOutreach] ⏩ Skipping mega project ${project.symbol}`);
        return false;
      }
      
      // Get user (1 API call)
      const user = await client.v2.userByUsername(project.twitter_username);
      if (!user?.data?.id) {
        console.log(`[PriorityOutreach] ❌ Could not find user @${project.twitter_username}`);
        project.invalid_twitter = true;
        const { saveDb } = await import('./database.js');
        saveDb();
        return false;
      }
      
      // Get last tweet (1 API call) - max 1 tweet to minimize API usage
      const tweets = await client.v2.userTimeline(user.data.id, { 
        max_results: 5,
        'tweet.fields': ['created_at']
      });
      
      if (!tweets?.data?.data || !Array.isArray(tweets.data.data) || tweets.data.data.length === 0) {
        console.log(`[PriorityOutreach] ❌ No tweets found for @${project.twitter_username}`);
        return false;
      }
      
      const lastTweet = tweets.data.data[0];
      
      // Skip retweets
      if (lastTweet.text?.startsWith('RT @')) {
        console.log(`[PriorityOutreach] ⏩ Skipping retweet for ${project.symbol}`);
        
        // Log this as a skip so we don't check again immediately
        db.outreach.push({
          id: db.outreach.length + 1,
          project_id: project.id,
          type: 'tweet_reply',
          content: 'SKIPPED: Only retweets found',
          tweet_id: null,
          status: 'skipped_retweet',
          priority: false,
          sent_at: new Date().toISOString()
        });
        const { saveDb } = await import('./database.js');
        saveDb();
        
        return false;
      }
      
      // Reply to last tweet regardless of age (saves API calls)
      
      // DELAYED LINK STRATEGY: Get message based on engagement stage
      const engagement = ComplianceTracker.getProjectEngagement(project.id);
      const reply = ComplianceTracker.getStageMessage(project, engagement);
      
      if (!reply) {
        console.log(`[PriorityOutreach] ⏭️  Skipping ${project.symbol} - pitch already sent`);
        return false;
      }
      
      // Send reply
      const response = await client.v2.reply(reply, lastTweet.id);
      
      // X COMPLIANT: Record successful tweet
      ComplianceTracker.recordTweet(reply);
      
      // DELAYED LINK STRATEGY: Record this interaction
      ComplianceTracker.recordInteraction(project.id, reply, 'reply');
      
      // Log outreach
      db.outreach.push({
        id: db.outreach.length + 1,
        project_id: project.id,
        type: 'tweet_reply',
        content: reply,
        tweet_id: response.data.id,
        status: 'sent',
        priority: true,
        sent_at: new Date().toISOString(),
        stage: engagement.stage
      });
      
      // Save
      const { saveDb } = await import('./database.js');
      saveDb();
      
      console.log(`[PriorityOutreach] ✅ SUCCESS: Replied to ${project.symbol} (Stage: ${engagement.stage})`);
      console.log(`[PriorityOutreach] 📊 Tweet Stats: ${JSON.stringify(ComplianceTracker.getStats())}`);
      console.log(`[PriorityOutreach] 📈 Engagement Stats: ${JSON.stringify(ComplianceTracker.getEngagementStats())}`);
      return true;
      
    } catch (error) {
      console.error(`[PriorityOutreach] ❌ Failed:`, error.message);
      
      // X COMPLIANT: Record failure
      ComplianceTracker.recordFailure(error);
      
      return false;
    }
  }

  generateReply(project) {
    // CONSERVATIVE TEMPLATES - No exchange mentions, no DM requests
    // These avoid X's spam filters while building organic engagement
    const safeTemplates = [
      `Love the innovation from $${project.symbol}! The ${project.name} team is building something special. 💎`,
      `Bullish on $${project.symbol} - ${project.name} has serious potential in this market. 🚀`,
      `Impressed by what ${project.name} is building with $${project.symbol}. Quality project! 🔥`,
      `The $${project.symbol} community is absolutely fire. ${project.name} is onto something big. ⚡`,
      `${project.name} ($${project.symbol}) has that special sauce. Watching closely! 👀`,
      `Respect the grind from $${project.symbol}. ${project.name} building through the noise. 💪`,
      `$${project.symbol} fundamentals looking solid. ${project.name} knows what they are doing. 📊`,
      `Big fan of what $${project.symbol} is doing. ${project.name} is ahead of the curve. 🎯`,
    ];
    
    return safeTemplates[Math.floor(Math.random() * safeTemplates.length)];
  }

  generateDMText(project) {
    return `Hi ${project.name} team,

I'm Toto, BD Agent at Solcex Exchange.

I've been following $${project.symbol} and I'm impressed by your growth. We'd love to have ${project.name} listed on Solcex (solcex.cc).

What we offer:
• Deep liquidity pools
• Zero listing fees for quality projects
• Marketing support
• 24/7 dedicated manager

Ready to discuss? Reach out here or contact @dinozzolo

Best,
Toto`;
  }
}

export default PriorityOutreach;
