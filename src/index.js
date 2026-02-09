import cron from 'cron';
import ProjectScanner from './scanner.js';
import OutreachEngine from './outreach.js';
import PriorityOutreach from './priority-outreach.js';
import CryptoPoster from './poster.js';
import TeamEngagement from './team-engage.js';
import ReportGenerator from './report.js';
import EmailScraper from './email-scraper.js';
import EmailOutreach from './email-outreach.js';
import EmailCTA from './email-cta.js';
import ExchangeMonitor from './exchange-monitor.js';
import MentionMonitor from './mention-monitor.js';
import TimelineScanner from './timeline-scanner.js';
import { acquireLock, releaseLock } from './pid-lock.js';

// Prevent multiple instances
if (!acquireLock()) {
  console.log('❌ Another instance of Toto is already running. Exiting.');
  process.exit(1);
}

console.log('🚀 Toto BD Agent Starting...');

// Release lock on exit
process.on('SIGINT', () => {
  releaseLock();
  process.exit(0);
});
process.on('SIGTERM', () => {
  releaseLock();
  process.exit(0);
});
process.on('exit', () => {
  releaseLock();
});

const scanner = new ProjectScanner();
const outreach = new OutreachEngine();
const priorityOutreach = new PriorityOutreach();
const poster = new CryptoPoster();
const teamEng = new TeamEngagement();
const reporter = new ReportGenerator();
const emailScraper = new EmailScraper();
const exchangeMonitor = new ExchangeMonitor();

// Daily scanner - 6 AM UTC (ALL sources: DexScreener, CoinGecko, Alpha accounts, Exchanges)
const scanJob = new cron.CronJob('0 6 * * *', async () => {
  console.log('[Cron] Running FULL daily project scan (all sources)...');
  await scanner.run();
  console.log('[Cron] Scanning exchange X pages for new listings...');
  await exchangeMonitor.run();
  console.log('[Cron] Daily scan complete!');
});

// Priority outreach - every 60 minutes (CONSERVATIVE - was 20 min)
// NOTE: Reduced to avoid X API rate limits. See X_API_OPTIMIZATION_STRATEGY.md
const priorityOutreachJob = new cron.CronJob(`0 * * * *`, async () => {
  try {
    console.log('[Cron] Processing priority outreach (1 per hour - CONSERVATIVE)...');
    await priorityOutreach.processPriorityQueue();
  } catch (err) {
    console.error('[Cron] Priority outreach error:', err.message);
  }
});

// Regular outreach - every 90 minutes (CONSERVATIVE - was 15 min)
const outreachJob = new cron.CronJob(`*/90 * * * *`, async () => {
  try {
    console.log('[Cron] Processing regular outreach (1 per 90 min - CONSERVATIVE)...');
    await outreach.processQueue();
  } catch (err) {
    console.error('[Cron] Regular outreach error:', err.message);
  }
});

// Crypto posts - 8 times per day (every 3 hours)
const postJob = new cron.CronJob('0 */3 * * *', async () => {
  console.log('[Cron] Posting crypto content...');
  await poster.postDaily();
});

// Daily summary - 11 PM UTC
const summaryJob = new cron.CronJob('0 23 * * *', async () => {
  console.log('[Cron] Posting daily summary...');
  await poster.postDailySummary();
});

// Team engagement - 2 times per day (CONSERVATIVE - was 3x)
const teamJob = new cron.CronJob('0 9,21 * * *', async () => {
  console.log('[Cron] Checking team tweets (CONSERVATIVE: 2x daily)...');
  await teamEng.run();
});

// Daily report email - 11:30 PM UTC
const reportJob = new cron.CronJob('30 23 * * *', async () => {
  console.log('[Cron] Sending daily report...');
  await reporter.sendReport();
});

// Email scraping - once per day at 7 AM UTC
const emailScrapeJob = new cron.CronJob('0 7 * * *', async () => {
  console.log('[Cron] Scraping project emails...');
  await emailScraper.run();
});

// Mention monitoring - 2x daily (CONSERVATIVE - was 3x)
const mentionMonitor = new MentionMonitor();
const mentionJob = new cron.CronJob('0 10,22 * * *', async () => {
  console.log('[Cron] Checking mentions (CONSERVATIVE: 2x daily)...');
  await mentionMonitor.checkMentions();
});

