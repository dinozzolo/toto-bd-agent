import { config } from './config.js';

// Updated contextual reply generator - reads tweet content
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
  
  const templates = [
    `${context}${projectName} ${ticker} is exactly what @${config.company.twitter} looks for. Bullish on both ${ticker} and our exchange growth together. Ready to list? DM @dinozzolo 🚀`,
    
    `${context}Bullish on ${ticker}! ${projectName} deserves an exchange that matches its ambition. @${config.company.twitter} provides deep liquidity and pro support. Let's grow together - DM @dinozzolo`,
    
    `${context}${ticker} showing real strength! @${config.company.twitter} is bullish on quality projects like ${projectName}. Let's discuss listing and accelerate the growth. DM @dinozzolo 🔥`,
    
    `${context}Love the ${ticker} energy! @${config.company.twitter} and ${projectName} would crush it together. Exchange listing with deep liquidity waiting for you. DM @dinozzolo 💎`,
    
    `${context}${projectName} ${ticker} has that special something. @${config.company.twitter} is building the go-to launch platform for quality projects. Bullish on listing ${ticker}! DM @dinozzolo`,
    
    `${context}Impressed by ${ticker}! As @${config.company.twitter} grows, we want projects like ${projectName} on board. Mutual growth, serious liquidity. DM @dinozzolo to discuss 📈`,
    
    `${context}${ticker} community is fire! @${config.company.twitter} has an army of traders ready for quality listings. Let's make ${projectName} our next big launch. DM @dinozzolo`,
    
    `${context}${projectName} ${ticker} fundamentals are solid. @${config.company.twitter} provides the infrastructure for serious projects to scale. Bullish on working together! DM @dinozzolo`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

export { generateContextualReply };
