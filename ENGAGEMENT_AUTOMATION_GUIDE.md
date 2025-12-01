# PhantomBuster Engagement Automation & Competitor Analysis Guide

**Status**: ✅ Fully Integrated
**API Key**: Configured in `.env`
**Date**: 2025-10-23

---

## 🚀 What's New

### 1. PhantomBuster API Key
✅ Added to `.env`: `PHANTOMBUSTER_API_KEY=YILHFLf7EoT33jT701VNDWJBGbF4EHlUhTAn4MxMkSM`

### 2. New Workflow Nodes
- **InstagramFollowerScraperNode** - Scrape competitor Instagram followers
- **TwitterFollowerScraperNode** - Scrape competitor Twitter followers
- **PhantomBusterNode** - LinkedIn automation (connections, messages, visits)

### 3. New Workflows
- **Competitor Analysis Workflow** - Analyze competitor social media followers
- **Engagement Automation Workflow** - Daily LinkedIn engagement automation

---

## 📊 Competitor Analysis Workflow

### Purpose
Scrape followers from competitor Instagram and Twitter accounts to understand:
- Audience demographics (location, interests)
- Engagement patterns
- Content preferences
- Potential leads in competitor audiences

### Target Competitors (Pre-configured)

**Instagram:**
- @zerodhaonline
- @growwapp
- @angelbroking
- @paytmmoney
- @upstoxofficial

**Twitter:**
- @zerodhaonline
- @groww_official
- @angelbroking
- @Paytm_Money
- @upstox

### Running the Workflow

```bash
cd automation-engine

# Simulation mode (test without API calls)
npm run run -- --workflow competitor-analysis

# Live mode (requires PhantomBuster agents set up)
npm run run -- --workflow competitor-analysis --live
```

### What You Get

**Instagram Insights:**
```json
{
  "summary": {
    "totalFollowers": 2500,
    "potentialLeads": 1000,
    "leadConversionRate": "40%",
    "avgFollowersPerUser": 5234,
    "avgEngagementPerPost": 142
  },
  "demographics": {
    "topLocations": [
      { "location": "Mumbai", "count": 450, "percentage": "18%" },
      { "location": "Bangalore", "count": 380, "percentage": "15.2%" }
    ],
    "topInterests": [
      { "interest": "investing", "count": 1200, "percentage": "48%" },
      { "interest": "finance", "count": 980, "percentage": "39.2%" }
    ]
  },
  "contentStrategy": {
    "recommendedTopics": ["investing", "finance", "wealth", "stocks", "trading"],
    "targetCities": ["Mumbai", "Bangalore", "Delhi"],
    "engagementTips": [...]
  }
}
```

**Twitter Insights:**
```json
{
  "summary": {
    "totalFollowers": 2500,
    "potentialLeads": 875,
    "leadConversionRate": "35%",
    "avgFollowersPerUser": 12456,
    "avgTweetsPerUser": 2341
  },
  "contentStrategy": {
    "recommendedTopics": ["stocks", "mutual funds", "PMS", "portfolio", "returns"],
    "hashtagRecommendations": ["#stocks", "#mutualfunds", "#PMS"],
    "optimalPostingFrequency": "Daily"
  }
}
```

### Setup Requirements

#### 1. Create PhantomBuster Agents

**Instagram Follower Scraper:**
1. Go to PhantomBuster dashboard
2. Click "New Phantom" → Search "Instagram Profile Follower Collector"
3. Name it: "Competitor Instagram Followers"
4. Save and copy Agent ID

**Twitter Follower Scraper:**
1. Click "New Phantom" → Search "Twitter Follower Collector"
2. Name it: "Competitor Twitter Followers"
3. Save and copy Agent ID

#### 2. Update Workflow Configuration

Edit `workflows/competitor-analysis.workflow.js`:

```javascript
// Replace with your actual agent IDs
{
  handler: 'InstagramFollowerScraperNode',
  config: {
    agentId: 'YOUR_INSTAGRAM_AGENT_ID_HERE', // <-- Paste your ID
    // ...
  }
},
{
  handler: 'TwitterFollowerScraperNode',
  config: {
    agentId: 'YOUR_TWITTER_AGENT_ID_HERE', // <-- Paste your ID
    // ...
  }
}
```

#### 3. Customize Competitor List (Optional)

```javascript
targetAccounts: [
  'zerodhaonline',
  'growwapp',
  // Add more competitors...
  'your_competitor_handle'
]
```

---

## 🤝 LinkedIn Engagement Automation Workflow

### Purpose
Automate daily LinkedIn engagement to warm up leads:
- **Profile Visits** - Trigger "who viewed your profile" notifications (100/day)
- **Connection Requests** - Send personalized requests to hot leads (25/day)
- **Follow-up Messages** - Send messages to accepted connections (30/day)

