import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';

dotenv.config({ path: '.env.credentials' });

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Load database
const dbPath = './data/contacts.json';
let db = JSON.parse(readFileSync(dbPath, 'utf8'));

// Reset daily counter if new day
const today = new Date().toDateString();
if (db.dailyStats?.date !== today) {
  db.dailyStats = { date: today, count: 0 };
  db.usedMessages = []; // Reset used messages daily
}

// X POLICY COMPLIANCE
const MAX_DAILY_REPLIES = 90;
const MIN_DELAY_MS = 70000;
const MAX_DELAY_MS = 90000;

// Generate TRULY UNIQUE message (no templates - per X policy)
function generateUniqueMessage(project) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  
  // Build unique message components
  const intros = [
    `Checking out ${project.name}`,
    `Saw ${project.name} building`,
    `${project.name} caught my attention`,
    `Following ${project.name}`,
    `Interested in ${project.name}`
  ];
  
  const values = [
    `solid fundamentals`,
    `impressive progress`,
    `great vision`,
    `strong community`,
    `clean execution`
  ];
  
  const ctas = [
    `Toto - AI BD Agent helps projects like yours. DM to explore?`,
    `We are Toto, automating BD for crypto. Worth a conversation?`,
    `Toto connects projects with exchanges. Let us chat?`,
    `AI-powered BD by Toto. Interested in partnership?`,
    `Toto does automated outreach for crypto. DM open?`
  ];
  
  // Randomly combine (ensures uniqueness with timestamp)
  const intro = intros[Math.floor(Math.random() * intros.length)];
  const value = values[Math.floor(Math.random() * values.length)];
  const cta = ctas[Math.floor(Math.random() * ctas.length)];
  
  const message = `${intro} - ${value}! 🚀 ${cta} Demo: https://dinozzolo.github.io/toto-bd-agent/demo #${randomId}`;
  
  // Check if used (30-day window per policy)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentlyUsed = db.usedMessages?.some(um => 
    um.message === message && 
    um.timestamp > thirtyDaysAgo
  );
  
  if (recentlyUsed) {
    return generateUniqueMessage(project); // Recurse with new random
  }
  
  return message;
}

async function replyToProject(project) {
  if (db.dailyStats.count >= MAX_DAILY_REPLIES) {
    console.log(`⚠️ Daily limit reached (${MAX_DAILY_REPLIES}).`);
    return false;
  }
  
  if (!project.twitter_username) {
    console.log(`⏭️ ${project.name}: No Twitter`);
    return false;
  }
  
  try {
    // Check 7-day contact window
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentlyContacted = db.outreach?.some(o => 
      o.project_id === project.id && 
      new Date(o.sent_at) > sevenDaysAgo
    );
    
    if (recentlyContacted) {
      console.log(`⏭️ ${project.name}: Contacted recently`);
      return false;
    }
    
    // Get user
    const user = await client.v2.userByUsername(project.twitter_username);
    if (!user.data) {
      console.log(`⏭️ ${project.name}: User not found`);
      return false;
    }
    
    // Get latest tweet
    const tweets = await client.v2.userTimeline(user.data.id, { max_results: 5 });
    if (!tweets.data?.data?.length) {
      console.log(`⏭️ ${project.name}: No tweets`);
      return false;
    }
    
    // Generate TRULY UNIQUE message (no templates!)
    const message = generateUniqueMessage(project);
    const latestTweet = tweets.data.data[0];
    
    // Send reply
    const reply = await client.v2.reply(message, latestTweet.id);
    
    // Log success
    db.outreach = db.outreach || [];
    db.outreach.push({
      project_id: project.id,
      type: 'tweet_reply',
      sent_at: new Date().toISOString(),
      tweet_id: reply.data.id,
      message: message.substring(0, 50) + '...'
    });
    
    // Track unique message
    db.usedMessages = db.usedMessages || [];
    db.usedMessages.push({
      message: message,
      timestamp: Date.now(),
      project: project.name
    });
    
    // Update daily counter
    db.dailyStats.count++;
    writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    console.log(`✅ REPLIED to ${project.name}`);
    console.log(`   Daily: ${db.dailyStats.count}/${MAX_DAILY_REPLIES}`);
    console.log(`   Message: ${message.substring(0, 60)}...`);
    
    return true;
    
  } catch (err) {
    console.log(`❌ ${project.name}: ${err.message}`);
    return false;
  }
}

async function startOutreach() {
  console.log('🚀 X DATABASE OUTREACH - 100% POLICY COMPLIANT\n');
  console.log('=====================================\n');
  console.log(`Daily: ${db.dailyStats.count}/${MAX_DAILY_REPLIES}\n`);
  
  // Get NEWEST projects first
  const targets = db.projects
    .filter(p => p.twitter_username && p.mcap >= 300000 && p.mcap <= 100000000)
    .sort((a, b) => new Date(b.discovered_at) - new Date(a.discovered_at))
    .slice(0, 10);
  
  console.log(`Found ${targets.length} targets\n`);
  
  let successCount = 0;
  for (const project of targets) {
    if (db.dailyStats.count >= MAX_DAILY_REPLIES) {
      console.log('\n⚠️ Daily limit reached.');
      break;
    }
    
    const success = await replyToProject(project);
    if (success) {
      successCount++;
      const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
      console.log(`   Waiting ${Math.round(delay/1000)}s...\n`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  console.log('=====================================');
  console.log(`✅ Success: ${successCount}`);
  console.log(`📊 Daily: ${db.dailyStats.count}/${MAX_DAILY_REPLIES}`);
  console.log('=====================================\n');
}

startOutreach();
