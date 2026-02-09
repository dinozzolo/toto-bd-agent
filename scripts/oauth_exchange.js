import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const client = new TwitterApi({
  clientId: 'eHU2ejVDZnYzWlBjOEVFZ3BGcEs6MTpjaQ',
  clientSecret: 'XJhFttEqiyMZ25HXQ1wuUjA_h4OVBgbZp-VyiPpRm6gxQgixEI',
});

const link = await client.generateOAuth2AuthLink('https://solcex.cc/callback', {
  scope: ['tweet.read', 'tweet.write', 'users.read', 'dm.read', 'dm.write', 'offline.access']
});

fs.writeFileSync('/tmp/live_verifier.txt', link.codeVerifier);

console.log('🔗 AUTHORIZE URL:');
console.log(link.url);
console.log('\n⏱️  Paste code here within 20 seconds:');

rl.question('Code: ', async (code) => {
  const startTime = Date.now();
  const verifier = fs.readFileSync('/tmp/live_verifier.txt', 'utf8');
  
  try {
    const { accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
      code: code.trim(),
      codeVerifier: verifier,
      redirectUri: 'https://solcex.cc/callback'
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`\n✅ SUCCESS! (exchanged in ${elapsed}ms)`);
    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);
    
    fs.writeFileSync('oauth2_tokens.json', JSON.stringify({accessToken, refreshToken, expiresIn}, null, 2));
  } catch (e) {
    console.log('\n❌ Error:', e.message);
  }
  rl.close();
});