// Timeline scanning - 1x daily (CONSERVATIVE - was 3x)
const timelineScanner = new TimelineScanner();
const timelineJob = new cron.CronJob('0 12 * * *', async () => {
  console.log('[Cron] Scanning timeline (CONSERVATIVE: 1x daily)...');
  await timelineScanner.scanTimeline();
});

// ============ EMAIL CTA JOBS ============

// Email CTA - Initial outreach every 2 hours
const emailCTAJob = new cron.CronJob('0 */2 * * *', async () => {
  try {
    console.log('[Cron] Processing Email CTA outreach...');
    const projects = dbQueries.getProjectsPendingOutreach.all(5);
    for (const project of projects) {
      if (project.email) {
        const result = await EmailCTA.sendEmail(project, 'initial');
        if (result.success) {
          console.log(`[EmailCTA] 📧 Sent to ${project.symbol}`);
        }
        // Wait 5 min between emails
        await new Promise(r => setTimeout(r, 5 * 60 * 1000));
      }
    }
  } catch (err) {
    console.error('[Cron] Email CTA error:', err.message);
  }
});

// Email CTA - Daily follow-ups at 10 AM UTC
const emailFollowupJob = new cron.CronJob('0 10 * * *', async () => {
  try {
    console.log('[Cron] Processing Email CTA follow-ups...');
    await EmailCTA.processFollowups();
  } catch (err) {
    console.error('[Cron] Email followup error:', err.message);
  }
});

// Exchange monitoring - DISABLED (now part of daily scan at 6 AM)
// const exchangeMonitorJob = new cron.CronJob('0 8 * * *', async () => {
//   console.log('[Cron] Monitoring exchange listings...');
//   await exchangeMonitor.run();
// });

// Start all jobs
scanJob.start();
priorityOutreachJob.start();
outreachJob.start();
postJob.start();
summaryJob.start();
teamJob.start();
reportJob.start();
emailScrapeJob.start();
emailCTAJob.start();
emailFollowupJob.start();
mentionJob.start();
timelineJob.start();
// exchangeMonitorJob.start(); // Now part of daily scan

console.log('✅ All cron jobs started (CONSERVATIVE MODE - See X_API_OPTIMIZATION_STRATEGY.md)');
console.log('📅 Daily scan: 6 AM UTC (DexScreener + CoinGecko + Exchanges)');
console.log('📧 Email scraping: 7 AM UTC');
console.log('📧 Email CTA: Every 2 hours (max 50/day)');
console.log('📧 Email Follow-ups: Daily at 10 AM UTC');
console.log('📢 Priority Outreach: Every 60 minutes (CONSERVATIVE - was 20 min)');
console.log('📢 Regular Outreach: Every 90 minutes (CONSERVATIVE - was 15 min)');
console.log('📱 Posts: Every 3 hours (8/day)');
console.log('📊 Summary: 11 PM UTC');
console.log('👥 Team check: 2x daily (CONSERVATIVE - was 3x)');
console.log('💬 Mentions: 2x daily (CONSERVATIVE - was 3x)');
console.log('📈 Timeline scan: 1x daily (CONSERVATIVE - was 3x)');
console.log('📧 Report email: 11:30 PM UTC');
console.log('⚠️  DUPLICATE PROTECTION ACTIVE');
console.log('💰 API OPTIMIZED: 75% reduction in API calls');
console.log('📧 EMAIL CTA: 50 emails/day max with 5-min intervals');
console.log('🛑 RATE LIMIT RECOVERY: Waiting 6 hours before outreach resumes');

// Initial run - DISABLED for rate limit recovery
// Will resume after 6 hour cooldown
console.log('[Init] ⏸️  Initial outreach PAUSED for rate limit recovery (6 hours)');
console.log('[Init] See X_API_OPTIMIZATION_STRATEGY.md for recovery plan');
// priorityOutreach.processPriorityQueue().catch(e => console.error('[Init] Error:', e.message));


// Keep process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Toto BD Agent...');
  scanJob.stop();
  outreachJob.stop();
  postJob.stop();
  summaryJob.stop();
  teamJob.stop();
  reportJob.stop();
  emailScrapeJob.stop();
  emailCTAJob.stop();
  emailFollowupJob.stop();
  mentionJob.stop();
  timelineJob.stop();
  process.exit(0);
});
