import cron from 'cron';
import ProjectScanner from './scanner.js';
import OutreachEngine from './outreach.js';
import PriorityOutreach from './priority-outreach.js';
import CryptoPoster from './poster.js';
import TeamEngagement from './team-engage.js';
import ReportGenerator from './report.js';
import EmailScraper from './email-scraper.js';
import EmailOutreach from './email-outreach.js';
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

// Priority outreach - every 10 minutes (hot projects first)
const priorityOutreachJob = new cron.CronJob(`*/10 * * * *`, async () => {
  try {
    console.log('[Cron] Processing priority outreach (hot projects)...');
    await priorityOutreach.processPriorityQueue();
  } catch (err) {
    console.error('[Cron] Priority outreach error:', err.message);
  }
});

// Regular outreach - every 15 minutes
const outreachJob = new cron.CronJob(`*/15 * * * *`, async () => {
  try {
    console.log('[Cron] Processing regular outreach queue...');
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

// Team engagement - 3 times per day (8 AM, 2 PM, 8 PM UTC) to save API costs
const teamJob = new cron.CronJob('0 8,14,20 * * *', async () => {
  console.log('[Cron] Checking team tweets...');
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

// Mention monitoring - 3x daily (9 AM, 3 PM, 9 PM UTC) - save API costs
const mentionMonitor = new MentionMonitor();
const mentionJob = new cron.CronJob('0 9,15,21 * * *', async () => {
  console.log('[Cron] Checking mentions...');
  await mentionMonitor.checkMentions();
});

// Timeline scanning - 3x daily (10 AM, 4 PM, 10 PM UTC) - save API costs
const timelineScanner = new TimelineScanner();
const timelineJob = new cron.CronJob('0 10,16,22 * * *', async () => {
  console.log('[Cron] Scanning timeline for new projects...');
  await timelineScanner.scanTimeline();
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
mentionJob.start();
timelineJob.start();
// exchangeMonitorJob.start(); // Now part of daily scan

console.log('✅ All cron jobs started');
console.log('📅 Daily scan: 6 AM UTC (DexScreener + CoinGecko + Exchanges)');
console.log('📧 Email scraping: 7 AM UTC');
console.log('📢 Outreach: Every 15 minutes (NO DUPLICATES)');
console.log('📱 Posts: Every 3 hours (8/day)');
console.log('📊 Summary: 11 PM UTC');
console.log('👥 Team check: 3x daily (8 AM, 2 PM, 8 PM UTC)');
console.log('💬 Mentions: 3x daily (9 AM, 3 PM, 9 PM UTC) - VERIFIED ONLY');
console.log('📈 Timeline scan: 3x daily (10 AM, 4 PM, 10 PM UTC)');
console.log('📧 Report email: 11:30 PM UTC');
console.log('⚠️  DUPLICATE PROTECTION ACTIVE');
console.log('💰 API OPTIMIZED: All source scanning once daily');

// Initial run
console.log('[Init] Running initial priority outreach...');
priorityOutreach.processPriorityQueue().catch(e => console.error('[Init] Error:', e.message));


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
  mentionJob.stop();
  timelineJob.stop();
  process.exit(0);
});
