import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'dino@solcex.cc',
    pass: 'eoav-spuy-jmdq-sgjn'
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

console.log('Testing new credentials...');
console.log('Host: mail.privateemail.com:587');
console.log('User: dino@solcex.cc');

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('Code:', error.code);
    if (error.command) console.log('Command:', error.command);
  } else {
    console.log('✅ Connection successful!');
    
    // Try sending
    console.log('\nSending test email...');
    transporter.sendMail({
      from: 'dino@solcex.cc',
      to: 'taglianettidino@gmail.com',
      subject: 'Solcex Listing Opportunity - Test Email',
      text: 'This is a test email using the new app password.',
      html: '<h1>Test Email</h1><p>New app password working!</p>'
    }, (err, info) => {
      if (err) {
        console.log('❌ Send failed:', err.message);
      } else {
        console.log('✅ Email sent! Message ID:', info.messageId);
      }
      process.exit(0);
    });
  }
});
