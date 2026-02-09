import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env.credentials') });

export const config = {
  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
  },
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
  agent: {
    name: process.env.AGENT_NAME,
    twitter: process.env.AGENT_TWITTER,
    role: process.env.AGENT_ROLE,
  },
  company: {
    name: process.env.COMPANY_NAME,
    website: process.env.COMPANY_WEBSITE,
    twitter: process.env.COMPANY_TWITTER,
  },
  bd: {
    minMcap: parseInt(process.env.MIN_MCAP),
    maxFollowers: parseInt(process.env.MAX_FOLLOWERS_LIMIT),
    replyInterval: parseInt(process.env.REPLY_INTERVAL_MINUTES),
    dailyPosts: parseInt(process.env.DAILY_POSTS),
    teamCheckInterval: parseInt(process.env.TEAM_CHECK_INTERVAL_MINUTES),
  },
  team: ['dinozzolo', 'Solcex_intern', 'arloxshot', 'Alexanderbtcc', 'SolCex_Exchange'],
  reportEmail: 'dino@solcex.cc',
};
