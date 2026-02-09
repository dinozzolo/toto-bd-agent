# X API Strategy - Based on Official X Terms of Service

## Source Documents Reviewed
1. **X Terms of Service** (Effective: January 15, 2026)
2. **X API Rate Limits** (docs.x.com)

---

## X OFFICIAL RULES THAT APPLY TO US

### 1. Prohibited Activities (Section 4: Misuse of the Services)
From X Terms of Service, these are EXPRESSLY PROHIBITED:

```
(iii) access or search or attempt to access or search the Services by any means 
(automated or otherwise) other than through our currently available, published 
interfaces that are provided by us

NOTE: crawling or scraping the Services in any form, for any purpose without 
our prior written consent is expressly prohibited

(viii) interfere with, or disrupt, (or attempt to do so), the access of any user, 
host or network, including, without limitation, sending a virus, overloading, 
flooding, spamming, mail-bombing the Services, or by scripting the creation of 
Content in such a manner as to interfere with or create an undue burden on the Services
```

**What this means for Toto:**
- ✅ **ALLOWED:** Using X API v2 (published interface)
- ❌ **PROHIBITED:** Any scraping, crawling, or automation outside the API
- ❌ **PROHIBITED:** "Scripting the creation of Content" that creates "undue burden"
- ❌ **PROHIBITED:** "Spamming" or "flooding" the Services

### 2. Rate Limits (Official X API Documentation)

| Endpoint | Limit | Our Usage |
|----------|-------|-----------|
| POST /2/tweets (create tweet) | 100/day per user | Original posts: 8/day ✅ |
| POST /2/tweets (reply) | 100/day per user | Replies: Need to track |
| GET /2/users/:id/tweets | 900/15min per user | Timeline scans ✅ |
| GET /2/users/by/username | 900/15min per user | User lookups ✅ |

**Critical Finding:** The daily tweet limit is **100 per day per user account**.

### 3. Developer Agreement Requirements
From X Terms Section 4:
```
If you use developer features, products, or services of the Services, 
you agree to our Developer Agreement and Developer Policy.
```

We must comply with both:
- Developer Agreement: https://developer.x.com/developer-terms/agreement
- Developer Policy: https://developer.x.com/developer-terms/policy

---

## COMPLIANCE GAPS IDENTIFIED

### Current Issues vs X Rules:

| Current Practice | X Rule Status | Risk Level |
|------------------|---------------|------------|
| 50+ replies/day | Exceeds 100/day limit | ⚠️ MEDIUM |
| Repetitive templates | May violate "spamming" | 🔴 HIGH |
| BD pitches in replies | Not prohibited but risky | 🟡 LOW |
| Automated @mentions | Could be "undue burden" | 🔴 HIGH |
| No rate limit tracking | Violates best practices | 🔴 HIGH |

---

## X-COMPLIANT STRATEGY

### Tier 1: IMMEDIATE FIXES (Required for Compliance)

#### 1. Hard Daily Limits
```javascript
// Maximum 100 tweets/replies per day per X rules
const DAILY_TWEET_LIMIT = 100;
const ORIGINAL_POSTS = 8; // Already compliant
const MAX_REPLIES = 90; // Leave buffer for errors/retries

// Track daily usage
tweetCounter = {
  date: new Date().toDateString(),
  count: 0,
  replies: 0,
  posts: 0
};

async function canTweet() {
  if (tweetCounter.date !== new Date().toDateString()) {
    // Reset for new day
    tweetCounter = { date: new Date().toDateString(), count: 0, replies: 0, posts: 0 };
  }
  return tweetCounter.count < DAILY_TWEET_LIMIT;
}
```

#### 2. Rate Limit Header Tracking (X Official Requirement)
```javascript
// X docs specify these headers MUST be checked
const rateLimitHeaders = {
  'x-rate-limit-limit': 'Maximum requests allowed',
  'x-rate-limit-remaining': 'Requests remaining in window',
  'x-rate-limit-reset': 'Unix timestamp when window resets'
};

// Exponential backoff when 429 received
async function makeRequestWithBackoff(requestFn) {
  try {
    return await requestFn();
  } catch (error) {
    if (error.code === 429) {
      const resetTime = error.headers['x-rate-limit-reset'];
      const waitTime = Math.max(resetTime - Date.now()/1000, 60);
      console.log(`Rate limited. Waiting ${waitTime}s...`);
      await sleep(waitTime * 1000);
      return makeRequestWithBackoff(requestFn);
    }
    throw error;
  }
}
```

#### 3. No Repetitive Content (Anti-Spam)
X prohibits "scripting the creation of Content in such a manner as to interfere with or create an undue burden on the Services"

**Solution:**
```javascript
// Ensure 100% unique messages - no templates within 30 days
const usedMessages = new Set(); // Persist to database

function generateUniqueReply(project) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  
  // Never use the same message twice
  const message = `Bullish on $${project.symbol}! ${project.name} building something special at ${timestamp}.`;
  
  if (usedMessages.has(message)) {
    return generateUniqueReply(project); // Recurse with new timestamp
  }
  
  usedMessages.add(message);
  return message;
}
```

### Tier 2: RECOMMENDED BEST PRACTICES

#### 1. Time-Based Throttling
X doesn't specify exact intervals, but recommends avoiding "flooding" and "spamming":

