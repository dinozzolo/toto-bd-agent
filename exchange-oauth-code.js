// Exchange OAuth 2.0 authorization code for access tokens
import crypto from 'crypto';
import fs from 'fs';

const CLIENT_ID = 'RDltd0Q1OHlDeE44aVM0Tk9lejg6MTpjaQ';
const CLIENT_SECRET = '1lLPNHWhXwZeHTqqoaxNzOElpA6scNROzCX8_THQ1rSkZd9nXI';
const REDIRECT_URI = 'https://solcex.cc/callback';
const CODE_VERIFIER = 'bdni8JtmN4fo73Dba4edYFh9V8qpXmyJF8YVr9gGEuY';
const AUTH_CODE = 'Y3RwbWRScDIzUFVBeW10bGF4R2duWTlla0RERS1hUGNjd2NveDFoSGotSVdfOjE3NzA2NzI1NjM5MDM6MTowOmFjOjE';

// Create Basic Auth header
const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

// Build token request
const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
const params = new URLSearchParams({
  grant_type: 'authorization_code',
  code: AUTH_CODE,
  redirect_uri: REDIRECT_URI,
  code_verifier: CODE_VERIFIER,
});

console.log('========================================');
console.log('EXCHANGING AUTHORIZATION CODE');
console.log('========================================\n');

fetch(tokenUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${basicAuth}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: params.toString(),
})
.then(response => response.json())
.then(data => {
  if (data.error) {
    console.error('❌ Error:', data.error);
    console.error('Description:', data.error_description);
  } else {
    console.log('✅ SUCCESS! TOKENS RECEIVED:\n');
    console.log('Access Token:', data.access_token);
    console.log('\nRefresh Token:', data.refresh_token);
    console.log('\nExpires In:', data.expires_in, 'seconds');
    console.log('\nScope:', data.scope);
    
    // Save to file
    const tokenData = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000),
      scope: data.scope,
    };
    fs.writeFileSync('oauth2_tokens.json', JSON.stringify(tokenData, null, 2));
    console.log('\n✅ Tokens saved to oauth2_tokens.json');
  }
})
.catch(err => {
  console.error('❌ Request failed:', err.message);
});
