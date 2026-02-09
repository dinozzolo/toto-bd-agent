// Generate OAuth 2.0 Authorization URL for X
import crypto from 'crypto';

const CLIENT_ID = 'RDltd0Q1OHlDeE44aVM0Tk9lejg6MTpjaQ';
const REDIRECT_URI = 'https://solcex.cc/callback';
const SCOPE = 'tweet.read tweet.write users.read dm.read dm.write follows.read follows.write';

// Generate PKCE code verifier and challenge
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

// Generate state parameter
const state = crypto.randomBytes(16).toString('hex');

// Build authorization URL
const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
authUrl.searchParams.append('response_type', 'code');
authUrl.searchParams.append('client_id', CLIENT_ID);
authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
authUrl.searchParams.append('scope', SCOPE);
authUrl.searchParams.append('state', state);
authUrl.searchParams.append('code_challenge', codeChallenge);
authUrl.searchParams.append('code_challenge_method', 'S256');

console.log('========================================');
console.log('X OAUTH 2.0 AUTHORIZATION URL');
console.log('========================================\n');
console.log(authUrl.toString());
console.log('\n========================================');
console.log('IMPORTANT: SAVE THESE VALUES');
console.log('========================================');
console.log('Code Verifier:', codeVerifier);
console.log('State:', state);
console.log('\nYou will need the CODE VERIFIER when exchanging the authorization code!');
