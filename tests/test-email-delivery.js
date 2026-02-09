import axios from 'axios';

// Try alternative email delivery methods

async function trySendEmail() {
  console.log('=== EMAIL DELIVERY TEST ===\n');
  
  // Test 1: Direct HTTPS to privateemail webmail API (if available)
  try {
    console.log('1. Checking if privateemail has REST API...');
    const response = await axios.get('https://privateemail.com/api/', {
      timeout: 5000,
      validateStatus: () => true
    });
    console.log('   Status:', response.status);
    console.log('   Has API:', response.status !== 404);
  } catch (e) {
    console.log('   ❌ No REST API available');
  }
  
  // Test 2: Alternative SMTP providers with different ports
  console.log('\n2. Testing alternative SMTP ports...');
  const smtpHosts = [
    { host: 'smtp.gmail.com', port: 587 },
    { host: 'smtp.office365.com', port: 587 },
    { host: 'smtp.mailgun.org', port: 587 },
    { host: 'email-smtp.eu-west-1.amazonaws.com', port: 587 },
    { host: 'smtp.sendgrid.net', port: 587 }
  ];
  
  for (const { host, port } of smtpHosts) {
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);
        const socket = require('net').createConnection(port, host, () => {
          clearTimeout(timeout);
          socket.end();
          resolve();
        });
        socket.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
      console.log(`   ✅ ${host}:${port} - CONNECTED`);
    } catch (e) {
      console.log(`   ❌ ${host}:${port} - ${e.message}`);
    }
  }
  
  // Test 3: Check environment proxy settings
  console.log('\n3. Environment checks:');
  console.log('   HTTP_PROXY:', process.env.HTTP_PROXY || 'not set');
  console.log('   HTTPS_PROXY:', process.env.HTTPS_PROXY || 'not set');
  console.log('   http_proxy:', process.env.http_proxy || 'not set');
  
  console.log('\n=== RECOMMENDATIONS ===');
  console.log('Since all SMTP ports are blocked, consider:');
  console.log('1. Use a cloud VM with full internet access');
  console.log('2. Use web automation (Puppeteer/Playwright) to send via webmail');
  console.log('3. Configure a HTTP/HTTPS proxy in your environment');
  console.log('4. Use a different email provider with API access (Postmark, Mailgun)');
}

trySendEmail();
