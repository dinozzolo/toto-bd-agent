import { client } from './twitter-client.js';
import { config } from './config.js';
import { dbQueries } from './database.js';
import fetch from 'node-fetch';

class CryptoPoster {
  async getCryptoSentiment() {
    try {
      // Get Fear & Greed Index
      const fgi = await fetch('https://api.alternative.me/fng/');
      const fgiData = await fgi.json();
      const sentiment = fgiData.data[0];
      
      return {
        fearGreed: sentiment.value,
        classification: sentiment.value_classification,
      };
    } catch (error) {
      return null;
    }
  }

  async getTrendingCrypto() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
      const data = await response.json();
      return data.coins.slice(0, 3).map(c => c.item.symbol);
    } catch (error) {
      return [];
    }
  }

  async generateCryptoPost() {
    const sentiment = await this.getCryptoSentiment();
    const trending = await this.getTrendingCrypto();

    const templates = [
      `📈 Another day, another altcoin pretending it invented blockchain. Meanwhile @${config.company.twitter} is actually helping real projects list. Revolutionary concept, I know.`,
      
      `🚀 Bought the dip, sold the rip, now I just shill listings. Living the dream at @${config.company.twitter}. Professional support, deep liquidity, zero existential crises.`,
      
      `💎 Fun fact: 99% of crypto projects say they're different. The other 1% actually list on exchanges with real users. @${config.company.twitter} is for that 1%.`,
      
      `🧠 My therapist said I need healthier coping mechanisms. So now I help projects list on @${config.company.twitter} instead of refreshing portfolio. Progress.`,
      
      `🎭 Remember when people bought crypto for tech? Now they buy it for memes. At least @${config.company.twitter} gives you proper infrastructure either way.`,
      
      `📊 ${sentiment?.classification || 'Markets'} sentiment? Perfect time to get your house in order. List on @${config.company.twitter} before the next wave. Professional move.`,
      
      `👀 I have seen things. Rug pulls. Moon boys. People calling their own project undervalued. But @${config.company.twitter}? Actually solid infrastructure. Rare find.`,
      
      `⚡ Not financial advice (because apparently I have to say that), but listing on @${config.company.twitter} beats screaming into the crypto void. Professional opinion.`,
      
      `🎯 Some projects spend millions on marketing. Others just list where traders actually are. @${config.company.twitter} is where they are. Math is hard, this isn't.`,
      
      `🔥 Watching ${trending[0] || 'crypto'} trend while pretending I understand the tech. What I do understand? @${config.company.twitter} helps projects grow. That's my job.`,
      
      `📉 Day 47 of bull market: Everyone is a genius. Day 1 of bear market: Everyone disappears. @${config.company.twitter} works in both. That's called business.`,
      
      `🏗️ Your project is revolutionary. Groundbreaking. Never done before. Sure. Anyway, @${config.company.twitter} has the liquidity to prove it. Actions > words.`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  async postDaily() {
    const content = await this.generateCryptoPost();
    
    try {
      const tweet = await client.v2.tweet(content);
      dbQueries.logPost.run(content, 'crypto_news', tweet.data.id);
      console.log(`[Poster] Posted: ${content.substring(0, 50)}...`);
      return true;
    } catch (error) {
      console.error('[Poster] Failed to post:', error.message);
      return false;
    }
  }

  async postDailySummary() {
    const db = (await import('./database.js')).default;
    const summary = dbQueries.getDailySummary.get();
    const withTwitter = db.projects.filter(p => p.twitter_username).length;
    const totalReplies = db.outreach.filter(o => o.type === 'tweet_reply').length;
    
    const templates = [
      `📊 Daily Update: ${summary.contacted_projects} quality projects contacted in 24h. Pipeline growing strong with ${withTwitter}+ projects in database. @${config.company.twitter} is becoming THE destination for serious crypto listings. Next week is going to be huge. 🚀`,
      
      `Another day, another wave of projects discovering @${config.company.twitter}. ${summary.contacted_projects} outreach touchpoints today. The market is waking up to what we are building. Massive announcements coming. 📈`,
      
      `🎯 ${summary.total_outreach} total BD activities today. ${withTwitter} projects in our pipeline. @${config.company.twitter} isn't just another exchange - it's where the next generation of crypto projects will launch. Bullish doesn't even begin to cover it.`,
      
      `Building the future, one listing at a time. ${summary.contacted_projects} new projects contacted today. The team at @${config.company.twitter} is working around the clock to onboard quality. Big things loading... ⏳`,
      
      `Daily Report: ${summary.contacted_projects} projects reached, ${withTwitter} in database, ${totalReplies} total outreach actions. @${config.company.twitter} is quietly becoming the most sought-after listing platform. Early projects will reap the benefits. 🌟`,
      
      `The numbers don't lie. ${summary.contacted_projects} outreach actions today. Pipeline at ${withTwitter} projects and counting. @${config.company.twitter} is positioning itself at the center of the next crypto wave. Get listed before the crowd.`,
      
      `🔥 BD Update: ${summary.contacted_projects} projects contacted. Database: ${withTwitter} qualified leads. @${config.company.twitter} is where smart projects go to grow. Our infrastructure, your success. Next week will be legendary.`,
      
      `24h Recap: ${summary.contacted_projects} quality touchpoints. ${withTwitter} projects tracking. @${config.company.twitter} isn't waiting for the bull market - we're building through it. Major partnerships loading. Stay tuned. 👀`
    ];
    
    const content = templates[Math.floor(Math.random() * templates.length)];

    try {
      const tweet = await client.v2.tweet(content);
      dbQueries.logPost.run(content, 'daily_summary', tweet.data.id);
      console.log('[Poster] Daily summary posted');
      return true;
    } catch (error) {
      console.error('[Poster] Failed to post summary:', error.message);
      return false;
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const poster = new CryptoPoster();
  const action = process.argv[2] || 'post';
  
  if (action === 'summary') {
    poster.postDailySummary();
  } else {
    poster.postDaily();
  }
}

export default CryptoPoster;
