import { client } from './src/twitter-client.js';
import nodemailer from 'nodemailer';
import { config } from './src/config.js';

console.log('🧪 Testing Toto BD Agent Connections...\n');

// Test Twitter
async function testTwitter() {
  try {
    console.log('1️⃣ Testing Twitter API...');
    const me = await client.v2.me();
    console.log(`✅ Twitter connected: @${me.data.username} (${me.data.name})`);
    return true;
  } catch (error) {
    console.error(`❌ Twitter failed: ${error.message}`);
    return false;
  }
}

// Test Email
async function testEmail() {
  try {
    console.log('\n2️⃣ Testing Email SMTP...');
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
    
    await transporter.verify();
    console.log(`✅ Email connected: ${config.email.user}`);
    return true;
  } catch (error) {
    console.error(`❌ Email failed: ${error.message}`);
    return false;
  }
}

// Test APIs
async function testAPIs() {
  console.log('\n3️⃣ Testing External APIs...');
  
  const tests = [
    { name: 'DexScreener', url: 'https://api.dexscreener.com/latest/dex/tokens/trending' },
    { name: 'CoinGecko', url: 'https://api.coingecko.com/api/v3/ping' },
    { name: 'CoinMarketCap', url: 'https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=1&limit=5' },
  ];
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url);
      if (response.ok) {
        console.log(`✅ ${test.name} API working`);
      } else {
        console.error(`⚠️ ${test.name} returned status ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ ${test.name} failed: ${error.message}`);
    }
  }
}

// Run all tests
(async () => {
  const twitterOk = await testTwitter();
  const emailOk = await testEmail();
  await testAPIs();
  
  console.log('\n' + '='.repeat(50));
  if (twitterOk && emailOk) {
    console.log('✅ All critical connections working!');
    console.log('\nYou can now start the agent with:');
    console.log('  npm start');
    console.log('\nOr run:');
    console.log('  ./START.sh');
  } else {
    console.log('❌ Some connections failed. Check credentials in .env.credentials');
  }
  console.log('='.repeat(50));
})();
