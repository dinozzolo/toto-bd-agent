// Email CTA Strategy Module
// Complements X outreach with email follow-ups

import nodemailer from 'nodemailer';
import { config } from './config.js';
import db from './database.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const emailStatePath = join(__dirname, '../data/email-state.json');

// Email SMTP Configuration (PrivateEmail.com / Namecheap)
// Supports both port 465 (SSL) and 587 (TLS)
const SMTP_PORT = parseInt(config.email.port) || 465;
const USE_SSL = SMTP_PORT === 465;

const transporter = nodemailer.createTransport({
  host: config.email.host || 'mail.privateemail.com',
  port: SMTP_PORT,
  secure: USE_SSL, // true for port 465 (SSL), false for port 587 (TLS)
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates if needed
    ciphers: 'SSLv3'
  },
  debug: true, // Enable debug output
  logger: true  // Log to console
});

// Email sending limits (to avoid spam filters)
const EMAIL_LIMITS = {
  DAILY_MAX: 50,        // Max 50 emails/day
  HOURLY_MAX: 10,       // Max 10 emails/hour
  MIN_INTERVAL: 5 * 60 * 1000, // 5 min between emails
};

// Load email state
function loadEmailState() {
  if (existsSync(emailStatePath)) {
    try {
      return JSON.parse(readFileSync(emailStatePath, 'utf8'));
    } catch (e) {
      console.error('[EmailCTA] Error loading state:', e.message);
    }
  }
  return {
    dailyCount: { count: 0, date: new Date().toDateString() },
    hourlyCount: { count: 0, hour: new Date().getHours() },
    lastEmailTime: 0,
    sentEmails: [],
    sequences: {}  // Track email sequences per project
  };
}

