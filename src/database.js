import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '../data');
const dbPath = join(dataDir, 'contacts.json');

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize database structure
let db = {
  projects: [],
  outreach: [],
  posts: [],
  team_engagement: []
};

// Load existing data
if (existsSync(dbPath)) {
  try {
    db = JSON.parse(readFileSync(dbPath, 'utf8'));
  } catch (error) {
    console.error('[DB] Error loading database, starting fresh:', error.message);
  }
}

// Save database to disk
export function save() {
  try {
    writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('[DB] Error saving database:', error.message);
  }
}

// Also export as saveDb for compatibility
export { save as saveDb };

import { config } from './config.js';

export const dbQueries = {
  addProject: {
    run: (name, symbol, mcap, twitter, email, source, volume24h = 0) => {
      // Check if exists (unique on symbol + source)
      const exists = db.projects.find(p => p.symbol === symbol && p.source === source);
      if (!exists) {
        db.projects.push({
          id: db.projects.length + 1,
          name,
          symbol,
          mcap,
          twitter_username: twitter,
          email,
          source,
          volume_24h: volume24h,
          discovered_at: new Date().toISOString()
        });
        save();
      }
    }
  },

  getProjectsPendingOutreach: {
    all: (limit) => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      // Get projects contacted in last 7 days
      const recentlyContacted = new Set(
        db.outreach
          .filter(o => o.type === 'tweet_reply' && o.sent_at >= sevenDaysAgo)
          .map(o => o.project_id)
      );
      
      // Prioritize smaller trending projects (300K-100M mcap)
      return db.projects
        .filter(p => 
          p.twitter_username && 
          !recentlyContacted.has(p.id) &&
          !p.invalid_twitter &&  // Skip invalid accounts
          !p.no_recent_tweets && // Skip projects with no recent tweets
          p.mcap >= 300000 &&  // Min $300K
          p.mcap <= 100000000  // Max $100M
        )
        .sort((a, b) => {
          // Sort by volume/mcap ratio (high volume relative to size = trending)
          const scoreA = (a.volume_24h || 0) / (a.mcap || 1);
          const scoreB = (b.volume_24h || 0) / (b.mcap || 1);
          return scoreB - scoreA;
        })
        .slice(0, limit);
    }
  },

  logOutreach: {
    run: (project_id, type, content, status) => {
      // Reload database to get latest state (prevents race conditions)
      try {
        if (existsSync(dbPath)) {
          const fresh = JSON.parse(readFileSync(dbPath, 'utf8'));
          db.outreach = fresh.outreach;
        }
      } catch (e) {}
      
      // Check for recent duplicate before saving
      const recent = db.outreach.find(o => 
        o.project_id === project_id && 
        o.type === type &&
        new Date(o.sent_at) > new Date(Date.now() - (config.bd.replyInterval * 60 * 1000))
      );
      
      if (recent) {
        console.log(`[DB] BLOCKED: Duplicate outreach to project ${project_id} within 30 min`);
        return false;
      }
      
      db.outreach.push({
        id: db.outreach.length + 1,
        project_id,
        type,
        content,
        status,
        sent_at: new Date().toISOString()
      });
      save();
      return true;
    }
  },

  logPost: {
    run: (content, type, tweet_id) => {
      db.posts.push({
        id: db.posts.length + 1,
        content,
        type,
        tweet_id,
        posted_at: new Date().toISOString()
      });
      save();
    }
  },

  logTeamEngagement: {
    run: (username, tweet_id, reply_content) => {
      db.team_engagement.push({
        id: db.team_engagement.length + 1,
        username,
        tweet_id,
        reply_content,
        replied_at: new Date().toISOString()
      });
      save();
    }
  },

  getDailySummary: {
    get: () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentOutreach = db.outreach.filter(o => o.sent_at >= yesterday);
      
      const contacted = new Set(recentOutreach.map(o => o.project_id));
      
      return {
        contacted_projects: contacted.size,
        total_outreach: recentOutreach.length
      };
    }
  },

  getLast24hContacts: {
    all: () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentOutreach = db.outreach.filter(o => o.sent_at >= yesterday);
      
      const projectIds = [...new Set(recentOutreach.map(o => o.project_id))];
      
      return projectIds.map(id => db.projects.find(p => p.id === id)).filter(Boolean);
    }
  },

  updateProjectTwitter: {
    run: (projectId, username) => {
      const project = db.projects.find(p => p.id === projectId);
      if (project) {
        project.twitter_username = username;
        save();
      }
    }
  }
};

export default db;
