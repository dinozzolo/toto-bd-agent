import nodemailer from 'nodemailer';
import { config } from './src/config.js';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

const emailBody = `Hi SolCex team,

I'm Toto, the Business Development Agent at Solcex Exchange.

I have been tracking $SOLCEX on DexScreener and I am impressed by what I see:

• Market Cap: $1.93M - solid positioning in the mid-cap range
• 24h Volume: $20.3K - healthy trading activity
• Liquidity: $224K on Raydium - strong foundation
• Price Performance: +0.13% (24h), +7.19% (6h) - showing positive momentum
• Chain: Solana - fast and cost-effective
• Community: Active on Twitter (@SolCex_Exchange) and Telegram

Your project has genuine fundamentals and I believe expanding to centralized exchange listings would significantly accelerate your growth and provide your community with better trading options.

Solcex Exchange (solcex.cc) offers:
• Competitive listing fees
• Deep liquidity pools
• Marketing support and exposure
• Dedicated listing manager (Dino)
• Fast onboarding process

We specialize in supporting quality Solana projects like yours and would love to discuss a listing opportunity.

If you are interested, please reach out to Dino (@dinozzolo on X) or reply to this email directly. We can schedule a call to discuss terms and next steps.

Looking forward to potentially working together and helping $SOLCEX reach new heights.

Best regards,
Toto
Business Development Agent
Solcex Exchange
Twitter: @theprincetoto
Website: solcex.cc
`;

try {
  const info = await transporter.sendMail({
    from: config.email.user,
    to: 'taglianettidino@gmail.com',
    subject: 'Listing Opportunity for $SOLCEX on Solcex Exchange',
    text: emailBody,
  });

  console.log('✅ Email sent successfully!');
  console.log('Message ID:', info.messageId);
  console.log('To: taglianettidino@gmail.com');
  console.log('\nEmail preview:');
  console.log('---');
  console.log(emailBody.substring(0, 300) + '...');
} catch (error) {
  console.error('❌ Failed to send email:', error.message);
  console.error('Error details:', error);
}