```javascript
// Conservative: Minimum 30 minutes between any tweets
const MIN_INTERVAL_MS = 30 * 60 * 1000;
let lastTweetTime = 0;

async function safeTweet() {
  const timeSinceLastTweet = Date.now() - lastTweetTime;
  if (timeSinceLastTweet < MIN_INTERVAL_MS) {
    const wait = MIN_INTERVAL_MS - timeSinceLastTweet;
    console.log(`Waiting ${wait/1000}s to avoid flooding...`);
    await sleep(wait);
  }
  // ... send tweet
  lastTweetTime = Date.now();
}
```

#### 2. Human-Like Patterns
X Terms mention "interfere with or create an undue burden on the Services":

```javascript
// Avoid robotic patterns
// BAD: Every 15 minutes exactly
// GOOD: Random intervals between 30-90 minutes

function getRandomInterval() {
  const min = 30 * 60 * 1000; // 30 min
  const max = 90 * 60 * 1000; // 90 min
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Schedule next tweet at random interval
setTimeout(scheduleNextTweet, getRandomInterval());
```

#### 3. Content Quality Standards
X can remove content that violates policies:

```javascript
// Prohibited content types to avoid:
const PROHIBITED_CONTENT = [
  'repetitive identical messages',
  'excessive @mentions',
  'automated DM requests',
  'mass unsolicited mentions',
  'duplicate/similar replies to multiple users'
];

// Safe content guidelines:
const SAFE_CONTENT = [
  'Genuine engagement with tweet content',
  'Unique, non-repetitive messages',
  'Relevant to the specific tweet',
  'No excessive mentions (max 1 per tweet)',
  'Organic, human-like language'
];
```

### Tier 3: MONITORING & SAFETY

#### 1. Daily Compliance Check
```javascript
// Run daily at midnight UTC
function complianceCheck() {
  const today = new Date().toDateString();
  const stats = {
    tweetsSent: tweetCounter.count,
    repliesSent: tweetCounter.replies,
    originalPosts: tweetCounter.posts,
    uniqueMessages: usedMessages.size,
    rateLimitHits: rateLimitErrors.length
  };
  
  // Alert if approaching limits
  if (stats.tweetsSent > 80) {
    console.warn('⚠️  Approaching daily limit (80/100)');
  }
  
  if (stats.rateLimitHits > 3) {
    console.error('🔴 Multiple rate limit errors - PAUSING for 24h');
    pauseOutreach(24 * 60 * 60 * 1000);
  }
}
```

#### 2. Automatic Circuit Breaker
```javascript
const circuitBreaker = {
  failures: 0,
  lastFailure: 0,
  threshold: 5,
  timeout: 60 * 60 * 1000 // 1 hour
};

function recordFailure(error) {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();
  
  if (circuitBreaker.failures >= circuitBreaker.threshold) {
    console.error('🚨 CIRCUIT BREAKER TRIGGERED - Stopping all outreach');
    console.error('Reason:', error.message);
    stopAllOutreach();
    
    // Auto-retry after timeout
    setTimeout(() => {
      console.log('🔄 Circuit breaker reset - resuming cautiously');
      circuitBreaker.failures = 0;
      resumeOutreach();
    }, circuitBreaker.timeout);
  }
}
```

---

## IMPLEMENTATION PRIORITIES

### IMMEDIATE (Before Any Outreach Resumes):
1. ✅ Implement daily 100 tweet limit
2. ✅ Add rate limit header tracking
3. ✅ Create unique message generator (no templates)
4. ✅ Set minimum 30-minute intervals
5. ✅ Add circuit breaker for errors

### THIS WEEK:
1. ✅ Implement exponential backoff
2. ✅ Add compliance monitoring dashboard
3. ✅ Create human-like random intervals
4. ✅ Track all used messages (prevent repetition)

### ONGOING:
1. Daily compliance reports
2. Weekly rate limit review
3. Monthly strategy adjustment based on X policy updates

---

## RISK MITIGATION

### If Account Gets Flagged:
1. **Immediate:** Stop all automated activity
2. **Within 1 hour:** Submit appeal via X Help Center
3. **Recovery period:** 7 days of manual-only engagement
4. **Gradual return:** Start with 10 tweets/day, scale slowly

### Backup Plans:
1. **Primary:** Email outreach (zero X API dependency)
2. **Secondary:** Discord/Telegram community engagement
3. **Tertiary:** Forum engagement (hackathon votes, etc.)

---

## COMPLIANCE CHECKLIST

- [ ] Daily tweet counter (max 100)
- [ ] Rate limit header tracking
- [ ] Exponential backoff on 429 errors
- [ ] 100% unique messages (no templates)
- [ ] Minimum 30-minute intervals
- [ ] Random interval variation
- [ ] Circuit breaker on failures
- [ ] Daily compliance reporting
- [ ] Manual recovery protocol
- [ ] Alternative channel strategy

---

## REFERENCES

1. **X Terms of Service** (Jan 15, 2026): https://x.com/en/tos
2. **X API Rate Limits**: https://docs.x.com/x-api/fundamentals/rate-limits
3. **Developer Agreement**: https://developer.x.com/developer-terms/agreement
4. **Developer Policy**: https://developer.x.com/developer-terms/policy

**Note:** X Terms state "crawling or scraping the Services in any form, for any purpose without our prior written consent is expressly prohibited." Our use of the official X API v2 is compliant, provided we follow rate limits and anti-spam rules.

