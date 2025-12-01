---
name: B2B Lead Generation & Automation
description: Expertise in Apollo.io integration, Apify web scraping, multi-channel outreach automation, and ICP-based lead generation. Specializes in HNI/UHNI targeting, LinkedIn/Instagram scraping, personalized outreach campaigns, and N8N workflow automation.
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep]
---

# B2B Lead Generation & Automation Skill

This skill enables Claude to work with sophisticated lead generation systems combining Apollo.io API, Apify scraping, multi-channel outreach, and automation workflows.

## When to Invoke This Skill

Use this skill when the user needs help with:

- **Apollo.io Integration**: API-based lead discovery and enrichment
- **Apify Scraping**: LinkedIn, Instagram, and social media data extraction
- **ICP Definition**: Ideal Customer Profile creation and targeting
- **Multi-Channel Outreach**: Email, LinkedIn, WhatsApp campaigns
- **Lead Magnets**: Content strategy for lead capture
- **Lookalike Audiences**: Finding similar prospects based on existing clients
- **Automation Engine**: N8N workflow orchestration
- **Outreach Templates**: Personalized messaging frameworks
- **Lead Scoring**: Prioritization and qualification systems

## Core Capabilities

### 1. Project Structure

```
lead-generation/
├── 00_MASTER_STRATEGY.md           # Complete lead gen strategy
├── 01_ICP_DEFINITIONS.md           # Ideal customer profiles
├── 02_APIFY_SCRAPING_GUIDE.md      # Web scraping implementation
├── 03_OUTREACH_TEMPLATES.md        # Email/LinkedIn templates
├── APOLLO_API_INTEGRATION_GUIDE.md # Apollo.io integration
├── APOLLO_INTEGRATION_SUCCESS.md   # Integration completion report
├── APOLLO_INTEGRATION_SUMMARY.md   # Summary and testing
├── automation-engine/              # Automation workflows
│   ├── workflows/                  # N8N workflow definitions
│   ├── scripts/                    # Automation scripts
│   └── config/                     # Configuration files
├── n8n-workflows/                  # N8N JSON exports
├── PL_CAPITAL_CLIENT_PROFILE.md    # Existing client analysis
├── PL_CAPITAL_ICP_DEFINITIONS.md   # Detailed ICP breakdowns
├── PL_CAPITAL_LEAD_MAGNETS_AI_CONTENT_STRATEGY.md
├── PL_CAPITAL_LOOKALIKE_AUDIENCES.md
├── PL_CAPITAL_MULTICHANNEL_OUTREACH_STRATEGY.md
├── CLAUDE.md                       # Claude Code integration guide
└── README.md                       # Project overview
```

### 2. Technology Stack

**Lead Discovery:**
- **Apollo.io API**: 275M+ contacts, company search, enrichment
- **Apify**: LinkedIn, Instagram, website scraping
- **Custom scrapers**: Niche data sources

**Automation:**
- **N8N**: Workflow automation (self-hosted or cloud)
- **Custom scripts**: Node.js/Python automation
- **Webhooks**: Real-time data triggers

**Outreach:**
- **Email**: SMTP, SendGrid, Mailgun
- **LinkedIn**: Sales Navigator + automation tools
- **WhatsApp**: Business API integration

**Data Management:**
- **CRM**: Salesforce, HubSpot, or custom
- **Google Sheets**: Lead lists, tracking
- **PostgreSQL/MongoDB**: Lead database

### 3. Apollo.io Integration

**API Authentication:**
```javascript
const APOLLO_API_KEY = process.env.APOLLO_API_KEY

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache',
  'X-Api-Key': APOLLO_API_KEY,
}
```

**People Search (Find Leads):**
```javascript
async function searchPeople(criteria) {
  const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      // Title criteria
      person_titles: ['CFO', 'CEO', 'Managing Director'],

      // Company criteria
      organization_num_employees_ranges: ['51-200', '201-500', '501-1000'],
      q_organization_domains: ['finance', 'wealth management'],

      // Location
      person_locations: ['India', 'Mumbai', 'Delhi', 'Bangalore'],

      // Net worth (for UHNI targeting)
      person_seniorities: ['owner', 'c_suite', 'director'],

      // Pagination
      page: 1,
      per_page: 25,
    }),
  })

  return await response.json()
}
```

