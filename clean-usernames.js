import db from './src/database.js';
import { writeFileSync } from 'fs';

// Clean all malformed Twitter usernames
let cleaned = 0;
db.projects.forEach(p => {
  if (p.twitter_username) {
    const original = p.twitter_username;
    // Remove query params, @ symbol, and trailing slashes
    let clean = original
      .split('?')[0]  // Remove query params
      .split('/').pop()  // Get last part of URL
      .replace('@', '')  // Remove @
      .trim();
    
    // Validate: only letters, numbers, underscores
    if (!/^[a-zA-Z0-9_]+$/.test(clean) || clean.length < 2 || clean.length > 15) {
      clean = null; // Invalid username
    }
    
    if (clean !== original) {
      p.twitter_username = clean;
      cleaned++;
      if (clean) {
        console.log('Cleaned: ' + original + ' -> ' + clean);
      } else {
        console.log('Removed invalid: ' + original);
      }
    }
  }
});

// Save cleaned database
writeFileSync('./data/contacts.json', JSON.stringify(db, null, 2));

console.log('');
console.log('✅ Cleaned ' + cleaned + ' usernames');
console.log('Valid Twitter usernames: ' + db.projects.filter(p => p.twitter_username).length);
