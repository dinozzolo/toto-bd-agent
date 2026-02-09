import EmailScraper from './src/email-scraper.js';

const scraper = new EmailScraper();
scraper.run().then(count => {
  console.log(`\n🎉 Email scraping complete! Found ${count} emails`);
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
