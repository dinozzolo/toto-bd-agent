import axios from 'axios';
import * as cheerio from 'cheerio';
import db, { saveDb } from './database.js';
import { client } from './twitter-client.js';

class EmailScraper {
  constructor() {
    this.delay = ms => new Promise(r => setTimeout(r, ms));
  }

  async run() {
    console.log('[EmailScraper] 🔍 Starting email collection...');
    
    // Only scan projects not yet checked (email_checked flag)
    const projectsWithoutEmail = db.projects.filter(p => !p.email && !p.email_checked);
    
    console.log(`[EmailScraper] Found ${projectsWithoutEmail.length} projects to scan`);
    
    let found = 0;
    for (const project of projectsWithoutEmail) {
      try {
        const email = await this.findEmail(project);
        if (email) {
          project.email = email.address;
          project.email_source = email.source;
          found++;
          console.log(`[EmailScraper] ✅ ${project.symbol}: ${email.address}`);
        }
        // Mark as checked so we don't scan again
        project.email_checked = true;
        saveDb();
        await this.delay(2000); // Rate limiting
      } catch (error) {
        console.error(`[EmailScraper] ❌ ${project.symbol}:`, error.message);
      }
    }
    
    console.log(`[EmailScraper] Complete! Found ${found} new emails`);
    return found;
  }

  async findEmail(project) {
    // 1. Check Twitter bio
    const twitterEmail = await this.checkTwitterBio(project.twitter_username);
    if (twitterEmail) return { address: twitterEmail, source: 'twitter_bio' };
    
    // 2. Check CoinGecko API
    if (project.source === 'coingecko' || project.coingecko_id) {
      const cgEmail = await this.checkCoinGecko(project.coingecko_id || project.symbol);
      if (cgEmail) return { address: cgEmail, source: 'coingecko' };
    }
    
    // 3. Scrape website if available
    if (project.website) {
      const websiteEmail = await this.scrapeWebsite(project.website);
      if (websiteEmail) return { address: websiteEmail, source: 'website' };
    }
    
    return null;
  }

  async checkTwitterBio(username) {
    try {
      const user = await client.v2.userByUsername(username, {
        'user.fields': ['description', 'url']
      });
      
      const bio = user.data.description || '';
      const url = user.data.url || '';
      
      // Extract email from bio
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const bioMatch = bio.match(emailRegex);
      if (bioMatch) return bioMatch[0];
      
      // Check expanded URL
      if (url) {
        const websiteEmail = await this.scrapeWebsite(url);
        if (websiteEmail) return websiteEmail;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async checkCoinGecko(symbol) {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}`,
        { timeout: 10000 }
      );
      
      const coin = response.data;
      
      // Check official links
      const links = coin.links || {};
      const homepage = links.homepage?.[0];
      
      if (homepage) {
        const websiteEmail = await this.scrapeWebsite(homepage);
        if (websiteEmail) return websiteEmail;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async scrapeWebsite(url) {
    try {
      if (!url.startsWith('http')) url = 'https://' + url;
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TotoBot/1.0; +https://solcex.cc)'
        }
      });
      
      const $ = cheerio.load(response.data);
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      
      // Check contact page
      const contactLinks = $('a[href*="contact"], a[href*="about"]').map((i, el) => $(el).attr('href')).get();
      
      for (const link of contactLinks.slice(0, 2)) {
        try {
          const contactUrl = link.startsWith('http') ? link : new URL(link, url).href;
          const contactResponse = await axios.get(contactUrl, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; TotoBot/1.0)'
            }
          });
          
          const contactHtml = contactResponse.data;
          const match = contactHtml.match(emailRegex);
          if (match) return match[0];
        } catch (e) {}
      }
      
      // Check main page
      const mainMatch = response.data.match(emailRegex);
      if (mainMatch) return mainMatch[0];
      
      return null;
    } catch (error) {
      return null;
    }
  }
}

export default EmailScraper;
