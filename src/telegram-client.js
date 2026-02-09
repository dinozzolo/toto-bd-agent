import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Telegram Client for Toto BD Agent
 * Handles MTProto authentication and messaging
 */

export class TelegramClientManager {
  constructor() {
    this.apiId = parseInt(process.env.TELEGRAM_API_ID);
    this.apiHash = process.env.TELEGRAM_API_HASH;
    this.phoneNumber = process.env.TELEGRAM_PHONE;
    this.sessionPath = path.join(__dirname, '../data/telegram-session.json');
    this.client = null;
    this.db = null;
  }

  async initialize(database) {
    this.db = database;
    
    if (!this.apiId || !this.apiHash || !this.phoneNumber) {
      console.log('[Telegram] Missing credentials. Set TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_PHONE in .env.credentials');
      return false;
    }

    console.log('[Telegram] Initializing client...');
    
    // Load existing session or create new
    let sessionString = '';
    if (fs.existsSync(this.sessionPath)) {
      try {
        const sessionData = JSON.parse(fs.readFileSync(this.sessionPath, 'utf8'));
        sessionString = sessionData.session || '';
        console.log('[Telegram] Loaded existing session');
      } catch (e) {
        console.log('[Telegram] Could not load session, will create new');
      }
    }

    const session = new StringSession(sessionString);
    
    this.client = new TelegramClient(session, this.apiId, this.apiHash, {
      connectionRetries: 5,
    });

    try {
      await this.client.start({
        phoneNumber: this.phoneNumber,
        password: async () => await input.text('Enter your 2FA password (if any): '),
        phoneCode: async () => {
          console.log('[Telegram] Verification code sent to your phone!');
          console.log('[Telegram] Please provide the code when prompted...');
          return await input.text('Enter the code you received: ');
        },
        onError: (err) => console.log('[Telegram] Error:', err),
      });

      console.log('[Telegram] Successfully authenticated!');
      
      // Save session for future use
      const savedSessionString = this.client.session.save();
      fs.writeFileSync(this.sessionPath, JSON.stringify({ session: savedSessionString }, null, 2));
      console.log('[Telegram] Session saved');
      
      return true;
    } catch (error) {
      console.error('[Telegram] Authentication failed:', error.message);
      console.log('[Telegram] Please run: node src/telegram-auth.js to authenticate manually first');
      return false;
    }
  }

  /**
   * Join a Telegram group/channel
   */
  async joinGroup(groupUsername) {
    if (!this.client) {
      console.log('[Telegram] Client not initialized');
      return { success: false, error: 'not_initialized' };
    }

    try {
      const username = groupUsername.replace('@', '').trim();
      
      console.log(`[Telegram] Attempting to join @${username}...`);
      
      const result = await this.client.invoke(
        new Api.channels.JoinChannel({
          channel: username,
        })
      );

      console.log(`[Telegram] Successfully joined @${username}`);
      return { success: true, result };
    } catch (error) {
      console.error(`[Telegram] Failed to join @${groupUsername}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a message to a group
   */
  async sendMessage(groupUsername, message) {
    if (!this.client) {
      console.log('[Telegram] Client not initialized');
      return { success: false, error: 'not_initialized' };
    }

    try {
      const username = groupUsername.replace('@', '').trim();
      
      console.log(`[Telegram] Sending message to @${username}...`);
      
      const result = await this.client.sendMessage(username, {
        message: message,
      });

      console.log(`[Telegram] Message sent successfully`);
      return { 
        success: true, 
        messageId: result.id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[Telegram] Failed to send message:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get messages from a group
   */
  async getMessages(groupUsername, limit = 50) {
    if (!this.client) {
      console.log('[Telegram] Client not initialized');
      return [];
    }

    try {
      const username = groupUsername.replace('@', '').trim();
      
      const messages = await this.client.getMessages(username, {
        limit: limit,
      });

      return messages.map(msg => ({
        id: msg.id,
        text: msg.message,
        sender: msg.senderId,
        date: msg.date,
        isReply: msg.replyTo ? true : false,
        replyTo: msg.replyTo?.replyToMsgId,
      }));
    } catch (error) {
      console.error(`[Telegram] Failed to get messages:`, error.message);
      return [];
    }
  }

  /**
   * Check if we're already in a group
   */
  async isInGroup(groupUsername) {
    if (!this.client) return false;

    try {
      const username = groupUsername.replace('@', '').trim();
      await this.client.getEntity(username);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Disconnect client
   */
  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      console.log('[Telegram] Disconnected');
    }
  }
}

export default TelegramClientManager;
