import { client } from './twitter-client.js';
import { config } from './config.js';
import { dbQueries } from './database.js';
import db from './database.js';
import nodemailer from 'nodemailer';
import { generateContextualReply } from './reply-templates.js';

class OutreachEngine {
  constructor() {
    this.emailTransporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
    this.processing = false;
  }

  async findTwitterUsername(projectName, symbol) {
    try {
      const search = await client.v2.search(`${projectName} ${symbol} crypto`, {
        max_results: 50,
      });
      
      for await (const tweet of search) {
        if (tweet.author_id) {
          const user = await client.v2.user(tweet.author_id);
          if (user.data.public_metrics.followers_count < config.bd.maxFollowers) {
            return user.data.username;
          }
        }
      }
    } catch (error) {
      console.error(`[Outreach] Error finding Twitter for ${symbol}:`, error.message);
    }
    return null;
  }

  async getLastTweet(username, project) {
    try {
      // Skip mega projects (already on all major exchanges)
      if (project.mcap > 1000000000) { // $1B+ market cap
        console.log(`[Outreach] ⏩ Skipping mega project ${project.symbol} ($${(project.mcap/1000000000).toFixed(1)}B mcap)`);
        return null;
      }
      
      const user = await client.v2.userByUsername(username);
      if (!user?.data?.id) {
        console.log(`[Outreach] ❌ Could not find user @${username}`);
        // Mark as invalid
        const { saveDb } = await import('./database.js');
        project.invalid_twitter = true;
        saveDb();
        return null;
      }
      
      // Get only 1 tweet to minimize API calls
      const tweets = await client.v2.userTimeline(user.data.id, { 
        max_results: 5,
        'tweet.fields': ['created_at']
      });
      if (!tweets?.data?.data || !Array.isArray(tweets.data.data) || tweets.data.data.length === 0) {
        console.log(`[Outreach] ❌ No tweets found for @${username}`);
        return null;
      }
      
      const tweet = tweets.data.data[0];
      
      // Skip retweets
      if (tweet.text?.startsWith('RT @')) {
        console.log(`[Outreach] ⏩ Skipping retweet for ${project.symbol}`);
        
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
        saveDb();
        
        return null;
      }
      
      // Reply to last tweet regardless of age (saves API calls)
      return tweet;
    } catch (error) {
      console.error(`[Outreach] Error getting tweets for @${username}:`, error.message);
      return null;
    }
  }

