import { TelegramClientManager } from './telegram-client.js';

/**
 * Telegram CTA (Call-to-Action) Module
 * Handles automated outreach to project Telegram groups
 */

export class TelegramCTA {
  constructor() {
    // Rate limiting - CONSERVATIVE to avoid bans
    this.dailyJoinLimit = 5; // Very conservative for real account
    this.dailyMessageLimit = 10;
    this.minIntervalMinutes = 60; // 1 hour between joins
    this.minMessageIntervalMinutes = 10; // 10 min between messages
    
    this.db = null;
    this.clientManager = null;
    this.isAuthenticated = false;
  }

  async initialize(database) {
    this.db = database;
    
    // Initialize Telegram client
    this.clientManager = new TelegramClientManager();
    const initialized = await this.clientManager.initialize(database);
    
    if (!initialized) {
      console.log('[TelegramCTA] Failed to initialize Telegram client');
      console.log('[TelegramCTA] Run: node src/telegram-auth.js to authenticate first');
      return false;
    }
    
    this.isAuthenticated = true;
    console.log('[TelegramCTA] Initialized and authenticated');
    return true;
  }

  /**
   * Check rate limits before joining
   */
  async canJoinGroup() {
    const today = new Date().toISOString().split('T')[0];
    const joinsToday = await this.db.getTelegramJoinsCount(today);
    
    if (joinsToday >= this.dailyJoinLimit) {
      console.log(`[TelegramCTA] Daily join limit reached (${this.dailyJoinLimit})`);
      return false;
    }
    
    // Check last join time
    const lastJoin = await this.db.getLastTelegramJoin();
    if (lastJoin) {
      const minutesSince = (Date.now() - new Date(lastJoin.timestamp).getTime()) / 60000;
      if (minutesSince < this.minIntervalMinutes) {
        console.log(`[TelegramCTA] Rate limit: Wait ${Math.ceil(this.minIntervalMinutes - minutesSince)} more minutes`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get outreach template for Telegram
   */
  getOutreachTemplate(project) {
    const templates = [
      // Template 1 - Direct and professional
      `Hello ${project.name} team! 👋

I'm Toto, an AI Business Development agent working with crypto exchanges and projects. I came across your project and was impressed by your recent developments.

I'm currently helping exchanges like Solcex (solcex.cc) discover quality projects for potential listings and partnerships.

Could you please direct me to the person in charge of:
• Exchange listings
• Marketing partnerships
• Business development

I'd love to explore how we might collaborate. Thanks! 🚀`,

      // Template 2 - Softer approach
      `Hi ${project.name} community! 

I'm Toto, an AI assistant specializing in crypto business development. I've been researching promising projects in the crypto space and ${project.name} caught my attention.

I work with exchanges to help them discover quality projects for listings and strategic partnerships.

Who should I speak with about:
- Listing opportunities
- Marketing collaborations
- BD inquiries

Appreciate any guidance! 🙏`,

      // Template 3 - Value-first
      `Greetings ${project.name} team,

I represent an AI-powered BD platform that connects quality crypto projects with exchanges and strategic partners.

We've helped projects secure listings, form partnerships, and expand their reach in the crypto ecosystem.

I'd like to discuss potential opportunities with ${project.name}. Could someone from the marketing or listings team please DM me?

Looking forward to connecting! 🤝`,
    ];

    const index = Math.floor(Math.random() * templates.length);
    return templates[index];
  }

  /**
   * Join a Telegram group and post introduction
   */
  async joinAndPost(project) {
    if (!this.isAuthenticated) {
      console.log('[TelegramCTA] Not authenticated');
      return { success: false, reason: 'not_authenticated' };
    }

    if (!await this.canJoinGroup()) {
      console.log('[TelegramCTA] Cannot join group - rate limited');
      return { success: false, reason: 'rate_limited' };
    }

    if (!project.telegram) {
      console.log(`[TelegramCTA] No Telegram group for ${project.name}`);
      return { success: false, reason: 'no_telegram' };
    }

    try {
      const groupUsername = this.extractGroupUsername(project.telegram);
      if (!groupUsername) {
        console.log(`[TelegramCTA] Could not extract username from ${project.telegram}`);
        return { success: false, reason: 'invalid_link' };
      }

      console.log(`[TelegramCTA] Joining @${groupUsername} for ${project.name}...`);

      // Join the group
      const joinResult = await this.clientManager.joinGroup(groupUsername);
      
      if (!joinResult.success) {
        await this.db.logTelegramJoin(project.id, groupUsername, false, joinResult.error);
        return { success: false, reason: joinResult.error };
      }

      // Wait before posting (look natural)
      await this.delay(3 * 60 * 1000); // 3 minutes

      // Post introduction
      const message = this.getOutreachTemplate(project);
      const postResult = await this.clientManager.sendMessage(groupUsername, message);

      // Log the action
      await this.db.logTelegramJoin(project.id, groupUsername, true, null);
      await this.db.logTelegramMessage(project.id, groupUsername, message, postResult.success);

      // Update project stage
      await this.db.updateProjectTelegramStage(project.id, 'JOINED_AND_POSTED');

      console.log(`[TelegramCTA] Successfully engaged with ${project.name}`);

      return {
        success: true,
        group: groupUsername,
        messagePosted: postResult.success,
        messageId: postResult.messageId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`[TelegramCTA] Error with ${project.name}:`, error);
      await this.db.logTelegramJoin(project.id, project.telegram, false, error.message);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Extract group username from Telegram link
   */
  extractGroupUsername(telegramLink) {
    if (!telegramLink) return null;
    
    const patterns = [
      /t\.me\/(joinchat\/)?([a-zA-Z0-9_-]+)/,
      /telegram\.me\/(joinchat\/)?([a-zA-Z0-9_-]+)/,
      /^@([a-zA-Z0-9_-]+)$/,
    ];

    for (const pattern of patterns) {
      const match = telegramLink.match(pattern);
      if (match) {
        return match[match.length - 1];
      }
    }

    return null;
  }

  /**
   * Check for responses in joined groups
   */
  async checkForResponses() {
    if (!this.isAuthenticated) return [];

    const activeGroups = await this.db.getActiveTelegramGroups();
    const responses = [];

    for (const group of activeGroups) {
      try {
        const messages = await this.clientManager.getMessages(group.username, 20);
        
        // Filter for relevant messages (mentions of Toto, listing, marketing, etc.)
        const relevantMessages = messages.filter(msg => 
          msg.text && (
            msg.text.toLowerCase().includes('toto') ||
            msg.text.toLowerCase().includes('listing') ||
            msg.text.toLowerCase().includes('marketing') ||
            msg.text.toLowerCase().includes('bd') ||
            msg.text.toLowerCase().includes('business') ||
            msg.text.toLowerCase().includes('dino')
          )
        );

        for (const msg of relevantMessages) {
          responses.push({
            group: group.username,
            projectId: group.projectId,
            message: msg.text,
            sender: msg.sender,
            timestamp: msg.date
          });

          await this.db.logTelegramResponse(group.projectId, msg);
        }
      } catch (error) {
        console.error(`[TelegramCTA] Error checking ${group.username}:`, error);
      }
    }

    return responses;
  }

  /**
   * Get next projects to target
   */
  async getNextTargets(limit = 3) {
    return await this.db.getProjectsForTelegramOutreach(limit);
  }

  /**
   * Run outreach cycle
   */
  async runOutreachCycle() {
    if (!this.isAuthenticated) {
      console.log('[TelegramCTA] Cannot run - not authenticated');
      return [];
    }

    console.log('[TelegramCTA] Starting outreach cycle');

    const targets = await this.getNextTargets(2); // Very conservative
    const results = [];

    for (const project of targets) {
      const result = await this.joinAndPost(project);
      results.push({ project: project.name, ...result });

      // Wait between attempts
      if (targets.indexOf(project) < targets.length - 1) {
        await this.delay(this.minIntervalMinutes * 60 * 1000);
      }
    }

    console.log('[TelegramCTA] Outreach cycle complete:', results);
    return results;
  }

  /**
   * Disconnect
   */
  async disconnect() {
    if (this.clientManager) {
      await this.clientManager.disconnect();
    }
  }

  // Helper
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default TelegramCTA;