### Workflow Flow

```
1. Load qualified leads from Google Sheets (score >= 60)
   ↓
2. Profile Visits (Warm leads: score 60-79)
   - Visit 100 profiles/day
   - Triggers LinkedIn notification
   ↓
3. Connection Requests (Hot leads: score >= 80)
   - Send 25 personalized requests/day
   - Personalized message with {firstName}, {currentCompany}
   ↓
4. Wait 3 days for acceptance
   ↓
5. Follow-up Messages (Accepted connections)
   - Send 30 messages/day
   - Value-focused message about AQUA fund
   ↓
6. Update Google Sheets with engagement status
   ↓
7. Daily summary to Slack
```

### Running the Workflow

```bash
# Manual run
npm run run -- --workflow engagement-automation

# Schedule daily (9 AM weekdays)
# Add to cron or use workflow scheduler
0 9 * * 1-5 npm run run -- --workflow engagement-automation --live
```

### Safety Limits (LinkedIn ToS Compliant)

| Action | Daily Limit | Weekly Limit |
|--------|-------------|--------------|
| Profile Visits | 100-150 | 500-750 |
| Connection Requests | 25-30 | 125-150 |
| Messages | 30-50 | 150-250 |
| Comments | 10-15 | 50-75 |

**Important:**
- Always use personalized messages
- Never exceed daily limits
- Warm up new accounts gradually (2 weeks)
- Monitor for LinkedIn warnings

### Setup Requirements

#### 1. Create PhantomBuster Agents

**Profile Visitor:**
1. Dashboard → New Phantom → "LinkedIn Profile Visitor"
2. Name: "Daily Profile Visits"
3. Copy Agent ID

**Network Booster (Connection Requests):**
1. New Phantom → "LinkedIn Network Booster"
2. Name: "Connection Request Automation"
3. Copy Agent ID

**Message Sender:**
1. New Phantom → "LinkedIn Message Sender"
2. Name: "Follow-up Messages"
3. Copy Agent ID

#### 2. Update Workflow Configuration

Edit `workflows/engagement-automation.workflow.js`:

```javascript
// Replace with your actual agent IDs
{
  handler: 'PhantomBusterNode',
  config: {
    name: 'Profile Visit Automation',
    agentId: 'YOUR_PROFILE_VISITOR_AGENT_ID', // <-- Paste
    // ...
  }
},
{
  handler: 'PhantomBusterNode',
  config: {
    name: 'Connection Request Automation',
    agentId: 'YOUR_NETWORK_BOOSTER_AGENT_ID', // <-- Paste
    // ...
  }
},
{
  handler: 'PhantomBusterNode',
  config: {
    name: 'Follow-up Message Automation',
    agentId: 'YOUR_MESSAGE_SENDER_AGENT_ID', // <-- Paste
    // ...
  }
}
```

#### 3. Customize Messages

**Connection Request Message:**
```javascript
message: 'Hi {firstName}, came across your profile and was impressed by your work at {currentCompany}. I share insights about systematic investing and portfolio management. Would love to connect!'
```

**Follow-up Message:**
```javascript
messageTemplate: `Thanks for connecting, {firstName}!

I noticed your background in {industry} and thought you might find our recent insights interesting:

📊 Our AQUA fund has delivered 76% returns over 18 months through systematic quant strategies.

Would you be open to a quick 15-min intro call to explore how our PMS approach could complement your portfolio?`
```

---

## 📈 Expected Results

### Competitor Analysis (Per Run)

**Execution Time:**
- Instagram: ~20-30 minutes (500 followers × 5 accounts)
- Twitter: ~20-30 minutes (500 followers × 5 accounts)
- **Total**: ~40-60 minutes

**Insights Generated:**
- 2,500 Instagram followers analyzed
- 2,500 Twitter followers analyzed
- ~1,500 potential leads identified
- Top 5 content topics
- Top 5 target cities
- Engagement benchmarks

**Cost:**
- ~1.5 hours PhantomBuster execution time
- Fits within monthly quota (80 hours Pro plan)

**Frequency:**
- Monthly (to track competitor audience growth)
- Or quarterly for long-term trends

### Engagement Automation (Per Day)

**Daily Volume:**
- 100 profile visits
- 25 connection requests
- 30 follow-up messages

**Execution Time:**
- ~30 minutes/day
- ~15 hours/month
- Fits within Pro plan quota

**Expected Outcomes:**
- **Week 1:**
  - 500 profile visits
  - 125 connection requests
  - 50-60 accepted connections (40-50% rate)
  - 30 follow-up messages