  generateContextualReply(tweetText, projectName, symbol) {
    // Ensure symbol has $ prefix
    const ticker = symbol.startsWith('$') ? symbol : `$${symbol}`;
    
    const bullishCompliments = [
      `Love what ${projectName} is building`,
      `${ticker} has serious potential`,
      `${projectName} community is absolutely fire`,
      `${ticker} showing impressive momentum`,
      `Bullish on ${ticker} long term`,
      `${projectName} fundamentals are solid`,
      `${ticker} community engagement is unmatched`,
      `${projectName} is ahead of the curve`,
      `${ticker} is a sleeper hit`,
      `${projectName} team knows what they're doing`,
      `${ticker} chart looking healthy`,
      `${projectName} is building through the noise`,
      `${ticker} has that special something`,
      `${projectName} is undervalued af`,
      `${ticker} community is different`,
    ];
    
    const compliment = bullishCompliments[Math.floor(Math.random() * bullishCompliments.length)];
    
    const templates = [
      `${compliment}! ${projectName} ${ticker} has serious upside. Ready to take it to the next level? List ${ticker} on @${config.company.twitter} for maximum exposure and professional liquidity. DM @dinozzolo 🚀`,
      
      `${compliment}. ${ticker} deserves better exchange exposure. @${config.company.twitter} provides deep liquidity, competitive fees, and dedicated support for quality projects like ${projectName}. Let's talk - DM @dinozzolo`,
      
      `Bullish on ${ticker}! ${compliment}. @${config.company.twitter} accelerates growth for projects like ${projectName} with strong market making and community reach. Ready to list? DM @dinozzolo`,
      
      `${compliment}! ${projectName} ${ticker} is exactly the kind of project we love to support. List on @${config.company.twitter} for professional trading infrastructure and marketing exposure. Contact @dinozzolo`,
      
      `${ticker} looking strong! ${compliment}. @${config.company.twitter} specializes in launching quality tokens like ${projectName} with proper liquidity and global reach. DM @dinozzolo to discuss`,
      
      `${compliment}. ${projectName} ${ticker} has the fundamentals to go far. Get listed on @${config.company.twitter} - streamlined process, deep liquidity, and dedicated manager support. Reach out @dinozzolo`,
      
      `Impressed by ${ticker}! ${compliment}. @${config.company.twitter} provides the professional infrastructure ${projectName} deserves. Ready for the next level? DM @dinozzolo`,
      
      `${compliment}! ${ticker} community is clearly passionate. @${config.company.twitter} helps projects like ${projectName} reach their full potential with proper exchange listing. Contact @dinozzolo`,
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  async replyToProject(project) {
    // CRITICAL: Check if we're currently processing
    if (this.processing) {
      console.log(`[Outreach] Busy, skipping ${project.symbol}`);
      return false;
    }
    
    this.processing = true;
    
    // CRITICAL: Reload database and check for recent reply (prevents race conditions)
    // MUST wait 7 DAYS before re-contacting same project
    const db = (await import('./database.js')).default;
    const recentReply = db.outreach.find(o => 
      o.project_id === project.id && 
      o.type === 'tweet_reply' &&
      new Date(o.sent_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 DAYS
    );
    
    if (recentReply) {
      console.log(`[Outreach] ❌ BLOCKED: ${project.symbol} already replied within 7 days (${recentReply.sent_at})`);
      this.processing = false;
      return false;
    }
    
    console.log(`[Outreach] 🔄 STARTING: ${project.symbol} @${project.twitter_username}`);
    
    // Wait 2 seconds to see if another process is racing
    await new Promise(r => setTimeout(r, 2000));
    
    // DOUBLE-CHECK after delay (7 DAY COOLDOWN)
    const freshDb = (await import('./database.js')).default;
    const justReplied = freshDb.outreach.find(o => 
      o.project_id === project.id && 
      o.type === 'tweet_reply' &&
      new Date(o.sent_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 DAYS
    );
    
    if (justReplied) {
      console.log(`[Outreach] ❌ RACE CONDITION: ${project.symbol} replied within 7 days by another process`);
      this.processing = false;
      return false;
    }
    
    try {
      const lastTweet = await this.getLastTweet(project.twitter_username, project);
      if (!lastTweet) {
        this.processing = false;
        return false;
      }

      const reply = generateContextualReply(
        lastTweet.text,
        project.name,
        project.symbol
      );

      await client.v2.reply(reply, lastTweet.id);
      
      // Log immediately after sending
      dbQueries.logOutreach.run(project.id, 'tweet_reply', reply, 'sent');
      console.log(`[Outreach] ✅ SUCCESS: Replied to @${project.twitter_username} about $${project.symbol}`);
      console.log(`[Outreach] 📝 Content: ${reply.substring(0, 80)}...`);
      
      this.processing = false;
      return true;
    } catch (error) {
      console.error(`[Outreach] ❌ Failed to reply to @${project.twitter_username}:`, error.message);
      dbQueries.logOutreach.run(project.id, 'tweet_reply', '', 'failed');
      this.processing = false;
      return false;
    }
  }

  async sendEmail(project) {
    if (!project.email) return false;

    const emailBody = `
Hi ${project.name} team,

I'm Toto, the Business Development Agent at ${config.company.name}.

I have been following $${project.symbol} and I'm impressed by your project's growth and market positioning with a market cap of $${(project.mcap / 1000000).toFixed(2)}M.

We would love to have ${project.name} listed on ${config.company.name} (${config.company.website}). We offer:
- Competitive listing fees
- Strong liquidity pools
- Marketing support
- Dedicated listing manager

If you are interested, please reach out to Dino (@dinozzolo on X) or reply to this email directly.

Looking forward to working together.

Best regards,
Toto
Business Development Agent
${config.company.name}
    `.trim();

    try {
      await this.emailTransporter.sendMail({
        from: config.email.user,
        to: project.email,
        subject: `Listing Opportunity for ${project.name} on ${config.company.name}`,
        text: emailBody,
      });

      dbQueries.logOutreach.run(project.id, 'email', emailBody, 'sent');
      console.log(`[Outreach] Email sent to ${project.email} for $${project.symbol}`);
      return true;
    } catch (error) {
      console.error(`[Outreach] Email failed for ${project.email}:`, error.message);
      dbQueries.logOutreach.run(project.id, 'email', emailBody, 'failed');
      return false;
    }
  }

  async processQueue() {
    // Get 1 project (API cost optimized - reply regardless of tweet age)
    const projects = dbQueries.getProjectsPendingOutreach.all(1);
    
    if (projects.length === 0) {
      console.log('[Outreach] No projects pending');
      return;
    }
    
    const project = projects[0];
    
    // CRITICAL: Safety check - never reply to same project within 1 hour
    const justReplied = db.outreach.find(o => 
      o.project_id === project.id && 
      o.type === 'tweet_reply' &&
      new Date(o.sent_at) > new Date(Date.now() - 60 * 60 * 1000)
    );
    
    if (justReplied) {
      console.log(`[Outreach] ❌ BLOCKED: ${project.symbol} contacted within 1 hour`);
      return;
    }
    
    if (project.twitter_username) {
      await this.replyToProject(project);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const engine = new OutreachEngine();
  engine.processQueue().then(() => console.log('[Outreach] Queue processed'));
}

export default OutreachEngine;
