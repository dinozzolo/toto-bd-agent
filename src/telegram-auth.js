#!/usr/bin/env node

/**
 * Telegram Authentication Script
 * Run this first to authenticate and save session
 * Usage: node src/telegram-auth.js
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.credentials') });

const API_ID = parseInt(process.env.TELEGRAM_API_ID);
const API_HASH = process.env.TELEGRAM_API_HASH;
const PHONE_NUMBER = process.env.TELEGRAM_PHONE;

if (!API_ID || !API_HASH || !PHONE_NUMBER) {
  console.error('❌ Missing Telegram credentials!');
  console.error('Please set TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_PHONE in .env.credentials');
  process.exit(1);
}

async function authenticate() {
  console.log('🔐 Telegram Authentication');
  console.log('=========================\n');
  console.log(`Phone: ${PHONE_NUMBER}`);
  console.log(`API ID: ${API_ID}\n`);
  
  const session = new StringSession(''); // Empty session - will create new
  const client = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 5,
  });

  console.log('Connecting to Telegram...\n');

  try {
    await client.start({
      phoneNumber: PHONE_NUMBER,
      password: async () => {
        console.log('🔑 2FA password required (if you have it)');
        return await input.text('Enter 2FA password (or press Enter if none): ');
      },
      phoneCode: async () => {
        console.log('\n📱 CHECK YOUR TELEGRAM APP!');
        console.log('A verification code has been sent to your phone.\n');
        return await input.text('Enter the 5-digit code: ');
      },
      onError: (err) => console.error('Error:', err),
    });

    console.log('\n✅ Authentication successful!');
    
    // Get session string
    const sessionString = client.session.save();
    
    // Save session
    const sessionPath = path.join(__dirname, '../data/telegram-session.json');
    fs.writeFileSync(sessionPath, JSON.stringify({ 
      session: sessionString,
      createdAt: new Date().toISOString(),
      phone: PHONE_NUMBER
    }, null, 2));
    
    console.log('\n💾 Session saved to: data/telegram-session.json');
    console.log('You can now use Telegram features in the main bot!\n');
    
    // Test - get me
    const me = await client.getMe();
    console.log(`Logged in as: ${me.firstName} ${me.lastName || ''} (@${me.username || 'no username'})`);
    
  } catch (error) {
    console.error('\n❌ Authentication failed:', error.message);
    process.exit(1);
  } finally {
    await client.disconnect();
  }
}

authenticate();
