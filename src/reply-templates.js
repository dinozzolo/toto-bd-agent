import { config } from './config.js';

// CONSERVATIVE REPLY TEMPLATES - Avoiding X spam filters
// No exchange mentions, no DM requests, no listing pitches in replies
// These build organic engagement first, pitch comes later via DM or email

function generateContextualReply(tweetText, projectName, symbol) {
  // Ensure symbol has $ prefix
  const ticker = symbol.startsWith('$') ? symbol : `$${symbol}`;
  
  // Analyze tweet content for context
  const text = (tweetText || '').toLowerCase();
  let context = '';
  
  if (text.includes('launch') || text.includes('released')) {
    context = 'Exciting launch! ';
  } else if (text.includes('partnership') || text.includes('collab')) {
    context = 'Great partnership move! ';
  } else if (text.includes('community') || text.includes('holders')) {
    context = 'Love seeing the community grow! ';
  } else if (text.includes('build') || text.includes('develop')) {
    context = 'Consistent building! ';
  } else if (text.includes('moon') || text.includes('pump')) {
    context = 'Bullish momentum! ';
  } else if (text.includes('meme') || text.includes('culture')) {
    context = 'Strong meme energy! ';
  }
  
  // SAFE TEMPLATES - No promotional language that triggers X filters
  const safeTemplates = [
    `${context}Love what ${projectName} is building with ${ticker}! 💎`,
    `${context}Bullish on ${ticker} - ${projectName} has serious potential. 🚀`,
    `${context}${ticker} looking strong! ${projectName} knows what they are doing. 📈`,
    `${context}Impressed by ${ticker}! The ${projectName} team is crushing it. 🔥`,
    `${context}${ticker} community is absolutely fire! ${projectName} is onto something. ⚡`,
    `${context}Big fan of what ${projectName} is doing with ${ticker}. 👀`,
    `${context}${ticker} fundamentals looking solid. ${projectName} building through the noise. 💪`,
    `${context}Respect the grind from ${projectName}! ${ticker} is different. 🎯`,
  ];
  
  return safeTemplates[Math.floor(Math.random() * safeTemplates.length)];
}

export { generateContextualReply };
