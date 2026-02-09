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
let db = { projects: [], outreach: [], dailyStats: { date: '', count: 0 } };
if (existsSync(dbPath)) {
  db = JSON.parse(readFileSync(dbPath, 'utf8'));
}

// Reset daily counter if new day
const today = new Date().toDateString();
if (db.dailyStats?.date !== today) {
  db.dailyStats = { date: today, count: 0 };
}

// X POLICY COMPLIANCE
const MAX_DAILY_REPLIES = 90; // Per X rules (100 total - 10 buffer)
const MIN_DELAY_MS = 70000; // 70 seconds minimum
const MAX_DELAY_MS = 90000; // 90 seconds maximum

// CTA STRATEGY MESSAGES - All include clear Call to Action
const ctaMessages = [
  "Building something special! 🚀 Toto - AI BD Agent for crypto exchanges. Interested in a Solcex listing? DM us or check https://dinozzolo.github.io/toto-bd-agent/demo 👇",
  "Love the vision! 💪 Toto automates BD for crypto projects. Want to explore exchange listing opportunities? Let us connect - DM open! 🤝",
  "Impressive progress! 🤖 Toto is the first AI BD agent for crypto. We help projects get listed. Interested? DM us or visit our demo! 📈",
  "Solid fundamentals! 📈 Toto connects crypto projects with exchanges. Want to discuss listing on Solcex? Reach out - we are here to help! 🚀",
  "Great work! 🎯 Toto does automated BD outreach for crypto. Looking for exchange partnerships? DM us for a conversation! 💬",
  "Promising project! 🚀 Toto - AI BD Agent helps projects get visibility. Want to explore Solcex listing? Check our demo or DM! 👇",
  "Clean execution! 💡 Toto automates sales outreach for crypto. Interested in exchange listings? Let us chat - DM open! 🤝",
  "Strong fundamentals! 🤝 Toto helps projects find exchange listings. Want to partner? Reach out via DM or check https://dinozzolo.github.io/toto-bd-agent/demo 🌟",
  "Exciting build! 🌟 Toto is AI-powered BD for crypto. Looking for exchange opportunities? DM us - let us explore together! 🚀",
  "Quality project! 🏗️ Toto automates BD for the crypto ecosystem. Interested in Solcex listing? DM open - let us talk! 💪"
];

async function replyToProject(project) {
  // Check daily limit
  if (db.dailyStats.count >= MAX_DAILY_REPLIES) {
    console.log(`⚠️ Daily limit reached (${MAX_DAILY_REPLIES}). Stopping.`);
    return false;
  }
  
  if (!project.twitter_username) {
    console.log(`⏭️ ${project.name}: No Twitter handle`);
    return false;
  }
  
  try {
    // Check if contacted in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentlyContacted = db.outreach?.some(o => 
      o.project_id === project.id && 
      o.type === 'tweet_reply' &&
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
      console.log(`⏭️ ${project.name}: No recent tweets`);
      return false;
    }
    
    // Pick random CTA message (includes call to action)
    const message = ctaMessages[Math.floor(Math.random() * ctaMessages.length)];
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
      message: message,
      project_name: project.name
    });
    
    // Update daily counter
    db.dailyStats.count++;
    writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    console.log(`✅ REPLIED to ${project.name} (@${project.twitter_username})`);
    console.log(`   Daily count: ${db.dailyStats.count}/${MAX_DAILY_REPLIES}`);
    
    return true;
    
  } catch (err) {
    console.log(`❌ ${project.name}: ${err.message}`);
    return false;
  }
}

async function startDatabaseOutreach() {
  console.log('🚀 DATABASE OUTREACH - X BD (MAIN JOB)\n');
  console.log('=====================================\n');
  console.log(`Daily progress: ${db.dailyStats.count}/${MAX_DAILY_REPLIES} replies\n`);
  
  // Get FRESH projects with Twitter handles (sorted by newest first)
  const targets = db.projects
    .filter(p => 
      p.twitter_username && 
      p.mcap >= 300000 && 
      p.mcap <= 100000000
    )
    .sort((a, b) => new Date(b.discovered_at) - new Date(a.discovered_at)) // NEWEST FIRST
    .slice(0, 15);
  
  console.log(`Found ${targets.length} database targets\n`);
  
  let successCount = 0;
  for (const project of targets) {
    // Check daily limit
    if (db.dailyStats.count >= MAX_DAILY_REPLIES) {
      console.log('\n⚠️ Daily limit reached. Stopping for today.');
      break;
    }
    
    const success = await replyToProject(project);
    if (success) {
      successCount++;
      
      // Compliant delay: 70-90 seconds
      const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
      console.log(`   Waiting ${Math.round(delay/1000)}s...\n`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  console.log('=====================================');
  console.log('SUMMARY:');
  console.log(`✅ Successful replies: ${successCount}`);
  console.log(`📊 Daily total: ${db.dailyStats.count}/${MAX_DAILY_REPLIES}`);
  console.log('=====================================\n');
}

startDatabaseOutreach();
