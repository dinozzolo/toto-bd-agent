import { client } from './src/twitter-client.js';

async function diagnose() {
  try {
    // Test 1: Get user
    const user = await client.v2.userByUsername('aave');
    console.log('1. Get user: OK', user.data.id);
    
    // Test 2: Timeline with minimal params
    try {
      const timeline = await client.v2.userTimeline(user.data.id);
      console.log('2. Timeline (default): OK, tweets:', timeline.data?.data?.length || 0);
    } catch(e) {
      console.log('2. Timeline (default): FAILED -', e.message);
    }
    
    // Test 3: Timeline with explicit params
    try {
      const timeline2 = await client.v2.userTimeline(user.data.id, { 
        max_results: 5,
        'tweet.fields': ['created_at']
      });
      console.log('3. Timeline (with fields): OK');
    } catch(e) {
      console.log('3. Timeline (with fields): FAILED -', e.message);
    }
    
    // Test 4: Try search
    try {
      const search = await client.v2.search('crypto', { max_results: 1 });
      console.log('4. Search: OK');
    } catch(e) {
      console.log('4. Search: FAILED -', e.message);
    }
    
  } catch (e) {
    console.log('Fatal error:', e.message);
  }
}
diagnose();
