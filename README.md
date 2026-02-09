# 🤖 Toto - AI Business Development Agent

> **The ONLY AI BD Agent That Gets Paid** — Autonomous project discovery, multi-channel outreach, deal closing, and x402 payment collection.

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://dinozzolo.github.io/toto-bd-agent/demo)
[![Hackathon](https://img.shields.io/badge/Colosseum-Hackathon%202026-purple)](https://arena.colosseum.org/projects/toto-ai-business-development-agent-for-crypto-exchanges)

## 🎯 What is Toto?

Toto is a fully autonomous Business Development agent that:

1. **Scouts** crypto projects from CoinGecko, CoinMarketCap, and social media
2. **Qualifies** leads based on market cap, team, and engagement metrics
3. **Reaches out** via X (Twitter), Email, and Telegram with personalized CTAs
4. **Closes deals** and collects payment via x402 protocol
5. **Delivers services** automatically or hands off to humans

## 🚀 Key Features

### Multi-Channel CTA Strategy
- **X (Twitter)**: Policy-compliant replies with stage-based engagement (Organic → Warm → Pitch)
- **Email**: 3-stage sequences with auto-discovery of team emails
- **Telegram**: MTProto integration for direct messaging

### x402 Payment Integration
- Generate payment requests automatically
- Support for Base, Ethereum, Polygon, Solana
- Accept USDC, USDT, ETH, SOL
- Track revenue and deal analytics

### Three Automation Levels
| Mode | Description | Use Case |
|------|-------------|----------|
| 🧑‍💼 Manual | Toto generates proposals, you close deals | "I want control over the final sale" |
| 🤝 Assisted | Toto drafts everything, you approve | "I want oversight without grunt work" |
| 🤖 Full Auto | Toto runs the entire pipeline autonomously | "Passive income mode" |

## 📁 Project Structure

```
toto-bd-agent/
├── src/                    # Core modules
│   ├── index.js           # Main entry point
│   ├── scanner.js         # Project discovery
│   ├── compliance.js      # X API rate limiting
│   ├── database.js        # Contact management
│   ├── x402-payments.js   # Payment processing
│   ├── bd-deals.js        # Deal management
│   ├── email-cta.js       # Email campaigns
│   └── telegram-cta.js    # Telegram outreach
├── scripts/               # Utility scripts
├── docs/                  # Strategy documentation
├── demo/                  # Demo website
│   └── index.html        # Live demo page
└── tests/                 # Test files
```

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/dinozzolo/toto-bd-agent.git
cd toto-bd-agent

# Install dependencies
npm install

# Configure credentials
cp .env.example .env.credentials
# Edit .env.credentials with your API keys

# Start the agent
npm start
```

## ⚙️ Configuration

Create `.env.credentials` with:

```env
# X (Twitter) API
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_secret

# Telegram (optional)
TELEGRAM_API_ID=your_id
TELEGRAM_API_HASH=your_hash
TELEGRAM_PHONE=your_phone

# Email (optional)
EMAIL_HOST=smtp.example.com
EMAIL_USER=your_email
EMAIL_PASS=your_password
```

## 📊 Service Tiers

| Package | Price | Includes |
|---------|-------|----------|
| Basic Listing | $5,000 | Exchange submission, social announcement |
| Premium Listing | $15,000 | Priority submission, 3-5 KOL intros, PR |
| Enterprise | $50,000 | White-glove service, 10+ KOLs, market making |
| Marketing Basic | $3,000 | Twitter campaign, community engagement |
| Marketing Premium | $10,000 | Full campaign, 5-8 KOL partnerships |
| Consultation | $500 | 1-hour strategy call, custom roadmap |

## 🔗 Links

- **Live Demo**: [dinozzolo.github.io/toto-bd-agent/demo](https://dinozzolo.github.io/toto-bd-agent/demo)
- **Hackathon**: [Colosseum Arena](https://arena.colosseum.org/projects/toto-ai-business-development-agent-for-crypto-exchanges)
- **Solcex Exchange**: [solcex.cc](https://solcex.cc)
- **Twitter**: [@theprincetoto](https://x.com/theprincetoto)

## 👨‍💻 Author

**Dino** ([@dinozzolo](https://x.com/dinozzolo))  
Senior Listing Manager at Solcex Exchange

---

Built for **Colosseum Agent Hackathon 2026** 🏆
