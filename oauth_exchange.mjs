import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';

const client = new TwitterApi({
  appKey: 'I2ViOPDkM9cMoqtfq7LO6oSZL',
  appSecret: 'Tplk27jYEVtqbo4yxcUneJNHjWwNXC9c9ZvMCwcjL8SAlNczOA',
});

// Generate auth link and save the secret
const authLink = await client.generateAuthLink('oob');

// Save to temp file
fs.writeFileSync('/tmp/oauth_temp.json', JSON.stringify({
  oauth_token: authLink.oauth_token,
  oauth_token_secret: authLink.oauth_token_secret
}));

console.log('🔗 AUTHORIZATION URL:');
console.log(authLink.url);
console.log('\\n⏳ After clicking authorize, you will get a PIN.');
console.log('Send me the PIN immediately and I will exchange it.');
console.log('\\n(Token info saved for exchange)');
