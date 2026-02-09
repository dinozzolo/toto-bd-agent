import { config } from './src/config.js';

function generateContextualReply(projectName, symbol) {
  const ticker = symbol.startsWith('$') ? symbol : `$${symbol}`;
  
  const bullishCompliments = [
    `Love what ${projectName} is building`,
    `${ticker} has serious potential`,
    `${projectName} community is absolutely fire`,
    `${ticker} showing impressive momentum`,
    `Bullish on ${ticker} long term`,
    `${projectName} fundamentals are solid`,
    `${ticker} community engagement is unmatched`,
    `${projectName} is ahead of the curve`,
    `${ticker} is a sleeper hit`,
    `${projectName} team knows what they're doing`,
    `${ticker} chart looking healthy`,
    `${projectName} is building through the noise`,
    `${ticker} has that special something`,
    `${projectName} is undervalued af`,
    `${ticker} community is different`,
  ];
  
  const compliment = bullishCompliments[Math.floor(Math.random() * bullishCompliments.length)];
  
  const templates = [
    `${compliment}! ${projectName} ${ticker} has serious upside. Ready to take it to the next level? List ${ticker} on @${config.company.twitter} for maximum exposure and professional liquidity. DM @dinozzolo 🚀`,
    `${compliment}. ${ticker} deserves better exchange exposure. @${config.company.twitter} provides deep liquidity, competitive fees, and dedicated support for quality projects like ${projectName}. Let's talk - DM @dinozzolo`,
    `Bullish on ${ticker}! ${compliment}. @${config.company.twitter} accelerates growth for projects like ${projectName} with strong market making and community reach. Ready to list? DM @dinozzolo`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

console.log('🎯 NEW BULLISH REPLIES:\n');

const tests = [
  { name: 'Bonk', symbol: 'Bonk' },
  { name: 'Ethereum', symbol: 'ETH' },
  { name: 'Solana', symbol: 'SOL' },
  { name: 'MEW', symbol: 'MEW' },
];

for (let i = 0; i < 6; i++) {
  const test = tests[i % tests.length];
  const reply = generateContextualReply(test.name, test.symbol);
  console.log(`Reply ${i+1}:`);
  console.log(reply);
  console.log('');
}
