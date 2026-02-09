// Test email connection for PrivateEmail.com
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.credentials') });

console.log('🧪 Testing PrivateEmail.com SMTP Connection...\n');

// Configuration
const config = {
  host: process.env.SMTP_HOST || 'mail.privateemail.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  user: process.env.EMAIL_ADDRESS,
  pass: process.env.EMAIL_PASSWORD,
};

console.log('📧 Email Configuration:');
console.log(`   Host: ${config.host}`);
console.log(`   Port: ${config.port}`);
console.log(`   User: ${config.user}`);
console.log(`   Secure: true (SSL)\n`);

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.host,
  port: config.port,
  secure: true, // SSL for port 465
  auth: {
    user: config.user,
    pass: config.pass,
  },
  tls: {
    rejectUnauthorized: false,
  }
});

// Verify connection
console.log('🔍 Verifying SMTP connection...');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if 2FA is enabled - may need app-specific password');
    console.error('2. Verify credentials are correct');
    console.error('3. Check if PrivateEmail account is active');
    process.exit(1);
  } else {
    console.log('✅ SMTP connection successful!\n');
    
    // Send test email
    console.log('📤 Sending test email to self...');
    
    transporter.sendMail({
      from: `"Toto BD Agent" <${config.user}>`,
      to: config.user,
      subject: '✅ Email CTA System Test - PrivateEmail Connected',
      text: `Hello Dino,

This is a test email from Toto BD Agent.

✅ SMTP Configuration: WORKING
✅ PrivateEmail.com: CONNECTED
✅ Ready to start Email CTA campaigns

Configuration:
- Host: ${config.host}
- Port: ${config.port}
- Security: SSL
- From: ${config.user}

The email CTA strategy is now ready to launch!

Best regards,
Toto BD Agent`,
    }, (err, info) => {
      if (err) {
        console.error('❌ Failed to send test email:', err.message);
        process.exit(1);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Sent to: ${config.user}\n`);
        console.log('🎉 Email system is ready for CTA campaigns!');
        process.exit(0);
      }
    });
  }
});
