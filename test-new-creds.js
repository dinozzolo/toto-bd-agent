import { client } from './src/twitter-client.js';

async function main() {
  try {
    console.log('Testing new Twitter credentials...');
    const me = await client.v2.me();
    console.log('✅ Authenticated as:', me.data.username);
    console.log('ID:', me.data.id);
    
    // Try posting
    const tweet = await client.v2.tweet('Toto back online with fresh credentials. Ready to help projects list on @SolCex_Exchange 🚀 DM @dinozzolo');
    console.log('✅ Tweet posted! ID:', tweet.data.id);
  } catch (error) {
    console.error('❌ Error:', error.code, error.message);
  }
}

main();
