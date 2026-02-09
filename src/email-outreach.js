import nodemailer from 'nodemailer';
import db, { dbQueries } from './database.js';

class EmailOutreach {
  constructor() {
    // Initialize SMTP transporter for PrivateEmail
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.privateemail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // TLS
      auth: {
        user: process.env.EMAIL_ADDRESS || 'dino@solcex.cc',
        pass: process.env.EMAIL_PASSWORD || 'DinoSolcex!'
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    this.processing = false;
  }

  async run() {
    console.log('[EmailOutreach] 📧 Starting email outreach...');
    
    // Get projects with emails that haven't been emailed yet
    const pendingEmails = this.getPendingEmails(5); // Send max 5 at a time
    
    if (pendingEmails.length === 0) {
      console.log('[EmailOutreach] No pending emails to send');
      return;
    }
    
    console.log(`[EmailOutreach] Found ${pendingEmails.length} emails to send`);
    
    for (const project of pendingEmails) {
      await this.sendListingEmail(project);
      await this.delay(30000); // 30 second delay between emails
    }
    
    console.log('[EmailOutreach] ✅ Email batch complete');
  }

  getPendingEmails(limit = 5) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Get projects already emailed in last 7 days
    const recentlyEmailed = new Set(
      db.outreach
        .filter(o => o.type === 'email' && o.sent_at >= sevenDaysAgo)
        .map(o => o.project_id)
    );
    
    // Return projects with email that haven't been emailed recently
    return db.projects
      .filter(p => p.email && !recentlyEmailed.has(p.id))
      .slice(0, limit);
  }

  async sendListingEmail(project) {
    try {
      // Double-check we haven't emailed them recently
      const recentEmail = db.outreach.find(o => 
        o.project_id === project.id && 
        o.type === 'email' &&
        new Date(o.sent_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      
      if (recentEmail) {
        console.log(`[EmailOutreach] ❌ BLOCKED: ${project.symbol} emailed within 7 days`);
        return false;
      }

      const emailContent = this.generateEmail(project);
      
      const mailOptions = {
        from: `"Toto - Solcex Exchange" <${process.env.EMAIL_ADDRESS || 'dino@solcex.cc'}>`,
        to: project.email,
        subject: `List ${project.symbol} on Solcex Exchange - Fast Track Available`,
        html: emailContent.html,
        text: emailContent.text
      };

      console.log(`[EmailOutreach] 📧 Sending to ${project.symbol} at ${project.email}`);
      
      const result = await this.transporter.sendMail(mailOptions);
      
      // Log success
      dbQueries.logOutreach.run(
        project.id,
        'email',
        `Subject: ${mailOptions.subject}`,
        'sent'
      );
      
      console.log(`[EmailOutreach] ✅ SENT: ${project.symbol} (Message ID: ${result.messageId})`);
      return true;
      
    } catch (error) {
      console.error(`[EmailOutreach] ❌ FAILED: ${project.symbol}:`, error.message);
      
      // Log failure
      dbQueries.logOutreach.run(
        project.id,
        'email',
        'Failed to send',
        'failed'
      );
      
      return false;
    }
  }

  generateEmail(project) {
    const symbol = project.symbol;
    const name = project.name || symbol;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; }
    .content { padding: 30px; max-width: 600px; margin: 0 auto; }
    .highlight { background: #f0f7ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
    .cta { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; display: inline-block; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>List ${symbol} on Solcex Exchange</h1>
  </div>
  
  <div class="content">
    <p>Hi ${name} Team,</p>
    
    <p>I'm Toto, Business Development at <strong>Solcex Exchange</strong> (solcex.cc). I've been following $${symbol} and I'm impressed by what you're building.</p>
    
    <div class="highlight">
      <strong>Why list on Solcex?</strong>
      <ul>
        <li>Fast listing - 24-48 hours</li>
        <li>Deep liquidity from day one</li>
        <li>Solana-native trading infrastructure</li>
        <li>Active marketing support for quality projects</li>
        <li>Competitive fee structure</li>
      </ul>
    </div>
    
    <p>With your current momentum and community engagement, I believe ${symbol} would be a perfect fit for our platform. We'd love to discuss a listing partnership.</p>
    
    <p><strong>Ready to get started?</strong></p>
    
    <a href="https://solcex.cc/listing" class="cta">Apply for Listing</a>
    
    <p>Or reply directly to this email and I'll personally fast-track your application.</p>
    
    <p>Best regards,<br>
    <strong>Toto</strong><br>
    Business Development<br>
    Solcex Exchange<br>
    📧 dino@solcex.cc<br>
    🐦 @theprincetoto</p>
  </div>
  
  <div class="footer">
    <p>Solcex Exchange - The Future of Solana Trading<br>
    solcex.cc | @SolCex_Exchange</p>
    <p><small>If you received this in error, please disregard. We only contact projects we genuinely believe in.</small></p>
  </div>
</body>
</html>
    `;

    const text = `
Hi ${name} Team,

I'm Toto, Business Development at Solcex Exchange (solcex.cc). I've been following $${symbol} and I'm impressed by what you're building.

Why list on Solcex?
- Fast listing - 24-48 hours
- Deep liquidity from day one
- Solana-native trading infrastructure
- Active marketing support for quality projects
- Competitive fee structure

With your current momentum and community engagement, I believe ${symbol} would be a perfect fit for our platform. We'd love to discuss a listing partnership.

Ready to get started?
Apply at: https://solcex.cc/listing

Or reply directly to this email and I'll personally fast-track your application.

Best regards,
Toto
Business Development
Solcex Exchange
📧 dino@solcex.cc
🐦 @theprincetoto

---
Solcex Exchange - The Future of Solana Trading
solcex.cc | @SolCex_Exchange

If you received this in error, please disregard. We only contact projects we genuinely believe in.
    `;

    return { html, text };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default EmailOutreach;
