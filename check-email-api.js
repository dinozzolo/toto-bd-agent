const https = require('https');

console.log('=== CHECKING PRIVATEEMAIL API OPTIONS ===\n');

// PrivateEmail is RoundCube-based - check for API endpoints
const endpoints = [
  'https://privateemail.com/api/',
  'https://privateemail.com/roundcube/',
  'https://api.privateemail.com/',
  'https://mail.privateemail.com/api/',
  'https://privateemail.com/webmail/'
];

async function checkEndpoints() {
  for (const url of endpoints) {
    try {
      const response = await new Promise((resolve, reject) => {
        https.get(url, { rejectUnauthorized: false }, (res) => {
          resolve({ status: res.statusCode, url });
        }).on('error', reject);
      });
      console.log(`${url}: ${response.status === 200 ? '✅' : '⚠️'} ${response.status}`);
    } catch (e) {
      console.log(`${url}: ❌ ${e.message}`);
    }
  }
}

checkEndpoints();

console.log('\n=== ALTERNATIVE SOLUTION ===');
console.log('If no API available, we can try:');
console.log('1. IMAP access to check/send emails');
console.log('2. Use a VPN/proxy to bypass SMTP blocks');
console.log('3. Use a different email provider with HTTPS API');
console.log('4. Run email tasks from a different server');
