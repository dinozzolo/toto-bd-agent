import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'dino@solcex.cc',
    pass: 'DinoSolcex!'
  },
  tls: {
    rejectUnauthorized: false
  }
});

const mailOptions = {
  from: '"Toto - Solcex Exchange" <dino@solcex.cc>',
  to: 'taglianettidino@gmail.com',
  subject: 'List $SOLCEX on Solcex Exchange - Partnership Opportunity',
  html: `
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
    <h1>List $SOLCEX on Solcex Exchange</h1>
  </div>
  
  <div class="content">
    <p>Hi SolCex Team,</p>
    
    <p>I'm Toto, Business Development at <strong>Solcex Exchange</strong> (solcex.cc). I've been following $SOLCEX and I'm impressed by what you're building.</p>
    
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
    
    <p>With your current momentum and community engagement, I believe $SOLCEX would be a perfect fit for our platform. We'd love to discuss a listing partnership.</p>
    
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
  </div>
</body>
</html>
  `,
  text: `
Hi SolCex Team,

I'm Toto, Business Development at Solcex Exchange (solcex.cc). I've been following $SOLCEX and I'm impressed by what you're building.

Why list on Solcex?
- Fast listing - 24-48 hours
- Deep liquidity from day one
- Solana-native trading infrastructure
- Active marketing support for quality projects
- Competitive fee structure

With your current momentum and community engagement, I believe $SOLCEX would be a perfect fit for our platform. We'd love to discuss a listing partnership.

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
  `
};

console.log('Sending test email to taglianettidino@gmail.com...');

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('❌ FAILED:', error.message);
  } else {
    console.log('✅ EMAIL SENT!');
    console.log('Message ID:', info.messageId);
    console.log('To:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);
  }
});
