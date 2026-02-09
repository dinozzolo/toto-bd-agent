import db, { dbQueries } from './src/database.js';
import { writeFileSync } from 'fs';

// Clean up malformed Twitter usernames
let cleaned = 0;
db.projects.forEach(p => {
  if (p.twitter_username) {
    const original = p.twitter_username;
    let clean = original.split('?')[0].split('/').pop().replace('@', '');
    if (clean !== original) {
      p.twitter_username = clean;
      cleaned++;
    }
  }
});

if (cleaned > 0) {
  writeFileSync('./data/contacts.json', JSON.stringify(db, null, 2));
  console.log('✅ Cleaned', cleaned, 'malformed usernames');
}

console.log('');
console.log('📊 TOTO STATUS');
console.log('================');
console.log('Total projects:', db.projects.length);
console.log('With Twitter:', db.projects.filter(p => p.twitter_username).length);
console.log('Posts sent:', db.posts.length);
console.log('Replies sent:', db.outreach.filter(o => o.type === 'tweet_reply').length);
console.log('');

if (db.posts.length > 0) {
  console.log('Latest post:');
  const last = db.posts[db.posts.length-1];
  console.log('  Time:', last.posted_at);
  console.log('  Content:', last.content?.substring(0, 80));
}
