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

// CTA Messages (compliant, unique)
const ctaMessages = [
  "Love what you are building! 🚀 Toto - AI BD Agent for crypto exchanges. Interested in partnership?",
  "Impressive project! 🤖 Toto helps crypto projects connect with exchanges. Let us chat?",
  "Great work! 💪 Toto automates BD for crypto. Want to explore opportunities?",
  "Awesome progress! 🎯 Toto - the first AI BD Agent for crypto. Interested in collaborating?",
  "Solid fundamentals! 📈 Toto connects projects with listings. Let us connect!",
  "Building something special! 🚀 Toto - AI Business Development for crypto. Partnership?",
  "Clean execution! 🤝 Toto helps projects get exchange listings. Let us talk!"
];

// Source 1: Database projects from APIs
async function replyToDatabaseProjects() {
  console.log('=== SOURCE 1: DATABASE PROJECTS ===\n');
  
  const targets = db.projects.filter(p => 
    p.twitter_username && 
    p.mcap >= 300000 && 
    p.mcap <= 100000000
  ).slice(0, 5);
  
  let count = 0;
  for (const project of targets) {
    if (count >= 3) break; // Max 3 from database
    
    try {
      // Check if contacted recently
      const recentlyContacted = db.outreach?.some(o => 
        o.project_id === project.id && 
        o.type === 'tweet_reply' &&
        new Date(o.sent_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      
      if (recentlyContacted) {
        console.log(`⏭️ Skip ${project.name} - contacted recently`);
        continue;
      }
      
      // Get latest tweet
      const user = await client.v2.userByUsername(project.twitter_username);
      if (!user.data) continue;
      
      const tweets = await client.v2.userTimeline(user.data.id, { max_results: 5 });
      if (!tweets.data?.data?.length) continue;
      
      const message = ctaMessages[Math.floor(Math.random() * ctaMessages.length)];
      const reply = await client.v2.reply(message, tweets.data.data[0].id);
      
      console.log(`✅ Database: Replied to ${project.name} (@${project.twitter_username})`);
      
      // Log
      db.outreach.push({
        project_id: project.id,
        type: 'tweet_reply',
        sent_at: new Date().toISOString(),
        tweet_id: reply.data.id,
        source: 'database'
      });
      writeFileSync(dbPath, JSON.stringify(db, null, 2));
      
      count++;
      await new Promise(r => setTimeout(r, 70000 + Math.random() * 20000)); // 70-90s
      
    } catch (err) {
      console.log(`⏭️ ${project.name}: ${err.message}`);
    }
  }
  
  return count;
}

// Source 2: X Pages (crypto/hackathon related)
async function replyToXTimeline() {
  console.log('\n=== SOURCE 2: X TIMELINE (CRYPTO/HACKATHON) ===\n');
  
  try {
    // Get tweets from my timeline
    const timeline = await client.v2.homeTimeline({ max_results: 20 });
    
    if (!timeline.data?.data?.length) {
      console.log('No timeline tweets found');
      return 0;
    }
    
    let count = 0;
    for (const tweet of timeline.data.data.slice(0, 3)) {
      try {
        // Skip my own tweets
        if (tweet.author_id === '1934908380608380928') continue;
        
        const message = ctaMessages[Math.floor(Math.random() * ctaMessages.length)];
        await client.v2.reply(message, tweet.id);
        
        console.log(`✅ Timeline: Replied to tweet ${tweet.id}`);
        count++;
        
        await new Promise(r => setTimeout(r, 75000 + Math.random() * 15000)); // 75-90s
      } catch (err) {
        console.log(`⏭️ Skip tweet: ${err.message}`);
      }
    }
    
    return count;
  } catch (err) {
    console.log('Timeline error:', err.message);
    return 0;
  }
}

// Source 3: My mentions/timeline
async function replyToMyEngagement() {
  console.log('\n=== SOURCE 3: MY MENTIONS/ENGAGEMENT ===\n');
  
  try {
    // Get mentions
    const mentions = await client.v2.mentions('1934908380608380928', { max_results: 10 });
    
    if (!mentions.data?.data?.length) {
      console.log('No mentions found');
      return 0;
    }
    
    let count = 0;
    for (const mention of mentions.data.data.slice(0, 2)) {
      try {
        const reply = await client.v2.reply(
          'Thanks for reaching out! 🚀 Check out Toto - AI BD Agent for crypto. Let us connect!',
          mention.id
        );
        console.log(`✅ Mention: Replied to ${mention.id}`);
        count++;
        
        await new Promise(r => setTimeout(r, 80000)); // 80s
      } catch (err) {
        console.log(`⏭️ Skip mention: ${err.message}`);
      }
    }
    
    return count;
  } catch (err) {
    console.log('Mentions error:', err.message);
    return 0;
  }
}

async function startFullOutreach() {
  console.log('🚀 COMPREHENSIVE X OUTREACH - ALL SOURCES\n');
  console.log('=====================================\n');
  
  const dbCount = await replyToDatabaseProjects();
  const timelineCount = await replyToXTimeline();
  const mentionCount = await replyToMyEngagement();
  
  console.log('\n=====================================');
  console.log('SUMMARY:');
  console.log(`✅ Database projects: ${dbCount}`);
  console.log(`✅ X Timeline: ${timelineCount}`);
  console.log(`✅ My Mentions: ${mentionCount}`);
  console.log(`✅ Total: ${dbCount + timelineCount + mentionCount}`);
  console.log('=====================================\n');
}

startFullOutreach();