**Enrich Contact:**
```javascript
async function enrichContact(email) {
  const response = await fetch('https://api.apollo.io/v1/people/match', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      email: email,
      // Returns: name, title, company, LinkedIn, phone, etc.
    }),
  })

  return await response.json()
}
```

**Company Search:**
```javascript
async function searchCompanies(criteria) {
  const response = await fetch('https://api.apollo.io/v1/mixed_companies/search', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      organization_num_employees_ranges: ['201-500'],
      q_organization_keyword_tags: ['wealth management', 'family office'],
      q_organization_locations: ['Mumbai, India'],
      page: 1,
    }),
  })

  return await response.json()
}
```

### 4. Apify Scraping Patterns

**LinkedIn Profile Scraper:**
```javascript
import { ApifyClient } from 'apify-client'

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
})

async function scrapeLinkedInProfiles(profileUrls) {
  const run = await client.actor('apify/linkedin-profile-scraper').call({
    startUrls: profileUrls.map(url => ({ url })),
    proxyConfiguration: {
      useApifyProxy: true,
    },
  })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  return items
}
```

**Instagram Scraper (HNI Lifestyle Analysis):**
```javascript
async function scrapeInstagramProfiles(usernames) {
  const run = await client.actor('apify/instagram-scraper').call({
    usernames: usernames,
    resultsLimit: 100, // Posts per profile
    addParentData: true,
  })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  return items
}
```

**Website Contact Scraper:**
```javascript
async function scrapeWebsiteContacts(domain) {
  const run = await client.actor('apify/website-contact-scraper').call({
    startUrls: [{ url: `https://${domain}` }],
    maxDepth: 2,
  })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  return items // Returns emails, phones, social links
}
```

### 5. ICP (Ideal Customer Profile) Targeting

**HNI Segment (₹5-25 Cr):**
```javascript
const HNI_ICP = {
  demographic: {
    age: '35-55',
    netWorth: '₹5 Cr - ₹25 Cr',
    income: '₹50 Lakh - ₹2 Cr/year',
    location: ['Mumbai', 'Delhi', 'Bangalore', 'Pune'],
  },
  professional: {
    titles: ['CEO', 'CFO', 'MD', 'Founder', 'Partner'],
    industries: ['Technology', 'Finance', 'Manufacturing', 'Healthcare'],
    companySize: '50-500 employees',
  },
  behavioral: {
    investmentGoals: ['Wealth preservation', 'Tax efficiency', 'Growth'],
    currentInvestments: ['Mutual funds', 'Direct equity', 'Real estate'],
    painPoints: ['Portfolio underperformance', 'Lack of strategy', 'High taxes'],
  },
  engagement: {
    preferredChannels: ['Email', 'LinkedIn', 'Referrals'],
    contentPreferences: ['Market insights', 'Tax strategies', 'Performance reports'],
  },
}
```

**UHNI Segment (₹25 Cr+):**
```javascript
const UHNI_ICP = {
  demographic: {
    age: '45-65',
    netWorth: '₹25 Cr+',
    income: '₹2 Cr+/year',
    location: ['Mumbai', 'Delhi NCR', 'Bangalore'],
  },
  professional: {
    titles: ['Chairman', 'Promoter', 'Family Office Head'],
    industries: ['Real Estate', 'Manufacturing', 'Technology', 'Private Equity'],
    companySize: '500+ employees or Family Office',
  },
  behavioral: {
    investmentGoals: ['Legacy planning', 'Alternative investments', 'Global diversification'],
    currentInvestments: ['PMS', 'AIF', 'Private equity', 'Real estate', 'International'],
    painPoints: ['Lack of personalization', 'Risk management', 'Succession planning'],
  },
  engagement: {
    preferredChannels: ['Personal introductions', 'Exclusive events', 'WhatsApp'],
    contentPreferences: ['Macro insights', 'Alternative opportunities', 'Thought leadership'],
  },
}
```

### 6. Multi-Channel Outreach Templates

**Cold Email Template (HNI):**
```
Subject: Quick question about your portfolio strategy

Hi {{firstName}},

I noticed you're {{title}} at {{company}}. I've been working with
{{similarCompany}} executives on optimizing their portfolios through
quantitative strategies.

