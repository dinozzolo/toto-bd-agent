// Database outreach using ACTUAL compliance.js rules
import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import { ComplianceTracker } from './src/compliance.js';
import { readFileSync, writeFileSync } from 'fs';

dotenv.config({ path: '.env.credentials' });

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Load database
const dbPath = './data/contacts.json';
const db = JSON.parse(readFileSync(dbPath, 'utf8'));

async function outreachWithCompliance() {
  console.log('🚀 DATABASE OUTREACH - USING COMPLIANCE.JS RULES\n');
  console.log('=====================================\n');
  
  // Check compliance stats
  const stats = ComplianceTracker.getStats();
  console.log(`Daily: ${stats.tweetsToday}/${stats.limit} (remaining: ${stats.remaining})`);
  console.log(`Circuit: ${stats.circuitOpen ? 'OPEN' : 'CLOSED'}`);
  console.log(`Last tweet: ${stats.lastTweet}\n`);
  
  // Check if we can tweet
  if (!ComplianceTracker.canTweet()) {
    console.log('⚠️ Cannot tweet now - waiting for compliance slot');
    await ComplianceTracker.waitForNextSlot();
  }
  
  // Get FRESH projects (newest first, not contacted today)
  const targets = db.projects
    .filter(p => {
      if (!p.twitter_username || p.mcap < 300000 || p.mcap > 100000000) return false;
      return ComplianceTracker.shouldEngage(p.id);
    })
    .sort((a, b) => new Date(b.discovered_at) - new Date(a.discovered_at))
    .slice(0, 5);
  
  console.log(`Found ${targets.length} compliant targets\n`);
  
  let successCount = 0;
  for (const project of targets) {
    // Double-check compliance before each tweet
    if (!ComplianceTracker.canTweet()) {
      console.log('\n⚠️ Daily limit or circuit breaker - stopping');
      break;
    }
    
    try {
      // Get user
      const user = await client.v2.userByUsername(project.twitter_username);
      if (!user.data) {
        console.log(`⏭️ ${project.name}: User not found`);
        continue;
      }
      
      // Get latest tweet
      const tweets = await client.v2.userTimeline(user.data.id, { max_results: 5 });
      if (!tweets.data?.data?.length) {
        console.log(`⏭️ ${project.name}: No tweets`);
        continue;
      }
      
      // Get engagement state
      const engagement = ComplianceTracker.getProjectEngagement(project.id);
      
      // Get stage-appropriate message
      const message = ComplianceTracker.getStageMessage(project, engagement);
      if (!message) {
        console.log(`⏭️ ${project.name}: Already pitched (stage ${engagement.stage})`);
        continue;
      }
      
      // Send reply
      const reply = await client.v2.reply(message, tweets.data.data[0].id);
      
      // Record in compliance tracker
      ComplianceTracker.recordTweet(message);
      ComplianceTracker.recordInteraction(project.id, message, 'reply');
      
      console.log(`✅ REPLIED to ${project.name}`);
      console.log(`   Stage: ${engagement.stage} → ${ComplianceTracker.getProjectEngagement(project.id).stage}`);
      console.log(`   Message: ${message.substring(0, 50)}...\n`);
      
      successCount++;
      
      // Wait for next compliance slot (30 min minimum)
      if (successCount < targets.length) {
        const waitTime = ComplianceTracker.getRandomInterval();
        console.log(`⏳ Waiting ${Math.ceil(waitTime/60000)} minutes for next slot...\n`);
        await new Promise(r => setTimeout(r, waitTime));
      }
      
    } catch (err) {
      console.error(`❌ ${project.name}: ${err.message}`);
      ComplianceTracker.recordFailure(err);
      
      if (err.code === 429) {
        console.log('🚨 Rate limited - stopping outreach');
        break;
      }
    }
  }
  
  const finalStats = ComplianceTracker.getStats();
  console.log('=====================================');
  console.log(`✅ Success: ${successCount}`);
  console.log(`📊 Daily: ${finalStats.tweetsToday}/${finalStats.limit}`);
  console.log(`🎯 Engagement:`, ComplianceTracker.getEngagementStats());
  console.log('=====================================\n');
}

outreachWithCompliance();
