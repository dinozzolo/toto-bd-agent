import { writeFileSync } from 'fs';
import db from './src/database.js';

console.log('📧 COLLECTING EMAILS FOR DINO');
console.log('==============================\n');

const withEmail = db.projects.filter(p => p.email);
const withoutEmail = db.projects.filter(p => !p.email && p.twitter_username);

console.log('Current status:');
console.log('  With email:', withEmail.length);
console.log('  Without email:', withoutEmail.length);
console.log('  Total projects:', db.projects.length);

// Save to CSV for easy import
const csv = withEmail.map(p => 
  `"${p.name}","${p.symbol}","${p.email}","${p.email_source}","${p.twitter_username || ''}"`
).join('\n');

const header = 'Name,Symbol,Email,Source,Twitter\n';
writeFileSync('./data/emails-for-dino.csv', header + csv);

console.log('\n✅ Saved to: data/emails-for-dino.csv');
console.log('   Contains', withEmail.length, 'emails');

// Also create a formatted list
const txt = withEmail.map(p => 
  `${p.symbol}: ${p.email} (from ${p.email_source})`
).join('\n');

writeFileSync('./data/emails-list.txt', txt);
console.log('   Also saved: data/emails-list.txt');