// Save email state
function saveEmailState(state) {
  try {
    writeFileSync(emailStatePath, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('[EmailCTA] Error saving state:', e.message);
  }
}

let emailState = loadEmailState();

// ============ EMAIL TEMPLATES ============

const EMAIL_TEMPLATES = {
  // Initial outreach - Soft CTA
  initial: (project) => ({
    subject: `${project.name} - Partnership Opportunity`,
    body: `Hi ${project.name} Team,

I've been following $${project.symbol} and I'm impressed by the community growth and momentum you're building.

My name is Toto, and I work with Solcex Exchange. We specialize in helping quality crypto projects like yours achieve broader exchange visibility and deeper liquidity.

A few things that caught my attention:
• Your recent developments show strong community engagement
• The $${project.symbol} market positioning is promising
• There's significant potential for strategic exchange partnerships

I'd love to explore how Solcex could support ${project.name}'s growth. We offer:
✓ Competitive listing terms
✓ Marketing and promotional support  
✓ Deep liquidity from day one
✓ 24/7 dedicated support

Interested in a brief conversation to discuss possibilities?

Best regards,
Dino
Senior Listing Manager, Solcex
📧 dino@solcex.cc
🐦 @dinozzolo

P.S. You can also learn more about our exchange at solcex.cc`
  }),

  // Follow-up - Value add
  followup: (project) => ({
    subject: `Quick follow-up: ${project.name} on Solcex`,
    body: `Hi ${project.name} Team,

Quick follow-up on my previous message about a potential listing partnership.

I wanted to share a few more details about why projects like yours choose Solcex:

🚀 Zero listing fees for early-stage quality projects
💧 Professional market makers ensuring tight spreads
📈 Featured placement and social media promotion
🤝 Personal listing manager (that's me!) available 24/7

Currently, we're especially interested in Solana-native projects with strong fundamentals - which is why $${project.symbol} caught my attention.

Worth a 15-minute call to explore?

Best,
Dino
📧 dino@solcex.cc
🐦 @dinozzolo`
  }),

  // Final attempt - Soft close
  final: (project) => ({
    subject: `Last note: ${project.name} listing opportunity`,
    body: `Hi ${project.name} Team,

I'll keep this brief - I know you're busy building.

I reached out about a potential listing partnership a couple weeks ago. I understand timing might not be right, or perhaps exchange expansion isn't a current priority.

No pressure at all - just wanted to leave the door open. If $${project.symbol} ever considers additional exchange listings, Solcex would love to be part of that conversation.

You can always reach me at dino@solcex.cc or @dinozzolo on X.

Keep building - excited to see where ${project.name} goes!

Best,
Dino
Solcex Exchange`
  }),

  // Response to Twitter engagement
  twitterFollowup: (project, twitterHandle) => ({
    subject: `Following up from X: ${project.name} Partnership`,
    body: `Hi ${project.name} Team,

I noticed we've been connecting on X (@${twitterHandle}) - appreciate the engagement there!

Wanted to follow up via email as well to discuss the partnership opportunities I mentioned.

As a quick recap, Solcex offers:
• Deep liquidity and professional market making
• Marketing support and featured listings  
• Competitive terms for quality projects
• Dedicated listing management

Happy to jump on a quick call whenever works for you.

Best,
Dino
📧 dino@solcex.cc
🐦 @dinozzolo`
  })
};

// ============ EMAIL CTA MANAGER ============

export const EmailCTA = {
  // Check if we can send email
  canSend() {
    const now = new Date();
    
    // Reset daily count
    if (emailState.dailyCount.date !== now.toDateString()) {
      emailState.dailyCount = { count: 0, date: now.toDateString() };
      saveEmailState(emailState);
    }
    
    // Reset hourly count
    if (emailState.hourlyCount.hour !== now.getHours()) {
      emailState.hourlyCount = { count: 0, hour: now.getHours() };
      saveEmailState(emailState);
    }
    
    // Check limits
    if (emailState.dailyCount.count >= EMAIL_LIMITS.DAILY_MAX) {
      console.warn(`[EmailCTA] ⚠️  Daily limit reached: ${emailState.dailyCount.count}/${EMAIL_LIMITS.DAILY_MAX}`);
      return false;
    }
    
    if (emailState.hourlyCount.count >= EMAIL_LIMITS.HOURLY_MAX) {
      console.warn(`[EmailCTA] ⚠️  Hourly limit reached: ${emailState.hourlyCount.count}/${EMAIL_LIMITS.HOURLY_MAX}`);
      return false;
    }
    
    // Check minimum interval
    const timeSinceLast = Date.now() - emailState.lastEmailTime;
    if (timeSinceLast < EMAIL_LIMITS.MIN_INTERVAL) {
      const wait = Math.ceil((EMAIL_LIMITS.MIN_INTERVAL - timeSinceLast) / 1000);
      console.warn(`[EmailCTA] ⏳ Must wait ${wait}s`);
      return false;
    }
    
    return true;
  },

  // Get or create email sequence for project
  getSequence(projectId) {
    if (!emailState.sequences[projectId]) {
      emailState.sequences[projectId] = {
        stage: 'initial',
        sent: [],
        lastSent: null,
        opened: false,
        replied: false
      };
      saveEmailState(emailState);
    }
    return emailState.sequences[projectId];
  },

  // Send email CTA
  async sendEmail(project, templateType = 'initial') {
    if (!this.canSend()) {
      return { success: false, reason: 'limits_reached' };
    }

    if (!project.email) {
      return { success: false, reason: 'no_email' };
    }

    const sequence = this.getSequence(project.id);
    
    // Don't send if already sent this stage
    if (sequence.sent.includes(templateType)) {
      console.log(`[EmailCTA] ⏭️  Skipping ${project.symbol} - ${templateType} already sent`);
      return { success: false, reason: 'already_sent' };
    }

    // Wait minimum interval
    const timeSinceLast = Date.now() - emailState.lastEmailTime;
    if (timeSinceLast < EMAIL_LIMITS.MIN_INTERVAL) {
      await new Promise(r => setTimeout(r, EMAIL_LIMITS.MIN_INTERVAL - timeSinceLast));
    }

    const template = EMAIL_TEMPLATES[templateType](project);
    
    try {
      await transporter.sendMail({
        from: `"Dino - Solcex" <${config.email.user}>`,
        to: project.email,
        subject: template.subject,
        text: template.body,
        headers: {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
        }
      });

      // Record success
      emailState.dailyCount.count++;
      emailState.hourlyCount.count++;
      emailState.lastEmailTime = Date.now();
      
      sequence.sent.push(templateType);
      sequence.lastSent = Date.now();
      sequence.stage = this.getNextStage(templateType);
      
      emailState.sentEmails.push({
        projectId: project.id,
        projectSymbol: project.symbol,
        template: templateType,
        timestamp: Date.now(),
        to: project.email
      });
      
      saveEmailState(emailState);
      
      // Log to database
      const { dbQueries } = await import('./database.js');
      dbQueries.logOutreach.run(project.id, 'email', template.subject, 'sent');
      
      console.log(`[EmailCTA] ✅ Email sent to ${project.symbol} (${templateType})`);
      console.log(`[EmailCTA] 📊 Daily: ${emailState.dailyCount.count}/${EMAIL_LIMITS.DAILY_MAX}, Hourly: ${emailState.hourlyCount.count}/${EMAIL_LIMITS.HOURLY_MAX}`);
      
      return { success: true, template: templateType };
      
    } catch (error) {
      console.error(`[EmailCTA] ❌ Failed to send to ${project.symbol}:`, error.message);
      return { success: false, reason: 'send_failed', error: error.message };
    }
  },

  // Get next stage in sequence
  getNextStage(currentStage) {
    const stages = ['initial', 'followup', 'final'];
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex < stages.length - 1) {
      return stages[currentIndex + 1];
    }
    return 'completed';
  },

  // Process follow-ups (run daily)
  async processFollowups() {
    const projects = Object.entries(emailState.sequences)
      .filter(([_, seq]) => seq.stage !== 'completed' && seq.lastSent)
      .filter(([_, seq]) => {
        const daysSinceLast = (Date.now() - seq.lastSent) / (1000 * 60 * 60 * 24);
        
        // Follow up after:
        // - 3 days for initial
        // - 7 days for followup
        if (seq.stage === 'followup' && daysSinceLast >= 3) return true;
        if (seq.stage === 'final' && daysSinceLast >= 7) return true;
        return false;
      });

    console.log(`[EmailCTA] 🔄 Processing ${projects.length} follow-ups`);

    for (const [projectId, seq] of projects) {
      const project = db.projects.find(p => p.id === parseInt(projectId));
      if (project && project.email) {
        await this.sendEmail(project, seq.stage);
        // Wait between sends
        await new Promise(r => setTimeout(r, EMAIL_LIMITS.MIN_INTERVAL));
      }
    }
  },

  // Get stats
  getStats() {
    return {
      dailySent: emailState.dailyCount.count,
      dailyLimit: EMAIL_LIMITS.DAILY_MAX,
      hourlySent: emailState.hourlyCount.count,
      hourlyLimit: EMAIL_LIMITS.HOURLY_MAX,
      totalSequences: Object.keys(emailState.sequences).length,
      completedSequences: Object.values(emailState.sequences).filter(s => s.stage === 'completed').length,
      lastSendTime: emailState.lastEmailTime ? new Date(emailState.lastEmailTime).toISOString() : null
    };
  },

  // Trigger email from X engagement
  async triggerFromEngagement(projectId, twitterHandle) {
    const project = db.projects.find(p => p.id === projectId);
    if (!project || !project.email) {
      return { success: false, reason: 'no_email' };
    }

    // Check if we already have a sequence
    const sequence = this.getSequence(projectId);
    if (sequence.sent.length > 0) {
      return { success: false, reason: 'sequence_exists' };
    }

    // Send Twitter followup email
    return await this.sendEmail(project, 'twitterFollowup', twitterHandle);
  }
};

export default EmailCTA;
