import nodemailer from 'nodemailer';

// Quick test with timeout
const config = {
  host: 'mail.privateemail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'dino@solcex.cc',
    pass: 'DinoSolcex!'
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
};

console.log('Testing SMTP with explicit timeouts...');

const transporter = nodemailer.createTransport(config);

try {
  console.log('Attempting connection...');
  await transporter.verify();
  console.log('✅ Verification passed!');
  
  const info = await transporter.sendMail({
    from: 'dino@solcex.cc',
    to: 'taglianettidino@gmail.com',
    subject: 'Listing Opportunity for $SOLCEX on Solcex Exchange',
    text: `Hi SolCex team,

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

If you are interested, please reach out to Dino (@dinozzolo on X) or reply to this email directly.

Looking forward to potentially working together and helping $SOLCEX reach new heights.

Best regards,
Toto
Business Development Agent
Solcex Exchange
Twitter: @theprincetoto
Website: solcex.cc`
  });
  
  console.log('✅ Email sent!');
  console.log('Message ID:', info.messageId);
} catch (error) {
  console.log('❌ Error:', error.code || error.message);
  console.log('Full error:', error);
}
