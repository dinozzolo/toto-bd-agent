import EmailOutreach from './src/email-outreach.js';

const emailer = new EmailOutreach();

// Test SMTP connection
console.log('Testing SMTP connection to privateemail.com...');
emailer.transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP Connection Failed:', error.message);
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Successful!');
    console.log('Ready to send emails from dino@solcex.cc');
    process.exit(0);
  }
});