Many are seeing {{metric}} improvement by addressing {{painPoint}}.

Would you be open to a 15-minute call to explore if this could work
for you? No obligation.

Best,
{{senderName}}

P.S. Here's a recent case study: {{caseStudyLink}}
```

**LinkedIn Connection Request:**
```
Hi {{firstName}},

I see you're leading {{company}}'s {{department}}. I work with
similar executives on {{valueProposition}}.

Would love to connect and share insights on {{topicOfInterest}}.
```

**LinkedIn Message (After Connection):**
```
Hi {{firstName}},

Thanks for connecting! I saw your recent post about {{recentTopic}}
and thought you might find this relevant: {{resourceLink}}

We help {{targetAudience}} achieve {{outcome}}. Would you be open
to a quick chat about {{specificBenefit}}?
```

**WhatsApp Template (Warm Lead):**
```
Hi {{firstName}}! 👋

Following up on our {{eventName}} conversation about {{topic}}.

I've put together a custom {{deliverable}} for {{company}} that
shows how {{benefit}}.

Would {{date}} at {{time}} work for a quick call?

- {{senderName}}
```

## Common Commands Reference

### Apollo.io API

```bash
# Search for people
curl -X POST https://api.apollo.io/v1/mixed_people/search \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $APOLLO_API_KEY" \
  -d '{
    "person_titles": ["CFO", "CEO"],
    "person_locations": ["Mumbai, India"],
    "page": 1
  }'

# Enrich contact
curl -X POST https://api.apollo.io/v1/people/match \
  -H "X-Api-Key: $APOLLO_API_KEY" \
  -d '{"email": "contact@example.com"}'

# Get account (check credits)
curl https://api.apollo.io/v1/auth/health \
  -H "X-Api-Key: $APOLLO_API_KEY"
```

### Apify Actors

```bash
# Run LinkedIn scraper via CLI
apify call apify/linkedin-profile-scraper \
  --input '{"startUrls": [{"url": "https://linkedin.com/in/profile"}]}'

# Run Instagram scraper
apify call apify/instagram-scraper \
  --input '{"usernames": ["username1", "username2"]}'

# Get dataset results
apify dataset download {datasetId} --format json
```

## Environment Variables

```bash
# Apollo.io Configuration
APOLLO_API_KEY=your-apollo-api-key

# Apify Configuration
APIFY_API_TOKEN=apify_api_your-token

# Email Outreach
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password

# CRM Integration
HUBSPOT_API_KEY=your-hubspot-key
SALESFORCE_API_KEY=your-salesforce-key

# LinkedIn Automation (use with caution)
LINKEDIN_EMAIL=your-linkedin-email
LINKEDIN_PASSWORD=your-password

# WhatsApp Business API
WHATSAPP_API_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
```

## Key File Locations

- `00_MASTER_STRATEGY.md`: Complete lead generation strategy
- `01_ICP_DEFINITIONS.md`: Target audience profiles
- `02_APIFY_SCRAPING_GUIDE.md`: Web scraping guides and scripts
- `03_OUTREACH_TEMPLATES.md`: Email/LinkedIn/WhatsApp templates
- `APOLLO_API_INTEGRATION_GUIDE.md`: Apollo.io integration docs
- `automation-engine/workflows/`: N8N workflow JSON files
- `PL_CAPITAL_MULTICHANNEL_OUTREACH_STRATEGY.md`: Multi-channel playbook

## Lead Generation Workflow

```
1. ICP Definition
   └─→ Define target segments (HNI, UHNI, Partners)

2. Lead Discovery
   ├─→ Apollo.io: Search by title, company, location
   ├─→ Apify: LinkedIn, Instagram scraping
   └─→ Custom sources: Events, referrals, databases

3. Data Enrichment
   ├─→ Apollo.io: Phone, email, LinkedIn
   ├─→ Instagram analysis: Lifestyle, interests
   └─→ Company data: Revenue, funding, team size

4. Lead Scoring
   ├─→ Firmographic fit (company size, industry)
   ├─→ Behavioral signals (LinkedIn engagement, content consumption)
   └─→ Net worth indicators (job title, company, lifestyle)

