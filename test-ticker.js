import { config } from './src/config.js';

// Test the reply template
function generateContextualReply(tweetText, projectName, symbol) {
  // Ensure symbol has $ prefix
  const ticker = symbol.startsWith('$') ? symbol : `$${symbol}`;
  
  const templates = [
    `Interesting update on ${projectName} ${ticker}. List ${ticker} on @${config.company.twitter} - competitive fees, deep liquidity, fast onboarding. Get better exposure. DM @dinozzolo`,
    `Great progress with ${ticker}. @${config.company.twitter} offers professional listing services with dedicated support and marketing exposure. Expand your reach - contact @dinozzolo`,
    `${projectName} ${ticker} showing solid fundamentals. @${config.company.twitter} accelerates growth with strong liquidity pools and community exposure. Ready to list? DM @dinozzolo`,
    `Impressive work on ${ticker}. List ${ticker} on @${config.company.twitter} for competitive rates, reliable liquidity, and professional trading environment. Contact @dinozzolo for details`,
    `${projectName} ${ticker} building well. @${config.company.twitter} provides fast listing process, strong market making, and dedicated manager support. Let's talk - DM @dinozzolo`,
    `Good traction with ${ticker}. Get ${ticker} listed on @${config.company.twitter} - streamlined process, deep liquidity, marketing support included. Reach out @dinozzolo`,
    `Solid momentum for ${ticker}. @${config.company.twitter} specializes in launching quality tokens like ${ticker} with proper liquidity and exposure. DM @dinozzolo`,
    `${ticker} gaining attention. List ${ticker} on @${config.company.twitter} for professional trading infrastructure and dedicated support. Contact @dinozzolo`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// Test
console.log('Testing reply templates with $TICKER:\n');

const tests = [
  { name: 'Ethereum', symbol: 'ETH' },
  { name: 'Bonk', symbol: 'Bonk' },
  { name: 'Solana', symbol: 'SOL' },
];

for (const test of tests) {
  const reply = generateContextualReply('Test tweet', test.name, test.symbol);
  console.log(`${test.name} (${test.symbol}):`);
  console.log(reply);
  console.log('---\n');
}
