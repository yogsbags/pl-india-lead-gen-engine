# PhantomBuster Integration Guide for Lead Generation

**Purpose**: Comprehensive guide for integrating PhantomBuster into the lead generation workflow

**Created**: 2025-10-23
**Owner**: Marketing Ops Team

---

## Table of Contents

1. [Why PhantomBuster?](#1-why-phantombuster)
2. [PhantomBuster vs Apify Comparison](#2-phantombuster-vs-apify-comparison)
3. [Account Setup](#3-account-setup)
4. [Key Phantoms for Lead Generation](#4-key-phantoms-for-lead-generation)
5. [Segment-Specific Workflows](#5-segment-specific-workflows)
6. [API Integration](#6-api-integration)
7. [Automation Engine Integration](#7-automation-engine-integration)
8. [Cost Optimization](#8-cost-optimization)
9. [Compliance & Best Practices](#9-compliance--best-practices)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Why PhantomBuster?

### Key Advantages

**LinkedIn Automation Strengths**:
- Native LinkedIn connection automation
- Profile visit tracking
- Message automation (with safety limits)
- Sales Navigator integration
- Better handling of LinkedIn's anti-bot measures

**Ease of Use**:
- No-code phantom configuration
- Pre-built templates for common use cases
- Visual workflow builder
- Chrome extension for easy input capture

**Unique Features**:
- Email discovery from LinkedIn profiles
- Twitter/Instagram scraping
- Google Maps business scraping
- Multi-channel outreach (LinkedIn + Email)

### When to Use PhantomBuster vs Apify

**Use PhantomBuster for**:
- LinkedIn connection automation
- Sales Navigator lead extraction
- Profile visits and engagement
- Email discovery from LinkedIn
- Twitter/social media scraping
- Small to medium scale (< 10K leads/month)

**Use Apify for**:
- Large-scale data scraping (> 10K leads)
- Complex custom workflows
- Multiple data sources aggregation
- Better for pure data extraction
- Lower per-result costs at scale

**Best Practice**: **Use Both in Tandem**
- Apify for bulk lead scraping
- PhantomBuster for engagement and enrichment

---

## 2. PhantomBuster vs Apify Comparison

| Feature | PhantomBuster | Apify | Winner |
|---------|---------------|-------|--------|
| **LinkedIn Automation** | ⭐⭐⭐⭐⭐ Native | ⭐⭐⭐ Good | PhantomBuster |
| **Bulk Scraping** | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | Apify |
| **Ease of Use** | ⭐⭐⭐⭐⭐ No-code | ⭐⭐⭐⭐ Moderate | PhantomBuster |
| **Cost (10K leads)** | $149/month | $49/month | Apify |
| **Email Discovery** | ⭐⭐⭐⭐⭐ Built-in | ⭐⭐⭐ Via actors | PhantomBuster |
| **Sales Navigator** | ⭐⭐⭐⭐⭐ Native | ⭐⭐⭐ Possible | PhantomBuster |
| **Connection Requests** | ⭐⭐⭐⭐⭐ Automated | ⭐⭐ Manual | PhantomBuster |
| **Message Automation** | ⭐⭐⭐⭐⭐ Yes | ⭐ No | PhantomBuster |
| **Data Quality** | ⭐⭐⭐⭐ High | ⭐⭐⭐⭐⭐ Very High | Apify |
| **API Access** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | Apify |
| **Compliance Tools** | ⭐⭐⭐⭐ Good | ⭐⭐⭐ Moderate | PhantomBuster |

**Recommended Hybrid Approach** (Best of Both Worlds):
1. **Apify**: Bulk lead scraping (7,700 leads)
2. **PhantomBuster**: Engagement automation (LinkedIn connections, messages)
3. **Cost**: $49 (Apify) + $99 (PhantomBuster Starter) = $148/month

---

## 3. Account Setup

### 3.1 Sign Up & Pricing

**PhantomBuster Plans** (as of 2025):

| Plan | Price | Execution Time | Best For |
|------|-------|----------------|----------|
| **Starter** | $69/month | 20 hours | Testing, small campaigns |
| **Pro** | $149/month | 80 hours | Recommended |
| **Team** | $439/month | 300 hours | Enterprise scale |

**For PL Capital (7,700 leads)**:
- Recommended: **Pro Plan** ($149/month)
- Estimated time needed: ~50-60 hours/month
- Covers all 4 segments + engagement automation

### 3.2 Initial Configuration

1. **Create Account**: https://phantombuster.com
2. **Add Payment Method**: Credit card or PayPal
3. **Set Budget Alerts**: 50%, 75%, 90% of execution time
4. **Generate API Key**: Settings → API → Create new key
5. **Install Chrome Extension**: For easy input capture

### 3.3 LinkedIn Account Setup

**IMPORTANT - Account Safety**:

⚠️ **Never use your personal LinkedIn account for automation!**

**Best Practices**:
1. Create a separate LinkedIn account OR
2. Use Sales Navigator account (recommended for Partners/HNI segments)
3. Age the account (2-4 weeks of manual activity before automation)
4. Complete profile (photo, headline, summary, experience)
5. Add 50-100 connections manually first
6. Warm up account gradually (start with low limits)

**Sales Navigator Setup** (Optional - $99/month):
- Required for advanced search filters
- Better for HNI/UHNI segment targeting
- 25 InMail credits/month included
- Worth it if targeting premium leads

---

## 4. Key Phantoms for Lead Generation

### 4.1 LinkedIn Phantoms

#### Phantom 1: LinkedIn Profile Scraper
**Phantom ID**: `linkedin-profile-scraper`
**Use Case**: Extract detailed profile data
**Input**: LinkedIn profile URLs or search URLs
**Output**: Name, title, company, location, experience, education, skills, contact info

**Configuration Example**:
```json
{
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID",
  "columnName": "LinkedIn URL",
  "numberOfProfilesPerLaunch": 100,
  "csvName": "hni_profiles"
}
```

**Pricing**: ~2-3 seconds per profile
**Success Rate**: 98%

---

#### Phantom 2: LinkedIn Sales Navigator Search Export
**Phantom ID**: `linkedin-sales-navigator-search-export`
**Use Case**: Extract leads from Sales Navigator searches
**Input**: Sales Navigator search URL
**Output**: Profile URLs, basic info (name, title, company)

**Configuration Example**:
```json
{
  "searches": [
    "https://www.linkedin.com/sales/search/people?query=(filters:LIST((type:CURRENT_TITLE,values:List((text:CEO))),(type:GEO,values:List((text:Mumbai%20Area)))))"
  ],
  "numberOfResultsPerSearch": 1000,
  "csvName": "hni_sales_nav_leads"
}
```

**Best For**: HNI & UHNI segments (advanced filters)
**Pricing**: ~1 second per result

---

#### Phantom 3: LinkedIn Network Booster
**Phantom ID**: `linkedin-network-booster`
**Use Case**: Automatically send connection requests
**Input**: LinkedIn profile URLs
**Output**: Connection request sent status

**Configuration Example**:
```json
{
  "spreadsheetUrl": "YOUR_SHEET_URL",
  "columnName": "LinkedIn URL",
  "numberOfConnectionsPerLaunch": 20,
  "message": "Hi {firstName}, I came across your profile and was impressed by your work in {industry}. Would love to connect!",
  "csvName": "connection_requests_sent"
}
```

**Safety Limits**:
- Max 20-30 requests per day
- Use personalized messages (avoid generic)
- Gradual ramp-up (start with 10/day)

**Compliance**: Must comply with LinkedIn ToS

---

#### Phantom 4: LinkedIn Message Sender
**Phantom ID**: `linkedin-message-sender`
**Use Case**: Send automated messages to connections
**Input**: LinkedIn profile URLs (must be 1st-degree connections)
**Output**: Message sent status

**Configuration Example**:
```json
{
  "spreadsheetUrl": "YOUR_SHEET_URL",
  "columnName": "LinkedIn URL",
  "messageColumn": "Custom Message",
  "numberOfMessagesPerLaunch": 30,
  "csvName": "messages_sent"
}
```

**Safety Limits**:
- Max 30-50 messages per day
- Personalize each message
- Space out launches (every 4-6 hours)

---

#### Phantom 5: LinkedIn Profile Visitor
**Phantom ID**: `linkedin-profile-visitor`
**Use Case**: Visit profiles to trigger "Who viewed your profile" notifications
**Input**: LinkedIn profile URLs
**Output**: Profile visit status

**Use Case**: Warm lead generation (soft outreach)
**Configuration**: Visit 50-100 profiles/day
**Best For**: Mass Affluent & HNI segments

---

#### Phantom 6: LinkedIn Auto Commenter
**Phantom ID**: `linkedin-auto-commenter`
**Use Case**: Automatically comment on posts from target leads
**Input**: LinkedIn profile URLs or post URLs
**Output**: Comment posted status

**Use Case**: Engagement automation for warm leads
**Safety**: Max 10-15 comments per day

---

#### Phantom 7: LinkedIn Search Export
**Phantom ID**: `linkedin-search-export`
**Use Case**: Extract leads from regular LinkedIn search (non-Sales Navigator)
**Input**: LinkedIn search URL
**Output**: Profile URLs, names, titles, companies

**Configuration Example**:
```json
{
  "searches": [
    "https://www.linkedin.com/search/results/people/?keywords=financial%20advisor&origin=GLOBAL_SEARCH_HEADER&sid=2x%2C"
  ],
  "numberOfResultsPerSearch": 500,
  "csvName": "partner_leads"
}
```

**Best For**: Partners & Mass Affluent segments
**Limitation**: Less advanced filters than Sales Navigator

---

### 4.2 Email Enrichment Phantoms

#### Phantom 8: LinkedIn Profile Email Extractor
**Phantom ID**: `linkedin-profile-email-extractor`
**Use Case**: Find email addresses from LinkedIn profiles
**Input**: LinkedIn profile URLs
**Output**: Work email, personal email (if available)

**Email Sources**:
- LinkedIn contact info (if public)
- Hunter.io integration
- Common email pattern guessing
- Company website scraping

**Success Rate**: 40-60% email discovery
**Cost**: ~5-10 seconds per profile

---

#### Phantom 9: Email Discovery from URLs
**Phantom ID**: `email-discovery-from-urls`
**Use Case**: Extract emails from company websites
**Input**: Company website URLs
**Output**: Contact emails found

**Best For**: Partners segment (IFA firm emails)

---

### 4.3 Multi-Channel Phantoms

#### Phantom 10: Twitter Profile Scraper
**Phantom ID**: `twitter-profile-scraper`
**Use Case**: Enrich leads with Twitter activity
**Best For**: UHNIs (track thought leadership, interests)

#### Phantom 11: Instagram Profile Scraper
**Phantom ID**: `instagram-profile-scraper`
**Use Case**: Identify lifestyle signals for HNI/UHNI segmentation

---

## 5. Segment-Specific Workflows

### 5.1 Partners Segment Workflow

**Goal**: 500 qualified IFA/wealth management partners

**Step-by-Step**:

1. **Scrape Company Leads** (Apify)
   - Actor: `dev_fusion/Linkedin-Company-Scraper`
   - Input: 800 company URLs
   - Output: Company profiles

2. **Find Decision Makers** (PhantomBuster)
   - Phantom: `linkedin-profile-scraper`
   - Input: Company page → People tab URLs
   - Output: Founder/Owner profiles

3. **Email Discovery** (PhantomBuster)
   - Phantom: `linkedin-profile-email-extractor`
   - Input: Profile URLs from Step 2
   - Output: Work emails

4. **Connection Automation** (PhantomBuster)
   - Phantom: `linkedin-network-booster`
   - Input: Qualified leads (score >60)
   - Message: "Hi {firstName}, noticed you run {companyName}. We're PL Capital, an 80-year-old PMS with industry-leading quant strategies. Would love to explore partnership opportunities."
   - Limit: 20 requests/day

5. **Follow-up Messages** (PhantomBuster)
   - Phantom: `linkedin-message-sender`
   - Input: Accepted connections
   - Message: "Thanks for connecting! I'd love to share how our AQUA fund's 76% returns over 18 months can complement your client offerings. Open to a quick 15-min intro call?"

**Estimated Time**: ~15 hours execution time/month
**Cost**: Included in Pro plan

---

### 5.2 HNI Segment Workflow

**Goal**: 2,000 qualified HNI leads

**Step-by-Step**:

1. **Bulk Lead Scraping** (Apify - Recommended)
   - Actor: `code_crafter/leads-finder`
   - Input: Search criteria (CEO, CFO, Directors in Mumbai/Bangalore)
   - Output: 2,500 raw leads

2. **Profile Enrichment** (PhantomBuster)
   - Phantom: `linkedin-profile-scraper`
   - Input: Top 500 scored leads (>65)
   - Output: Complete profile data

3. **Email Discovery** (PhantomBuster)
   - Phantom: `linkedin-profile-email-extractor`
   - Input: All 2,000 leads
   - Output: ~1,200 verified emails (60% success rate)

4. **Warm Engagement** (PhantomBuster)
   - Phantom: `linkedin-profile-visitor`
   - Input: Hot leads (score >82)
   - Action: Visit profiles to trigger notifications
   - Limit: 100 visits/day

5. **Connection Requests** (PhantomBuster)
   - Phantom: `linkedin-network-booster`
   - Input: Warm leads (score 65-82)
   - Message: "Hi {firstName}, impressed by your background at {currentCompany}. As a fellow {industry} professional, I thought you might find PL Capital's systematic investment approach interesting. Would love to connect!"
   - Limit: 30 requests/day

6. **Follow-up Sequence** (PhantomBuster + n8n)
   - Day 3: LinkedIn message (Phantom)
   - Day 7: Email (n8n)
   - Day 14: LinkedIn comment on recent post (Phantom)
   - Day 21: Email with case study (n8n)

**Estimated Time**: ~40 hours execution time/month
**Cost**: Fits within Pro plan ($149/month)

---

### 5.3 UHNI Segment Workflow

**Goal**: 200 highly qualified UHNI leads

**Step-by-Step**:

1. **Manual Seed List** (Human)
   - Forbes India Rich List
   - Hurun India Rich List
   - Promoter databases
   - Output: 300 LinkedIn URLs

2. **Deep Profile Scraping** (PhantomBuster)
   - Phantom: `linkedin-profile-scraper`
   - Input: All 300 profiles
   - Output: Complete profile data

3. **Social Listening** (PhantomBuster)
   - Phantom: `twitter-profile-scraper` (if applicable)
   - Input: Twitter handles
   - Output: Recent tweets, interests, engagement topics

4. **Soft Engagement** (PhantomBuster)
   - Phantom: `linkedin-profile-visitor`
   - Input: All 300 profiles
   - Action: Visit profiles (no immediate connection request)
   - Frequency: Once per week

5. **Targeted Commenting** (PhantomBuster)
   - Phantom: `linkedin-auto-commenter`
   - Input: Recent posts from UHNIs
   - Action: Thoughtful comments (pre-approved by team)
   - Limit: 5-10 comments/day

6. **Personal Outreach** (Manual)
   - LinkedIn InMail (personalized)
   - Email (executive briefing package)
   - Warm introduction via mutual connection

**Estimated Time**: ~10 hours execution time/month
**Cost**: Low usage, focus on quality over quantity

---

### 5.4 Mass Affluent Segment Workflow

**Goal**: 5,000 mass affluent leads

**Step-by-Step**:

1. **Bulk Scraping** (Apify - Recommended)
   - Actor: `code_crafter/leads-finder`
   - Input: Multiple search queries (VPs, Directors, Senior Managers)
   - Output: 6,000 raw leads

2. **Email Discovery** (PhantomBuster)
   - Phantom: `linkedin-profile-email-extractor`
   - Input: All 6,000 leads
   - Output: ~3,600 emails (60% success rate)

3. **Profile Visits** (PhantomBuster)
   - Phantom: `linkedin-profile-visitor`
   - Input: Randomly selected 1,000 leads/month
   - Action: Trigger "Who viewed your profile" notifications

4. **Newsletter Opt-in** (n8n + PhantomBuster)
   - Email sequence to discovered emails
   - LinkedIn message to connections: "Subscribe to our wealth-building newsletter"

5. **Engagement Retargeting** (PhantomBuster)
   - Phantom: `linkedin-network-booster`
   - Input: Leads who clicked on newsletter links
   - Message: Personalized connection request

**Estimated Time**: ~20 hours execution time/month
**Cost**: Fits within Pro plan

---

## 6. API Integration

### 6.1 PhantomBuster API Basics

**Authentication**:
```bash
# API Key from Settings → API
X-Phantombuster-Key: YOUR_API_KEY
```

**Base URL**:
```
https://api.phantombuster.com/api/v2/
```

### 6.2 Key API Endpoints

#### Launch a Phantom
```bash
POST /agents/launch

{
  "id": "agent_id_here",
  "argument": {
    "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/...",
    "columnName": "LinkedIn URL",
    "numberOfProfilesPerLaunch": 100
  }
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "containerId": "123456789",
    "queuedAt": "2025-10-23T10:30:00.000Z"
  }
}
```

#### Check Phantom Status
```bash
GET /agents/fetch?id=agent_id_here
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "lastEndMessage": "Agent finished",
    "lastEndStatus": "success",
    "execTimeMinutes": 5.2
  }
}
```

#### Fetch Results
```bash
GET /containers/fetch-result-object?id=container_id_here
```

**Response**: JSON array of scraped data

### 6.3 Node.js Integration Example

```javascript
import axios from 'axios';

const PHANTOMBUSTER_API_KEY = process.env.PHANTOMBUSTER_API_KEY;
const API_BASE = 'https://api.phantombuster.com/api/v2';

class PhantomBusterClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'X-Phantombuster-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  async launchAgent(agentId, argument) {
    const response = await this.client.post('/agents/launch', {
      id: agentId,
      argument
    });
    return response.data.data.containerId;
  }

  async getAgentStatus(agentId) {
    const response = await this.client.get('/agents/fetch', {
      params: { id: agentId }
    });
    return response.data.data;
  }

  async fetchResults(containerId) {
    const response = await this.client.get('/containers/fetch-result-object', {
      params: { id: containerId }
    });
    return response.data;
  }

  async waitForCompletion(agentId, pollInterval = 30000) {
    while (true) {
      const status = await this.getAgentStatus(agentId);
      if (status.lastEndStatus === 'success') {
        return status;
      }
      if (status.lastEndStatus === 'error') {
        throw new Error(`Agent failed: ${status.lastEndMessage}`);
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}

export default PhantomBusterClient;
```

---

## 7. Automation Engine Integration

### 7.1 Create PhantomBuster Node

Create `/Users/yogs87/Downloads/sanity/projects/lead-generation/automation-engine/nodes/phantombuster-node.js`:

```javascript
import PhantomBusterClient from '../utils/phantombuster-client.js';
import chalk from 'chalk';

class PhantomBusterNode {
  constructor(config = {}) {
    this.name = config.name || 'PhantomBuster';
    this.phantomId = config.phantomId; // e.g., 'linkedin-profile-scraper'
    this.agentId = config.agentId; // Your agent instance ID
    this.argument = config.argument || {};
    this.outputField = config.outputField || 'phantomResults';
  }

  async execute(context) {
    const { logger, mode } = context;

    logger.info(chalk.blue(`[${this.name}] Launching PhantomBuster agent...`));

    // Simulation mode
    if (mode === 'simulate') {
      logger.info(chalk.yellow('[SIMULATION] PhantomBuster call skipped'));

      const simulatedResults = this.generateSimulatedResults(context);
      context.set(this.outputField, simulatedResults);

      logger.info(chalk.green(`[${this.name}] Simulated ${simulatedResults.length} results`));
      return context;
    }

    // Live mode
    const client = new PhantomBusterClient(process.env.PHANTOMBUSTER_API_KEY);

    try {
      // Launch agent
      const containerId = await client.launchAgent(this.agentId, this.argument);
      logger.info(chalk.cyan(`[${this.name}] Agent launched (container: ${containerId})`));

      // Wait for completion
      logger.info(chalk.cyan(`[${this.name}] Waiting for agent to complete...`));
      await client.waitForCompletion(this.agentId);

      // Fetch results
      const results = await client.fetchResults(containerId);
      context.set(this.outputField, results);

      logger.info(chalk.green(`[${this.name}] Retrieved ${results.length} results`));
      return context;

    } catch (error) {
      logger.error(chalk.red(`[${this.name}] PhantomBuster error: ${error.message}`));
      throw error;
    }
  }

  generateSimulatedResults(context) {
    // Generate fake LinkedIn profile data
    const segment = context.get('segment');
    const sampleSize = this.argument.numberOfProfilesPerLaunch || 100;

    return Array.from({ length: sampleSize }, (_, i) => ({
      profileUrl: `https://www.linkedin.com/in/lead-${i + 1}`,
      firstName: `FirstName${i + 1}`,
      lastName: `LastName${i + 1}`,
      headline: `${segment.name} Professional`,
      currentCompany: `Company ${i + 1}`,
      location: 'Mumbai, India',
      email: `lead${i + 1}@company${i + 1}.com`,
      connectionDegree: '2nd'
    }));
  }
}

export default PhantomBusterNode;
```

### 7.2 Update Segment Configuration

Update `config/segments.js` to include PhantomBuster configuration:

```javascript
export const segments = {
  partners: {
    id: 'partners',
    name: 'Partners',
    // ... existing config ...

    phantombuster: {
      enabled: true,
      agents: {
        profileScraper: {
          agentId: 'YOUR_AGENT_ID_HERE',
          phantomId: 'linkedin-profile-scraper',
          argument: {
            numberOfProfilesPerLaunch: 50,
            csvName: 'partners_profiles'
          }
        },
        networkBooster: {
          agentId: 'YOUR_NETWORK_BOOSTER_AGENT_ID',
          phantomId: 'linkedin-network-booster',
          argument: {
            numberOfConnectionsPerLaunch: 20,
            message: 'Hi {firstName}, noticed you run {companyName}...'
          }
        },
        emailExtractor: {
          agentId: 'YOUR_EMAIL_EXTRACTOR_AGENT_ID',
          phantomId: 'linkedin-profile-email-extractor',
          argument: {
            numberOfProfilesPerLaunch: 100
          }
        }
      }
    }
  },

  hni: {
    // ... similar PhantomBuster config for HNI segment
  }
};
```

### 7.3 Add PhantomBuster to Workflow

Update `workflows/partners.workflow.js`:

```javascript
export const partnersWorkflow = {
  id: 'partners-lead-generation',
  name: 'Partners Lead Generation',
  segment: 'partners',
  nodes: [
    { handler: 'TriggerNode', config: { type: 'manual' } },

    // Apify for bulk scraping
    {
      handler: 'ApifyScraperNode',
      config: {
        outputField: 'rawLeads',
        actorId: 'apify/linkedin-company-scraper'
      }
    },

    // PhantomBuster for profile enrichment
    {
      handler: 'PhantomBusterNode',
      config: {
        name: 'LinkedIn Profile Scraper',
        agentId: 'YOUR_AGENT_ID',
        phantomId: 'linkedin-profile-scraper',
        argument: {
          numberOfProfilesPerLaunch: 50,
          csvName: 'partners_enriched'
        },
        outputField: 'enrichedLeads'
      }
    },

    // PhantomBuster for email discovery
    {
      handler: 'PhantomBusterNode',
      config: {
        name: 'Email Extractor',
        agentId: 'YOUR_EMAIL_AGENT_ID',
        phantomId: 'linkedin-profile-email-extractor',
        argument: {
          numberOfProfilesPerLaunch: 100
        },
        outputField: 'leadsWithEmails'
      }
    },

    { handler: 'DataQualityNode' },
    { handler: 'DedupeNode' },
    { handler: 'LeadScoringNode' },
    { handler: 'GoogleSheetsNode' },

    // PhantomBuster for connection automation
    {
      handler: 'PhantomBusterNode',
      config: {
        name: 'Network Booster',
        agentId: 'YOUR_NETWORK_BOOSTER_ID',
        phantomId: 'linkedin-network-booster',
        argument: {
          numberOfConnectionsPerLaunch: 20,
          message: 'Hi {firstName}, noticed you run {companyName}...'
        },
        outputField: 'connectionsSent'
      }
    },

    { handler: 'SlackNotifierNode' },
    { handler: 'SummaryReportNode' }
  ]
};
```

### 7.4 Register PhantomBuster Node

Update `core/workflow-orchestrator.js`:

```javascript
import PhantomBusterNode from '../nodes/phantombuster-node.js';

class WorkflowOrchestrator {
  constructor() {
    this.nodeRegistry = {
      TriggerNode,
      ApifyScraperNode,
      PhantomBusterNode,  // <-- Add this
      DataQualityNode,
      // ... rest of nodes
    };
  }
  // ... rest of class
}
```

---

## 8. Cost Optimization

### 8.1 PhantomBuster Pricing Model

**Execution Time-Based Pricing**:
- Starter: $69/month = 20 hours
- Pro: $149/month = 80 hours
- Team: $439/month = 300 hours

**Phantom Execution Times** (typical):
- Profile scraper: 2-3 seconds per profile
- Email extractor: 5-10 seconds per profile
- Network booster: 10-15 seconds per connection
- Message sender: 5-10 seconds per message

### 8.2 Cost Calculation for PL Capital

**Partners Segment** (500 leads):
- Profile scraping: 500 × 3 sec = 25 minutes
- Email discovery: 500 × 7 sec = 58 minutes
- Connection requests: 100 × 12 sec = 20 minutes
- **Total**: ~1.7 hours/month

**HNI Segment** (2,000 leads):
- Profile scraping: 500 × 3 sec = 25 minutes
- Email discovery: 2,000 × 7 sec = 3.9 hours
- Profile visits: 1,000 × 2 sec = 33 minutes
- Connection requests: 300 × 12 sec = 60 minutes
- **Total**: ~6 hours/month

**UHNI Segment** (200 leads):
- Profile scraping: 200 × 3 sec = 10 minutes
- Social scraping: 100 × 30 sec = 50 minutes
- Profile visits: 200 × 2 sec = 7 minutes
- **Total**: ~1.2 hours/month

**Mass Affluent** (5,000 leads):
- Email discovery: 5,000 × 7 sec = 9.7 hours
- Profile visits: 1,000 × 2 sec = 33 minutes
- **Total**: ~10 hours/month

**Grand Total**: ~19 hours/month → **Fits comfortably in Pro Plan ($149/month)**

### 8.3 Cost Optimization Tips

1. **Batch Operations**: Launch larger batches to reduce overhead
2. **Prioritize High-Value Leads**: Focus PhantomBuster on Hot/Warm leads (score >60)
3. **Use Apify for Bulk**: Apify is cheaper for pure scraping, PhantomBuster for engagement
4. **Schedule Off-Peak**: No pricing difference, but better for LinkedIn safety
5. **Monitor Execution Time**: Track usage weekly to avoid overage charges

---

## 9. Compliance & Best Practices

### 9.1 LinkedIn Automation Limits

**PhantomBuster Safety Features**:
- Built-in rate limiting
- Randomized delays between actions
- Browser fingerprint randomization
- Session management

**Recommended Daily Limits** (per LinkedIn account):
- Profile visits: 100-150/day
- Connection requests: 20-30/day
- Messages: 30-50/day
- Comments: 10-15/day
- Profile scraping: 500-1000/day

**Account Warmup Schedule**:
- Week 1: 10 connections/day, 50 visits/day
- Week 2: 15 connections/day, 75 visits/day
- Week 3: 20 connections/day, 100 visits/day
- Week 4+: 25-30 connections/day, 150 visits/day

### 9.2 LinkedIn ToS Compliance

**Allowed**:
- Scraping publicly available data
- Automated profile visits (within limits)
- Connection requests with personalized messages
- Messaging 1st-degree connections

**Not Allowed** (Risk of Ban):
- Aggressive scraping (>2000 profiles/day)
- Generic mass connection requests
- Spam messaging
- Fake profiles
- Scraping without residential proxies

**PhantomBuster Built-in Compliance**:
- Residential proxy rotation (included)
- Human-like behavior simulation
- CAPTCHA handling
- Session persistence

### 9.3 Data Privacy

**GDPR/India Data Protection**:
- PhantomBuster stores data for 7 days (auto-delete)
- Export and store data securely on your end
- Provide opt-out mechanisms in all emails
- Delete data after 2 years if no engagement

**Email Verification**:
- Use discovered emails responsibly
- Double opt-in for newsletters
- Include unsubscribe link
- Honor opt-out requests within 48 hours

---

## 10. Troubleshooting

### 10.1 Common Issues

**Issue**: Phantom runs but returns no data
**Solution**:
- Check input spreadsheet URL is publicly accessible
- Verify column name matches exactly
- Test with small sample (10 profiles) first
- Check LinkedIn account is logged in

**Issue**: LinkedIn account restricted/banned
**Solution**:
- Reduce daily limits immediately
- Pause automation for 1-2 weeks
- Use different LinkedIn account (aged)
- Ensure residential proxies are enabled

**Issue**: Low email discovery rate (<40%)
**Solution**:
- Many profiles don't have public emails
- Combine PhantomBuster with Hunter.io
- Use company domain + name guessing
- Manual research for high-value UHNIs

**Issue**: PhantomBuster API errors
**Solution**:
- Check API key is valid
- Verify agent ID is correct
- Ensure sufficient execution time remaining
- Check for PhantomBuster service status

**Issue**: Execution time exceeded
**Solution**:
- Upgrade to higher plan
- Optimize phantom configurations
- Reduce batch sizes
- Delete old agents you're not using

### 10.2 PhantomBuster Support

**Resources**:
- **Documentation**: https://hub.phantombuster.com
- **Community**: Slack community (invite via dashboard)
- **Support**: Email support@phantombuster.com
- **Status Page**: https://status.phantombuster.com

**Response Times**:
- Starter: 48 hours
- Pro: 24 hours
- Team: 12 hours

---

## 11. Hybrid Apify + PhantomBuster Workflow

### Recommended Architecture

```
LEAD GENERATION PIPELINE
========================

1. BULK SCRAPING (Apify)
   ↓
   Apify Actors
   - Company Scraper: 800 companies
   - Leads Finder: 7,700 raw leads
   ↓
   Output: LinkedIn URLs, basic profile data

2. ENRICHMENT (PhantomBuster)
   ↓
   PhantomBuster Phantoms
   - Profile Scraper: Complete profiles
   - Email Extractor: Discover work emails
   ↓
   Output: Enriched lead data with emails

3. SCORING & SEGMENTATION (Custom Node)
   ↓
   Lead Scoring Node
   - Apply ICP scoring model
   - Segment into Hot/Warm/Cold
   ↓
   Output: Scored leads

4. ENGAGEMENT (PhantomBuster)
   ↓
   PhantomBuster Phantoms
   - Profile Visitor: Soft outreach (100/day)
   - Network Booster: Connection requests (20/day)
   - Message Sender: Follow-ups (30/day)
   ↓
   Output: Engaged leads

5. NURTURE (n8n + Email)
   ↓
   Email Sequences
   - Hot leads: Personal video + email
   - Warm leads: Educational sequence
   - Cold leads: Newsletter subscription
   ↓
   Output: Discovery calls booked

6. CONVERSION (Manual)
   ↓
   BD Team
   - Discovery calls
   - Portfolio reviews
   - Client onboarding
```

**Cost Breakdown**:
- Apify Pro: $49/month
- PhantomBuster Pro: $149/month
- HeyGen: $100/month (video personalization)
- n8n: Self-hosted (free) or $20/month
- **Total**: $318/month for complete automation stack

**ROI**:
- Investment: $318/month × 12 = $3,816/year
- Projected Revenue: ₹6.4 Cr (125 conversions)
- ROI: 1,677x

---

## 12. Next Steps

### Immediate Actions (This Week)

1. ✅ Review this guide
2. ⬜ Sign up for PhantomBuster Pro ($149/month)
3. ⬜ Create/age dedicated LinkedIn account
4. ⬜ Set up 3 core phantoms:
   - LinkedIn Profile Scraper
   - LinkedIn Profile Email Extractor
   - LinkedIn Network Booster
5. ⬜ Test with 50 leads (Partners segment)
6. ⬜ Integrate PhantomBuster node into automation engine
7. ⬜ Configure environment variables (.env)

### Short-Term (Next 2 Weeks)

8. ⬜ Run pilot workflow (Partners segment, 100 leads)
9. ⬜ Validate data quality and email discovery rate
10. ⬜ Test connection automation (20 requests/day)
11. ⬜ Refine messaging templates based on acceptance rate
12. ⬜ Monitor execution time usage

### Long-Term (Month 1-3)

13. ⬜ Scale to all 4 segments
14. ⬜ Set up automated workflows (scheduled launches)
15. ⬜ A/B test connection request messages
16. ⬜ Integrate with CRM for lead tracking
17. ⬜ Optimize based on performance data
18. ⬜ Consider Sales Navigator upgrade for HNI/UHNI segments

---

## Document Control

**Version**: 1.0
**Created**: 2025-10-23
**Last Updated**: 2025-10-23
**Owner**: Marketing Ops Team

---

**Questions?**

Contact the automation team for PhantomBuster setup assistance or troubleshooting.

🚀 **Ready to automate your LinkedIn outreach with PhantomBuster!**
