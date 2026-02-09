// Rate limit tracking and compliance module for X API
// Based on X Terms of Service and API Rate Limits

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compliancePath = join(__dirname, '../data/compliance.json');

// X Official Limits
const X_LIMITS = {
  DAILY_TWEETS: 100,        // POST /2/tweets - 100 per day per user
  DAILY_REPLIES: 100,       // Included in daily tweets
  TIMELINE_LOOKUP: 900,     // per 15 min window
  USER_LOOKUP: 900,         // per 15 min window
  MIN_INTERVAL_MS: 30 * 60 * 1000,  // 30 minutes minimum between tweets
};

// Load compliance state
function loadCompliance() {
  if (existsSync(compliancePath)) {
    try {
      return JSON.parse(readFileSync(compliancePath, 'utf8'));
    } catch (e) {
      console.error('[Compliance] Error loading state:', e.message);
    }
  }
  return {
    dailyTweets: { count: 0, date: new Date().toDateString() },
    usedMessages: [],
    rateLimitErrors: [],
    lastTweetTime: 0,
    circuitBreaker: { failures: 0, lastFailure: 0, isOpen: false }
  };
}

// Save compliance state
function saveCompliance(state) {
  try {
    writeFileSync(compliancePath, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('[Compliance] Error saving state:', e.message);
  }
}

// Compliance state singleton
let complianceState = loadCompliance();

// Ensure engagement tracking exists
if (!complianceState.projectEngagements) {
  complianceState.projectEngagements = {};
  saveCompliance(complianceState);
}

export const ComplianceTracker = {
  // Check if we can send a tweet today
  canTweet() {
    const today = new Date().toDateString();
    
    // Reset for new day
    if (complianceState.dailyTweets.date !== today) {
      complianceState.dailyTweets = { count: 0, date: today };
      complianceState.usedMessages = []; // Clear used messages daily
      complianceState.rateLimitErrors = [];
      saveCompliance(complianceState);
    }
    
    // Check daily limit (leave 10 buffer for safety)
    if (complianceState.dailyTweets.count >= X_LIMITS.DAILY_TWEETS - 10) {
      console.warn(`[Compliance] ⚠️  Daily limit approaching: ${complianceState.dailyTweets.count}/${X_LIMITS.DAILY_TWEETS}`);
      return false;
    }
    
    // Check minimum interval
    const timeSinceLast = Date.now() - complianceState.lastTweetTime;
    if (timeSinceLast < X_LIMITS.MIN_INTERVAL_MS) {
      const wait = Math.ceil((X_LIMITS.MIN_INTERVAL_MS - timeSinceLast) / 60000);
      console.warn(`[Compliance] ⏳ Must wait ${wait} more minutes`);
      return false;
    }
    
    // Check circuit breaker
    if (complianceState.circuitBreaker.isOpen) {
      const timeSinceFailure = Date.now() - complianceState.circuitBreaker.lastFailure;
      if (timeSinceFailure < 60 * 60 * 1000) { // 1 hour
        console.error('[Compliance] 🚨 Circuit breaker OPEN - outreach paused');
        return false;
      } else {
        // Reset circuit breaker after 1 hour
        complianceState.circuitBreaker.isOpen = false;
        complianceState.circuitBreaker.failures = 0;
        saveCompliance(complianceState);
      }
    }
    
    return true;
  },
  
  // Record a successful tweet
  recordTweet(content) {
    complianceState.dailyTweets.count++;
    complianceState.lastTweetTime = Date.now();
    complianceState.usedMessages.push(content);
    saveCompliance(complianceState);
    
    console.log(`[Compliance] ✅ Tweet recorded (${complianceState.dailyTweets.count}/${X_LIMITS.DAILY_TWEETS})`);
  },
  
  // Record a failure
  recordFailure(error) {
    complianceState.circuitBreaker.failures++;
    complianceState.circuitBreaker.lastFailure = Date.now();
    
    // Track rate limit errors
    if (error.code === 429) {
      complianceState.rateLimitErrors.push({
        time: Date.now(),
        resetTime: error.headers?.['x-rate-limit-reset']
      });
    }
    
    // Open circuit breaker on 5 failures
    if (complianceState.circuitBreaker.failures >= 5) {
      complianceState.circuitBreaker.isOpen = true;
      console.error('[Compliance] 🚨 CIRCUIT BREAKER TRIGGERED - Stopping outreach for 1 hour');
    }
    
    saveCompliance(complianceState);
  },
  
  // Get random interval between min and max
  getRandomInterval() {
    const min = 30 * 60 * 1000; // 30 min
    const max = 90 * 60 * 1000; // 90 min
    return Math.floor(Math.random() * (max - min + 1) + min);
  },
  
  // Generate unique message (no repetition)
  generateUniqueMessage(project, type = 'reply') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    // Templates with placeholders for uniqueness
    const templates = [
      `Love what ${project.name} is building with $${project.symbol}! 💎 [${random}]`,
      `Bullish on $${project.symbol} - ${project.name} has serious potential 🚀 [${random}]`,
      `Impressed by $${project.symbol}! ${project.name} knows what they are doing 📈 [${random}]`,
      `The $${project.symbol} community is fire! ${project.name} is onto something ⚡ [${random}]`,
      `${project.name} ($${project.symbol}) has that special sauce 👀 [${random}]`,
      `Respect the grind from $${project.symbol} ${project.name} 💪 [${random}]`,
    ];
    
    const baseMessage = templates[Math.floor(Math.random() * templates.length)];
    
    // Ensure uniqueness by checking against used messages
    if (complianceState.usedMessages.includes(baseMessage)) {
      // If somehow duplicate, add timestamp to make unique
      return `${baseMessage} ${timestamp}`;
    }
    
    return baseMessage;
  },
  
  // Get current stats
  getStats() {
    return {
      tweetsToday: complianceState.dailyTweets.count,
      limit: X_LIMITS.DAILY_TWEETS,
      remaining: X_LIMITS.DAILY_TWEETS - complianceState.dailyTweets.count,
      lastTweet: new Date(complianceState.lastTweetTime).toISOString(),
      failures: complianceState.circuitBreaker.failures,
      circuitOpen: complianceState.circuitBreaker.isOpen,
      uniqueMessages: complianceState.usedMessages.length
    };
  },
  
  // Wait for next available slot
  async waitForNextSlot() {
    const timeSinceLast = Date.now() - complianceState.lastTweetTime;
    const waitTime = Math.max(0, X_LIMITS.MIN_INTERVAL_MS - timeSinceLast);
    
    if (waitTime > 0) {
      console.log(`[Compliance] ⏳ Waiting ${Math.ceil(waitTime/1000)}s for next slot...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  },
  
  // ========== DELAYED LINK STRATEGY ==========
  // Stage-based engagement: organic → warm → pitch
  
  ENGAGEMENT_STAGES: {
    ORGANIC: 0,      // Pure engagement, no pitch
    WARM: 1,         // Soft mention of collaboration
    PITCH: 2,        // Include bio/landing page reference
    COMPLETED: 3     // Already sent pitch, don't contact again
  },
  
  // Get or create project engagement tracking
  getProjectEngagement(projectId) {
    if (!complianceState.projectEngagements[projectId]) {
      complianceState.projectEngagements[projectId] = {
        stage: this.ENGAGEMENT_STAGES.ORGANIC,
        interactions: [],
        lastContact: null,
        pitchSent: false
      };
      saveCompliance(complianceState);
    }
    return complianceState.projectEngagements[projectId];
  },
  
  // Record an interaction with a project
  recordInteraction(projectId, message, type = 'reply') {
    const engagement = this.getProjectEngagement(projectId);
    
    engagement.interactions.push({
      timestamp: Date.now(),
      message: message,
      type: type,
      stage: engagement.stage
    });
    
    engagement.lastContact = Date.now();
    
    // Advance stage based on interaction count
    const interactionCount = engagement.interactions.length;
    
    if (interactionCount >= 3 && engagement.stage === this.ENGAGEMENT_STAGES.ORGANIC) {
      engagement.stage = this.ENGAGEMENT_STAGES.WARM;
      console.log(`[Engagement] Project ${projectId} advanced to WARM stage`);
    }
    
    if (interactionCount >= 5 && engagement.stage === this.ENGAGEMENT_STAGES.WARM) {
      engagement.stage = this.ENGAGEMENT_STAGES.PITCH;
      console.log(`[Engagement] Project ${projectId} advanced to PITCH stage`);
    }
    
    saveCompliance(complianceState);
    return engagement;
  },
  
  // Get message for current stage
  getStageMessage(project, engagement) {
    const random = Math.random().toString(36).substring(2, 6);
    
    switch (engagement.stage) {
      case this.ENGAGEMENT_STAGES.ORGANIC:
        // Pure organic engagement
        const organicTemplates = [
          `Love what ${project.name} is building with $${project.symbol}! 💎`,
          `Bullish on $${project.symbol} - ${project.name} has serious potential 🚀`,
          `Impressed by $${project.symbol}! ${project.name} knows what they're doing 📈`,
          `The $${project.symbol} community is fire! ${project.name} is onto something ⚡`,
        ];
        return organicTemplates[Math.floor(Math.random() * organicTemplates.length)];
        
      case this.ENGAGEMENT_STAGES.WARM:
        // Soft mention of collaboration interest
        const warmTemplates = [
          `Would love to see more collaborations for $${project.symbol}. ${project.name} deserves more visibility 🤝`,
          `$${project.symbol} could benefit from strategic partnerships. Keep building! 💪`,
          `${project.name} ($${project.symbol}) has partnership potential. Watching closely 👀`,
        ];
        return warmTemplates[Math.floor(Math.random() * warmTemplates.length)];
        
      case this.ENGAGEMENT_STAGES.PITCH:
        // Include soft CTA to check bio
        const pitchTemplates = [
          `Would love to discuss how we could work together ${project.name}. Check my bio for details 🤝`,
          `Interested in exploring opportunities with $${project.symbol}. DM me or check bio link 📩`,
          `${project.name} - let's talk! See my bio for how we can collaborate 💼`,
        ];
        engagement.pitchSent = true;
        engagement.stage = this.ENGAGEMENT_STAGES.COMPLETED;
        saveCompliance(complianceState);
        return pitchTemplates[Math.floor(Math.random() * pitchTemplates.length)];
        
      case this.ENGAGEMENT_STAGES.COMPLETED:
        // Don't contact again
        return null;
        
      default:
        return `Love what ${project.name} is building! 💎`;
    }
  },
  
  // Check if we should engage with this project
  shouldEngage(projectId) {
    const engagement = this.getProjectEngagement(projectId);
    
    // Don't engage if pitch already sent
    if (engagement.stage === this.ENGAGEMENT_STAGES.COMPLETED) {
      return false;
    }
    
    // Don't engage more than once per day
    if (engagement.lastContact) {
      const hoursSinceLast = (Date.now() - engagement.lastContact) / (1000 * 60 * 60);
      if (hoursSinceLast < 24) {
        return false;
      }
    }
    
    return true;
  },
  
  // Get engagement stats for reporting
  getEngagementStats() {
    const engagements = Object.values(complianceState.projectEngagements);
    return {
      total: engagements.length,
      organic: engagements.filter(e => e.stage === this.ENGAGEMENT_STAGES.ORGANIC).length,
      warm: engagements.filter(e => e.stage === this.ENGAGEMENT_STAGES.WARM).length,
      pitch: engagements.filter(e => e.stage === this.ENGAGEMENT_STAGES.PITCH).length,
      completed: engagements.filter(e => e.stage === this.ENGAGEMENT_STAGES.COMPLETED).length
    };
  }
};

export default ComplianceTracker;
