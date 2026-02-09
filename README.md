# Toto - Solcex Exchange BD Agent

Automated Business Development agent for Solcex Exchange.

## What It Does

1. **Project Discovery** - Scans DexScreener, CoinGecko, and CoinMarketCap daily for projects above 400k market cap
2. **Automated Outreach** - Replies to project tweets and sends emails inviting them to list on Solcex
3. **Content Posting** - Posts 8 crypto-related tweets per day based on market sentiment
4. **Team Engagement** - Monitors and engages with Solcex team members' tweets every 30 minutes
5. **Daily Reporting** - Sends detailed email reports with all contacts and outreach activities

## Schedule

- **6:00 AM UTC** - Daily project scan
- **Every 5 minutes** - Process outreach queue (reply to one project)
- **Every 3 hours** - Post crypto content (8x per day)
- **11:00 PM UTC** - Post daily summary tweet
- **Every 30 minutes** - Check and engage with team tweets
- **11:30 PM UTC** - Send daily report email to dino@solcex.cc

## Team Monitored

- @dinozzolo (Dino - Creator, Senior Listing Manager)
- @Solcex_intern (Colleague, Intern)
- @arloxshot (Big Boss)
- @Alexanderbtcc (Boss)
- @SolCex_Exchange (Company account)

## Usage

### Start the agent
```bash
cd bd-agent
npm start
```

### Manual operations
```bash
# Run scanner manually
npm run scanner

# Process outreach queue manually
npm run outreach

# Post crypto content manually
npm run poster

# Engage with team manually
npm run team-engage

# Send report manually
npm run report
```

## Database

All contacts are stored in `data/contacts.db` (SQLite).

Tables:
- `projects` - Discovered crypto projects
- `outreach` - Log of all outreach activities
- `posts` - Log of all tweets posted
- `team_engagement` - Log of team tweet engagement

## Configuration

Edit `.env.credentials` in the workspace root to update:
- Twitter API credentials
- Email SMTP settings
- Minimum market cap threshold
- Reply intervals
- Team members to monitor

## Safety Features

- Avoids accounts with 500k+ followers to prevent spam flags
- Human-like reply intervals (not strict timing)
- Contextual replies based on tweet content
- No emojis in replies to avoid spam detection
- Tags projects and uses $TOKEN symbols appropriately

## Created By

Dino (@dinozzolo) - Senior Listing Manager, Solcex Exchange
Agent Identity: Toto (@theprincetoto)