5. Segmentation
   ├─→ HNI (₹5-25 Cr): Growth-focused messaging
   ├─→ UHNI (₹25 Cr+): Personalized, exclusive outreach
   └─→ Partners: Commission-based value prop

6. Multi-Channel Outreach
   ├─→ Email: Personalized sequences (3-5 touches)
   ├─→ LinkedIn: Connection + messaging
   └─→ WhatsApp: Warm leads only

7. Nurturing
   ├─→ Content drip: Educational emails
   ├─→ Event invites: Webinars, roundtables
   └─→ Thought leadership: Avatar videos, newsletters

8. Qualification
   ├─→ BANT: Budget, Authority, Need, Timeline
   ├─→ Investment readiness: Net worth, current portfolio
   └─→ Fit score: ICP alignment

9. Handoff to Sales
   └─→ Warm introduction, context sharing, meeting scheduling
```

## Advanced Automation Patterns

### N8N Workflow Example

```json
{
  "name": "HNI Lead Generation Workflow",
  "nodes": [
    {
      "name": "Apollo Search",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.apollo.io/v1/mixed_people/search",
        "method": "POST",
        "bodyParametersJson": "{\"person_titles\": [\"CFO\", \"CEO\"]}"
      }
    },
    {
      "name": "Enrich with Apify",
      "type": "n8n-nodes-base.apify",
      "parameters": {
        "actorId": "apify/linkedin-profile-scraper"
      }
    },
    {
      "name": "Score & Filter",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "// Score leads based on ICP fit\nreturn items.filter(lead => lead.score > 80)"
      }
    },
    {
      "name": "Send to CRM",
      "type": "n8n-nodes-base.hubspot",
      "parameters": {
        "operation": "create",
        "resource": "contact"
      }
    },
    {
      "name": "Trigger Email Sequence",
      "type": "n8n-nodes-base.sendGrid",
      "parameters": {
        "templateId": "d-xxx"
      }
    }
  ]
}
```

## Troubleshooting Guide

**Apollo.io API Errors:**
- 401 Unauthorized: Check `X-Api-Key` header
- 429 Rate Limited: Slow down requests (max 10/sec)
- Empty results: Broaden search criteria
- Check credits: `GET /v1/auth/health`

**Apify Scraping Issues:**
- LinkedIn blocking: Use residential proxies
- Instagram rate limits: Reduce resultsLimit
- Empty datasets: Check actor input parameters
- Check run status: View in Apify console

**Email Deliverability:**
- SPF/DKIM/DMARC: Configure email authentication
- Warm up domain: Start with low volume
- Avoid spam triggers: Personalize, avoid caps/exclamation
- Monitor bounce rate: Keep <5%

**N8N Workflow Failures:**
- Check node credentials
- Verify API quotas (Apollo, Apify)
- Review error messages in execution log
- Test nodes individually

## Best Practices

1. **Compliance**: Follow GDPR, CAN-SPAM, LinkedIn ToS
2. **Personalization**: Reference specific details (LinkedIn posts, company news)
3. **Multi-Touch**: 5-7 touches across 2-3 channels
4. **A/B Testing**: Test subject lines, CTAs, send times
5. **Data Hygiene**: Clean lists, remove bounces, update records
6. **Lead Scoring**: Prioritize high-fit, high-intent leads
7. **Automation Ethics**: Avoid spammy tactics, respect opt-outs
8. **Analytics**: Track open rates, reply rates, conversion rates

## Performance Metrics

**Lead Generation KPIs:**
- Leads discovered: 500-1000/month
- Enrichment rate: >80%
- Lead score distribution: 30% high, 50% medium, 20% low

**Outreach KPIs:**
- Email open rate: 25-40%
- Email reply rate: 5-10%
- LinkedIn acceptance rate: 30-50%
- LinkedIn reply rate: 10-20%

**Conversion KPIs:**
- Qualified leads: 10-15% of outreach
- Consultation bookings: 30-40% of qualified
- Closed deals: 20-30% of consultations

## Related Skills

- **AI Content Workflow**: For automated content creation and lead magnets
- **HeyGen Avatar Integration**: For personalized video outreach
- **Sanity CMS**: For content management and lead magnets
- **Systematic Debugging**: For troubleshooting automation issues
- **Content Research Writer**: For creating lead magnet content
