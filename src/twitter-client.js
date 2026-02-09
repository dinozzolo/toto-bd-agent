import { TwitterApi } from 'twitter-api-v2';
import { config } from './config.js';

// Primary client using OAuth 1.0a User Context
export const twitterClient = new TwitterApi({
  appKey: config.twitter.apiKey,
  appSecret: config.twitter.apiSecret,
  accessToken: config.twitter.accessToken,
  accessSecret: config.twitter.accessSecret,
});

export const client = twitterClient.readWrite;

// Log successful initialization
const me = await client.v2.me();
console.log('[TwitterClient] Initialized as @' + me.data.username);
