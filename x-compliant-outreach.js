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
let db = { projects: [], outreach: [] };
if (existsSync(dbPath)) {
  db = JSON.parse(readFileSync(dbPath, 'utf8'));
}

// CTA Messages (unique, compliant)
const ctaMessages = [
  "Love what you are building! 🚀 Toto - AI BD Agent for crypto exchanges. Interested in a Solcex listing? Let us chat!",
  "Impressive project! 🤖 Toto helps crypto projects get listed on exchanges. Want to explore opportunities?",
  "Great work! 💪 Toto automates BD for crypto projects. Interested in exchange partnerships? Let us connect!",
  "Awesome progress! 🎯 Toto - the first AI BD Agent for crypto. Want to discuss listing opportunities?",
  "Solid fundamentals! 📈 Toto connects projects with exchanges. Interested in exploring?"
];

async function replyToProject(project) {
  if (!project.twitter_username) return false;
  
  try {
    // Check if already contacted recently
    const recentlyContacted = db.outreach?.some(o => 
      o.project_id === project.id && 
      o.type === 'tweet_reply' &&
      new Date(o.sent_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    if (recentlyContacted) {
      console.log(`⏭️ Skip ${project.name} - contacted recently`);
      return false;
    }
    
    // Get latest tweet from project
    const user = await client.v2.userByUsername(project.twitter_username);
    if (!user.data) {
      console.log(`⏭️ Skip ${project.name} - user not found`);
      return false;
    }
    
    const tweets = await client.v2.userTimeline(user.data.id, { max_results: 5 });
    if (!tweets.data?.data?.length) {
      console.log(`⏭️ Skip ${project.name} - no recent tweets`);
      return false;
    }
    
    // Pick random CTA message
    const message = ctaMessages[Math.floor(Math.random() * ctaMessages.length)];
    const latestTweet = tweets.data.data[0];
    
    // Post reply
    const reply = await client.v2.reply(message, latestTweet.id);
    console.log(`✅ Replied to ${project.name} (@${project.twitter_username})`);
    
    // Log outreach
    db.outreach = db.outreach || [];
    db.outreach.push({
      project_id: project.id,
      type: 'tweet_reply',
      sent_at: new Date().toISOString(),
      tweet_id: reply.data.id,
      message: message
    });
    writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    return true;
    
  } catch (err) {
    console.error(`❌ Error with ${project.name}:`, err.message);
    return false;
  }
}

async function startOutreach() {
  console.log('=== STARTING COMPLIANT X OUTREACH ===\n');
  
  // Get projects with twitter usernames
  const targets = db.projects.filter(p => 
    p.twitter_username && 
    p.mcap >= 300000 && 
    p.mcap <= 100000000
  ).slice(0, 3); // Max 3 per run to stay compliant
  
  console.log(`Found ${targets.length} targets\n`);
  
  let successCount = 0;
  for (const project of targets) {
    const success = await replyToProject(project);
    if (success) successCount++;
    
    // Wait 60-90 seconds between replies (compliant)
    const delay = 60000 + Math.random() * 30000;
    console.log(`Waiting ${Math.round(delay/1000)}s...\n`);
    await new Promise(r => setTimeout(r, delay));
  }
  
  console.log(`\n=== COMPLETE: ${successCount}/${targets.length} successful replies ===`);
}

startOutreach();
