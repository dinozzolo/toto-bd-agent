// Telegram auth with env var code - no prompt delay
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.credentials' });

const API_ID = parseInt(process.env.TELEGRAM_API_ID);
const API_HASH = process.env.TELEGRAM_API_HASH;
const PHONE = process.env.TELEGRAM_PHONE;
const CODE = process.env.TELEGRAM_CODE; // Get code from env var

if (!CODE) {
  console.error('❌ Set TELEGRAM_CODE env var first!');
  console.error('Example: TELEGRAM_CODE=12345 node telegram-auth-fast.js');
  process.exit(1);
}

async function authenticate() {
  console.log('🔐 Telegram Fast Auth');
  console.log('=====================\n');
  
  const client = new TelegramClient(new StringSession(''), API_ID, API_HASH, {
    connectionRetries: 5,
  });
  
  try {
    await client.start({
      phoneNumber: PHONE,
      phoneCode: () => Promise.resolve(CODE),
      onError: (err) => console.log('Error:', err.message),
    });
    
    const session = client.session.save();
    console.log('\n✅ AUTHENTICATION SUCCESSFUL!');
    console.log('\n📋 Session String (save this!):');
    console.log(session);
    
    const me = await client.getMe();
    console.log(`\n👤 Logged in as: ${me.firstName} ${me.lastName || ''} (@${me.username})`);
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Auth failed:', err.message);
    process.exit(1);
  }
}

authenticate();
