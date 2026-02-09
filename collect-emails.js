import axios from 'axios';
import * as cheerio from 'cheerio';
import { readFileSync, existsSync, writeFileSync } from 'fs';

const dbPath = './data/contacts.json';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function loadDb() {
  return JSON.parse(readFileSync(dbPath, 'utf8'));
}

function saveDb(db) {
  writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

async function scrapEmails() {
  const db = await loadDb();
  let found = 0;
  const projects = db.projects.filter(p => !p.email && p.twitter_username);
  
  console.log(`🔍 Scanning ${projects.length} projects for emails...\n`);
  
  for (const project of projects.slice(0, 50)) { // Process 50 at a time
    try {
      // 1. Check CoinGecko for links
      if (project.source === 'coingecko' || !project.website) {
        try {
          const resp = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${project.name.toLowerCase().replace(/\s+/g, '-')}`,
            { timeout: 5000 }
          );
          const links = resp.data?.links;
          if (links?.homepage?.[0]) {
            project.website = links.homepage[0];
          }
          // Check for social links with emails
          if (links?.official_forum_url) {
            for (const url of links.official_forum_url) {
              const match = url?.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
              if (match) {
                project.email = match[0];
                project.email_source = 'coingecko_forum';
              }
            }
          }
        } catch (e) {}
      }
      
      // 2. Scrape website for email
      if (project.website && !project.email) {
        try {
          const resp = await axios.get(project.website, { 
            timeout: 8000,
            maxRedirects: 3
          });
          const $ = cheerio.load(resp.data);
          
          // Look for email in contact/about pages
          const links = $('a[href^="mailto:"]').attr('href');
          if (links) {
            project.email = links.replace('mailto:', '').split('?')[0];
            project.email_source = 'website_mailto';
          }
          
          // Search in text
          const text = $('body').text();
          const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
          if (emailMatch && !project.email) {
            project.email = emailMatch[0];
            project.email_source = 'website_text';
          }
        } catch (e) {}
      }
      
      // 3. Check Twitter bio
      if (!project.email && project.twitter_username) {
        // Will need Twitter API for this - skip for now
      }
      
      if (project.email) {
        found++;
        console.log(`✅ ${project.symbol}: ${project.email} (${project.email_source})`);
        
        // Save immediately
        const idx = db.projects.findIndex(p => p.id === project.id);
        if (idx >= 0) {
          db.projects[idx] = project;
          saveDb(db);
        }
      }
      
      await sleep(1000); // Rate limit
      
    } catch (error) {
      console.log(`❌ ${project.symbol}: ${error.message}`);
    }
  }
  
  console.log(`\n🎉 Found ${found} new emails!`);
  return found;
}

scrapEmails().then(count => {
  console.log(`\nTotal emails in database: ${count}`);
  process.exit(0);
});