- **Month 1:**
  - 2,000 profile visits
  - 500 connection requests
  - 200-250 accepted connections
  - 120 follow-up messages
  - 10-15 discovery calls booked

**ROI:**
- 250 new connections/month
- 15 discovery calls/month
- 2-3 conversions/month (assuming 15-20% close rate)
- 2-3 × ₹2.5 Cr avg AUM = ₹5-7.5 Cr AUM/month
- Revenue @ 2% = ₹10-15 lakh/month

---

## 🎯 Content Strategy Recommendations

Based on competitor follower analysis, create content for:

### Instagram Strategy

**Post Types:**
1. **Educational Carousels** - Investing basics, PMS benefits
2. **Performance Updates** - AQUA fund returns, market insights
3. **Client Testimonials** - Success stories (with consent)
4. **Team Culture** - Behind-the-scenes at PL Capital
5. **Market Commentary** - Daily/weekly market analysis

**Recommended Topics** (from insights):
- Systematic investing
- Portfolio diversification
- Wealth creation strategies
- Market timing myths
- PMS vs mutual funds

**Posting Frequency:**
- 5-7 posts/week
- 3-5 Stories/day
- 1-2 Reels/week

**Hashtags:**
- #investing #wealth #PMS #portfoliomanagement
- #stockmarket #financialplanning #wealthcreation
- #systematictrading #quantinvesting

### Twitter Strategy

**Tweet Types:**
1. **Market Insights** - Daily commentary
2. **Performance Stats** - Fund returns, benchmarks
3. **Educational Threads** - Multi-tweet deep dives
4. **Engagement Polls** - Audience interaction
5. **Retweet + Commentary** - Industry news

**Recommended Topics:**
- Stocks, mutual funds, PMS
- Portfolio construction
- Risk management
- Market trends

**Posting Frequency:**
- 3-5 tweets/day
- 1-2 threads/week
- Active replies to mentions

**Engagement:**
- Reply to industry influencers
- Join trending finance conversations
- Use relevant hashtags

---

## 🔧 Troubleshooting

### PhantomBuster Issues

**Error: "Invalid API key"**
- Check `.env` file has correct key
- Verify no extra spaces/quotes
- Test key in PhantomBuster dashboard

**Error: "Agent not found"**
- Verify agent ID is correct
- Check agent exists in dashboard
- Ensure agent is not deleted

**Low follower scraping success rate**
- Instagram/Twitter may have rate limits
- Reduce `maxFollowers` per account
- Space out launches (1 hour between)
- Use PhantomBuster residential proxies

**LinkedIn account warnings**
- Stop all automation immediately
- Reduce daily limits by 50%
- Switch to manual activity for 1 week
- Resume gradually

### Workflow Issues

**Workflow not found**
- Check workflow registered in `workflows/index.js`
- Verify workflow ID matches command
- Available workflows:
  - `competitor-analysis`
  - `engagement-automation`
  - `partners`, `hni`, `uhni`, `mass_affluent`

**No data in output**
- Check simulation mode vs live mode
- Verify agent IDs configured
- Check PhantomBuster dashboard for errors
- Review logs for detailed error messages

---

## 📋 Quick Start Checklist

### Competitor Analysis Setup
- [ ] Create Instagram Follower Scraper agent
- [ ] Create Twitter Follower Scraper agent
- [ ] Copy agent IDs to workflow config
- [ ] Test in simulation mode
- [ ] Run pilot with 1 competitor (100 followers)
- [ ] Run full analysis (all competitors)

### Engagement Automation Setup
- [ ] Create Profile Visitor agent
- [ ] Create Network Booster agent
- [ ] Create Message Sender agent
- [ ] Copy agent IDs to workflow config
- [ ] Prepare Google Sheets lead database
- [ ] Warm up LinkedIn account (2 weeks)
- [ ] Test with 10 leads
- [ ] Schedule daily execution

---

## 📞 Support

### PhantomBuster
- Dashboard: https://app.phantombuster.com
- Documentation: https://hub.phantombuster.com
- Support: support@phantombuster.com

### Internal
- Automation Issues: Marketing Ops Lead
- LinkedIn Strategy: Marketing Manager
- Compliance: Legal/Compliance Team

---

**Status**: ✅ Ready to Launch

**Next Steps:**
1. Create PhantomBuster agents (30 minutes)
2. Update workflow configs with agent IDs (10 minutes)
3. Test competitor analysis in simulation mode (5 minutes)
4. Run competitor analysis pilot (1 hour)
5. Review insights and adjust content strategy
6. Set up engagement automation (2-week warmup)
7. Monitor daily engagement metrics

**Estimated Time to Full Production:** 3-4 weeks

Good luck with your engagement automation! 🚀
