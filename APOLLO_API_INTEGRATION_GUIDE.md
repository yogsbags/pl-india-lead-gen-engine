# Apollo.io API Integration Guide

**Created:** 2025-10-17
**Purpose:** Complete reference for Apollo.io API integration in PL Capital lead generation workflows
**API Documentation:** https://docs.apollo.io/

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Code Examples](#code-examples)
5. [Workflow Integration](#workflow-integration)
6. [Rate Limits & Best Practices](#rate-limits--best-practices)
7. [Error Handling](#error-handling)
8. [Testing](#testing)

---

## 🎯 Overview

Apollo.io provides a comprehensive B2B data platform with 275M+ contacts and 73M+ companies. This integration enables:

- **Lead Enrichment:** Add missing emails, phone numbers, LinkedIn URLs, job titles
- **People Search:** Find IFAs, HNIs, and other prospects based on criteria
- **Organization Search:** Discover companies matching target profiles
- **CRM Sync:** Create/update contacts, accounts, deals in Apollo CRM
- **Sequence Automation:** Enroll leads in email sequences
- **Activity Tracking:** Log calls, tasks, and touchpoints

### Key Benefits

- **275M+ contacts** in database (highest coverage for India)
- **Verified emails & phone numbers** (95%+ accuracy)
- **Real-time enrichment** (API response <2s)
- **Bulk operations** (10 leads per request)
- **Rate limiting built-in** (10,000 requests/hour)

---

## 🔐 Authentication

### API Key Setup

1. **Get API Key:**
   - Log in to Apollo.io
   - Navigate to Settings → Integrations → API
   - Copy your API key

2. **Add to Environment Variables:**
   ```bash
   # Add to automation-engine/.env
   APOLLO_API_KEY=your_api_key_here
   ```

3. **Verify Access:**
   ```bash
   cd automation-engine
   node -e "const ApolloAPI = require('./services/apollo-api'); const apollo = new ApolloAPI(process.env.APOLLO_API_KEY); apollo.getUsageStats().then(console.log);"
   ```

### Authentication Method

All Apollo API requests require the API key in the header:

```http
X-Api-Key: your_api_key_here
Content-Type: application/json
```

---

## 📚 API Endpoints Reference

### 1️⃣ Enrichment APIs

#### **People Enrichment**
**Endpoint:** `POST https://api.apollo.io/v1/people/match`

Enrich a single person with email or LinkedIn URL.

**Request:**
```json
{
  "email": "rajesh@jaininvestment.com",
  "first_name": "Rajesh",
  "last_name": "Kanojia",
  "organization_name": "Jain Investment",
  "reveal_personal_emails": true,
  "reveal_phone_number": true
}
```

**Response:**
```json
{
  "person": {
    "id": "5f5e2b4c8d3c4a0017b4c3d2",
    "first_name": "Rajesh",
    "last_name": "Kanojia",
    "name": "Rajesh Kanojia",
    "email": "rajesh@jaininvestment.com",
    "email_status": "verified",
    "phone_numbers": [
      {
        "raw_number": "+91-98765-43210",
        "sanitized_number": "+919876543210",
        "type": "mobile"
      }
    ],
    "title": "Financial Advisor",
    "seniority": "senior",
    "departments": ["Finance"],
    "linkedin_url": "https://linkedin.com/in/rajesh-kanojia-37336346",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "organization": {
      "id": "5f5e2b4c8d3c4a0017b4c3d3",
      "name": "Jain Investment",
      "primary_domain": "jaininvestment.com",
      "industry": "Financial Services",
      "estimated_num_employees": 25
    }
  }
}
```

---

#### **Bulk People Enrichment**
**Endpoint:** `POST https://api.apollo.io/v1/people/bulk_match`

Enrich up to 10 people in a single request.

**Request:**
```json
{
  "details": [
    {
      "email": "person1@company.com"
    },
    {
      "linkedin_url": "https://linkedin.com/in/person2"
    },
    {
      "first_name": "John",
      "last_name": "Doe",
      "organization_name": "TechCorp"
    }
  ],
  "reveal_personal_emails": true,
  "reveal_phone_number": true
}
```

**Response:**
```json
{
  "matches": [
    { "person": { /* enriched data */ } },
    { "person": { /* enriched data */ } },
    { "person": { /* enriched data */ } }
  ]
}
```

**Credit Cost:** 1 credit per person enriched

---

#### **Organization Enrichment**
**Endpoint:** `GET https://api.apollo.io/v1/organizations/enrich?domain={domain}`

Enrich a company/organization.

**Request:**
```bash
GET /v1/organizations/enrich?domain=jaininvestment.com
```

**Response:**
```json
{
  "organization": {
    "id": "5f5e2b4c8d3c4a0017b4c3d3",
    "name": "Jain Investment",
    "primary_domain": "jaininvestment.com",
    "website_url": "https://www.jaininvestment.com",
    "industry": "Financial Services",
    "estimated_num_employees": 25,
    "estimated_annual_revenue": "$5M-$10M",
    "phone": "+91-22-1234-5678",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "linkedin_url": "https://linkedin.com/company/jain-investment",
    "facebook_url": null,
    "twitter_url": null
  }
}
```

**Credit Cost:** 1 credit per organization

---

### 2️⃣ Search APIs

#### **People Search**
**Endpoint:** `POST https://api.apollo.io/v1/mixed_people/search`

Search for people matching criteria.

**Request (IFA Search Example):**
```json
{
  "person_titles": [
    "Financial Advisor",
    "Wealth Manager",
    "Investment Advisor"
  ],
  "person_locations": [
    "Mumbai, India",
    "Delhi, India",
    "Bangalore, India"
  ],
  "organization_num_employees_ranges": [
    "1,50",
    "51,200"
  ],
  "q_organization_keyword_tags": [
    "Financial Services",
    "Wealth Management"
  ],
  "per_page": 50,
  "page": 1
}
```

**Response:**
```json
{
  "people": [
    {
      "id": "...",
      "first_name": "Rajesh",
      "last_name": "Kanojia",
      "email": "rajesh@jaininvestment.com",
      "title": "Financial Advisor",
      "organization_name": "Jain Investment",
      "city": "Mumbai",
      "country": "India"
    }
    // ... up to 50 results
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total_entries": 1250,
    "total_pages": 25
  }
}
```

**Credit Cost:** 1 credit per person revealed (email/phone)

**Common Search Filters:**
```json
{
  "person_titles": ["CEO", "Founder", "Managing Director"],
  "person_seniorities": ["c_suite", "owner", "founder"],
  "person_locations": ["Mumbai, India"],
  "organization_num_employees_ranges": [
    "51,200",    // 51-200 employees
    "201,500",   // 201-500
    "501,1000",  // 501-1000
    "1001,5000"  // 1001-5000
  ],
  "revenue_range": {
    "min": 5000000,   // $5M
    "max": 50000000   // $50M
  },
  "q_keywords": "financial advisor wealth management"
}
```

---

#### **Organization Search**
**Endpoint:** `POST https://api.apollo.io/v1/mixed_companies/search`

Search for companies matching criteria.

**Request:**
```json
{
  "q_organization_keyword_tags": [
    "Financial Services",
    "Wealth Management",
    "Investment Advisory"
  ],
  "organization_locations": [
    "Mumbai, India",
    "Bangalore, India"
  ],
  "organization_num_employees_ranges": [
    "11,50",
    "51,200"
  ],
  "revenue_range": {
    "min": 1000000,
    "max": 10000000
  },
  "per_page": 50,
  "page": 1
}
```

**Response:**
```json
{
  "organizations": [
    {
      "id": "...",
      "name": "Jain Investment",
      "primary_domain": "jaininvestment.com",
      "industry": "Financial Services",
      "estimated_num_employees": 25,
      "city": "Mumbai",
      "country": "India"
    }
    // ... up to 50 results
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total_entries": 350,
    "total_pages": 7
  }
}
```

**Credit Cost:** Free for search, 1 credit per enrichment

---

### 3️⃣ CRM APIs

#### **Create Contact**
**Endpoint:** `POST https://api.apollo.io/v1/contacts`

Add a new contact to Apollo CRM.

**Request:**
```json
{
  "first_name": "Rajesh",
  "last_name": "Kanojia",
  "email": "rajesh@jaininvestment.com",
  "title": "Financial Advisor",
  "organization_name": "Jain Investment",
  "label_names": ["Partners", "Hot Lead"]
}
```

**Response:**
```json
{
  "contact": {
    "id": "abc123",
    "first_name": "Rajesh",
    "last_name": "Kanojia",
    "email": "rajesh@jaininvestment.com",
    "created_at": "2025-10-17T10:00:00Z"
  }
}
```

---

#### **Search Contacts**
**Endpoint:** `POST https://api.apollo.io/v1/contacts/search`

Find contacts in your Apollo CRM.

**Request:**
```json
{
  "q_keywords": "Financial Advisor",
  "label_names": ["Partners"],
  "per_page": 50
}
```

---

#### **Create Account**
**Endpoint:** `POST https://api.apollo.io/v1/accounts`

Add a company to Apollo CRM.

**Request:**
```json
{
  "name": "Jain Investment",
  "domain": "jaininvestment.com",
  "phone_number": "+91-22-1234-5678",
  "industry": "Financial Services"
}
```

---

#### **Create Deal**
**Endpoint:** `POST https://api.apollo.io/v1/opportunities`

Create a sales opportunity/deal.

**Request:**
```json
{
  "name": "PMS Partnership - Jain Investment",
  "amount": 500000,
  "account_id": "account_abc123",
  "contact_ids": ["contact_xyz789"],
  "stage_name": "Discovery"
}
```

---

### 4️⃣ Sequence APIs

#### **Search Sequences**
**Endpoint:** `POST https://api.apollo.io/v1/emailer_campaigns/search`

Find email sequences in your account.

**Request:**
```json
{
  "q_keywords": "Partners Outreach"
}
```

---

#### **Add Contacts to Sequence**
**Endpoint:** `POST https://api.apollo.io/v1/emailer_campaigns/add_contact_ids`

Enroll contacts in an email sequence.

**Request:**
```json
{
  "emailer_campaign_id": "sequence_123",
  "contact_ids": ["contact1", "contact2", "contact3"],
  "mailbox_id": "mailbox_456"
}
```

---

### 5️⃣ Activity APIs

#### **Create Call Record**
**Endpoint:** `POST https://api.apollo.io/v1/calls`

Log a phone call.

**Request:**
```json
{
  "contact_id": "contact_abc123",
  "note": "Discussed PMS features and commission structure. Next: Send proposal.",
  "disposition": "Interested",
  "duration": 1200,
  "recorded_at": "2025-10-17T14:30:00Z"
}
```

---

#### **Create Task**
**Endpoint:** `POST https://api.apollo.io/v1/tasks`

Create a follow-up task.

**Request:**
```json
{
  "note": "Send PMS partnership proposal",
  "contact_id": "contact_abc123",
  "due_at": "2025-10-20T10:00:00Z",
  "type": "call"
}
```

---

### 6️⃣ Miscellaneous

#### **Get Usage Stats**
**Endpoint:** `GET https://api.apollo.io/v1/auth/health`

Check API usage and remaining credits.

**Response:**
```json
{
  "credits_remaining": 8543,
  "credits_monthly_limit": 10000,
  "requests_this_hour": 127,
  "requests_hourly_limit": 10000
}
```

---

## 💻 Code Examples

### Node.js Implementation

#### **1. Initialize Apollo API Client**

```javascript
const ApolloAPI = require('./services/apollo-api');

const apollo = new ApolloAPI(process.env.APOLLO_API_KEY);
```

---

#### **2. Enrich Single Lead**

```javascript
async function enrichLead() {
  try {
    const enriched = await apollo.enrichPerson({
      email: 'rajesh@jaininvestment.com',
      first_name: 'Rajesh',
      last_name: 'Kanojia',
      organization_name: 'Jain Investment',
      reveal_personal_emails: true,
      reveal_phone_number: true
    });

    console.log('Enriched Lead:', enriched.person);
    console.log('Email:', enriched.person.email);
    console.log('Phone:', enriched.person.phone_numbers[0]?.sanitized_number);
    console.log('LinkedIn:', enriched.person.linkedin_url);
  } catch (error) {
    console.error('Enrichment failed:', error.message);
  }
}
```

---

#### **3. Bulk Enrich Multiple Leads**

```javascript
async function bulkEnrich() {
  const leads = [
    { email: 'person1@company.com' },
    { email: 'person2@company.com' },
    { linkedin_url: 'https://linkedin.com/in/person3' }
  ];

  try {
    const enriched = await apollo.bulkEnrichPeople(
      leads,
      true, // reveal_personal_emails
      true  // reveal_phone_number
    );

    enriched.matches.forEach((match, index) => {
      console.log(`Lead ${index + 1}:`, match.person.email);
    });
  } catch (error) {
    console.error('Bulk enrichment failed:', error.message);
  }
}
```

---

#### **4. Search for IFAs**

```javascript
async function searchIFAs() {
  try {
    const results = await apollo.searchIFAs({
      locations: ['Mumbai, India', 'Delhi, India'],
      per_page: 50
    });

    console.log(`Found ${results.pagination.total_entries} IFAs`);

    results.people.forEach(person => {
      console.log(`${person.name} - ${person.title} at ${person.organization_name}`);
    });
  } catch (error) {
    console.error('Search failed:', error.message);
  }
}
```

---

#### **5. Full Lead Enrichment Workflow**

```javascript
async function fullEnrichment() {
  const lead = {
    email: 'rajesh@jaininvestment.com',
    first_name: 'Rajesh',
    last_name: 'Kanojia',
    company: 'Jain Investment'
  };

  try {
    // Step 1: Enrich person + organization
    const enriched = await apollo.fullLeadEnrichment(lead);

    console.log('Person Data:', enriched.person);
    console.log('Organization Data:', enriched.organization);

    // Step 2: Create contact in Apollo CRM
    const contact = await apollo.createContact({
      first_name: enriched.person.first_name,
      last_name: enriched.person.last_name,
      email: enriched.person.email,
      title: enriched.person.title,
      organization_name: enriched.organization.name
    });

    console.log('Contact created:', contact.contact.id);

    // Step 3: Create task to follow up
    const task = await apollo.createTask({
      note: `Follow up with ${enriched.person.name} about PMS partnership`,
      contact_id: contact.contact.id,
      due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    });

    console.log('Task created:', task.task.id);
  } catch (error) {
    console.error('Workflow failed:', error.message);
  }
}
```

---

#### **6. Batch Process 100 Leads**

```javascript
async function batchProcess100Leads(leads) {
  console.log(`Processing ${leads.length} leads...`);

  // Apollo bulk API limit: 10 per request
  const enriched = await apollo.batchLeadEnrichment(
    leads,
    true, // reveal_personal_emails
    true  // reveal_phone_number
  );

  // Analyze results
  const successful = enriched.filter(l => !l.error);
  const failed = enriched.filter(l => l.error);

  console.log(`✅ Enriched: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  return successful;
}
```

---

## 🔄 Workflow Integration

### Add Apollo Enrichment to Workflow

#### **1. Update Workflow Definition**

Edit `automation-engine/workflows/partners.workflow.js`:

```javascript
module.exports = {
  id: 'partners',
  name: 'Partners Segment Workflow',
  nodes: [
    {
      id: 'trigger',
      type: 'TriggerNode',
      config: {}
    },
    {
      id: 'scraper',
      type: 'ApifyScraperNode',
      config: {
        actorId: 'unlimitedleadtestinbox/unlimited-leads-scraper',
        sampleSize: 50
      }
    },
    // ADD THIS NODE ⬇️
    {
      id: 'apollo_enrichment',
      type: 'ApolloEnrichmentNode',
      config: {
        fullEnrichment: true, // Include organization data
        batchSize: 10
      }
    },
    // ⬆️
    {
      id: 'data_quality',
      type: 'DataQualityNode',
      config: {}
    },
    // ... rest of workflow
  ]
};
```

---

#### **2. Register Node in Orchestrator**

Edit `automation-engine/core/workflow-orchestrator.js`:

```javascript
const ApolloEnrichmentNode = require('../nodes/apollo-enrichment-node');

class WorkflowOrchestrator {
  constructor() {
    this.nodeRegistry = {
      TriggerNode,
      ApifyScraperNode,
      ApolloEnrichmentNode, // ADD THIS ⬅️
      DataQualityNode,
      // ... rest
    };
  }
}
```

---

#### **3. Set Environment Variable**

Add to `automation-engine/.env`:

```bash
APOLLO_API_KEY=your_apollo_api_key_here
```

---

#### **4. Run Workflow**

```bash
cd automation-engine

# Test in simulation mode (no API calls)
npm run run:partners

# Run in live mode (real Apollo API calls)
npm run run:partners -- --live
```

---

## ⚡ Rate Limits & Best Practices

### Rate Limits

Apollo enforces the following limits:

| Limit Type | Value | Notes |
|------------|-------|-------|
| **Requests per hour** | 10,000 | ~167 requests/min |
| **Requests per second** | ~3 | Recommended safe limit: 2/sec |
| **Bulk enrichment size** | 10 people | Per request |
| **Search results per page** | 100 | Max per_page value |

**Built-in Rate Limiting:**

The `ApolloAPI` class includes automatic throttling:

```javascript
// Configured in apollo-api.js
this.requestsPerSecond = 2; // Safe limit (below 3/sec max)

// Automatic throttling between requests
await this.throttle(); // Ensures 500ms between requests
```

---

### Best Practices

#### **1. Use Bulk APIs**

❌ **Bad: 10 separate enrichment calls**
```javascript
for (const lead of leads) {
  await apollo.enrichPerson({ email: lead.email });
}
// Cost: 10 API calls
```

✅ **Good: 1 bulk enrichment call**
```javascript
await apollo.bulkEnrichPeople(leads.slice(0, 10));
// Cost: 1 API call
```

---

#### **2. Cache Enriched Data**

```javascript
// Store enriched leads to avoid re-enriching
const enrichedLeads = await apollo.batchLeadEnrichment(leads);

// Save to database/file
fs.writeFileSync('enriched_leads.json', JSON.stringify(enrichedLeads));

// Next run: Load from cache instead of re-enriching
const cached = JSON.parse(fs.readFileSync('enriched_leads.json'));
```

---

#### **3. Handle Errors Gracefully**

```javascript
try {
  const enriched = await apollo.enrichPerson({ email: 'invalid' });
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, 60000)); // 1 min
    return apollo.enrichPerson({ email: 'invalid' });
  } else {
    // Log and continue
    console.error('Enrichment failed:', error.message);
    return null;
  }
}
```

---

#### **4. Prioritize High-Value Leads**

```javascript
// Enrich only Hot/Warm leads (score ≥ 60)
const highValueLeads = leads.filter(l => l.score >= 60);
const enriched = await apollo.batchLeadEnrichment(highValueLeads);
```

---

#### **5. Monitor Credit Usage**

```javascript
// Check credits before large batch
const stats = await apollo.getUsageStats();

if (stats.credits_remaining < 1000) {
  console.warn('Low credits remaining:', stats.credits_remaining);
  // Alert team or pause workflow
}
```

---

## 🚨 Error Handling

### Common Errors

#### **1. Invalid API Key (401)**

```javascript
// Error: Apollo API: Invalid API key

// Solution:
// 1. Verify APOLLO_API_KEY in .env
// 2. Check key is active in Apollo.io dashboard
// 3. Ensure no extra spaces/newlines in key
```

---

#### **2. Rate Limit Exceeded (429)**

```javascript
// Error: Apollo API: Rate limit exceeded - please retry later

// Solution:
// 1. Wait 60 seconds and retry
// 2. Reduce requestsPerSecond in apollo-api.js
// 3. Implement exponential backoff
```

**Exponential Backoff Example:**

```javascript
async function enrichWithRetry(lead, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apollo.enrichPerson(lead);
    } catch (error) {
      if (error.message.includes('Rate limit') && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

---

#### **3. No Data Found**

```javascript
// Person not found in Apollo database

const enriched = await apollo.enrichPerson({ email: 'notfound@example.com' });

if (!enriched.person) {
  console.log('Person not found in Apollo database');
  // Fallback: Try other enrichment sources (Hunter.io, Clearbit)
}
```

---

#### **4. Invalid Email Format**

```javascript
// Solution: Validate email before enrichment
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (isValidEmail(lead.email)) {
  await apollo.enrichPerson({ email: lead.email });
} else {
  console.warn('Invalid email format:', lead.email);
}
```

---

## 🧪 Testing

### Test Script

Create `automation-engine/test/test-apollo.js`:

```javascript
const ApolloAPI = require('../services/apollo-api');

async function testApollo() {
  const apollo = new ApolloAPI(process.env.APOLLO_API_KEY);

  console.log('🧪 Testing Apollo API Integration\n');

  // Test 1: Get usage stats
  console.log('Test 1: Get Usage Stats');
  const stats = await apollo.getUsageStats();
  console.log('✅ Credits remaining:', stats.credits_remaining);
  console.log('✅ Requests this hour:', stats.requests_this_hour);
  console.log('');

  // Test 2: Enrich single person
  console.log('Test 2: Enrich Single Person');
  const person = await apollo.enrichPerson({
    email: 'test@example.com',
    reveal_personal_emails: true,
    reveal_phone_number: true
  });
  console.log('✅ Person enriched:', person.person ? 'Success' : 'Not found');
  console.log('');

  // Test 3: Search for IFAs
  console.log('Test 3: Search for IFAs');
  const results = await apollo.searchIFAs({
    locations: ['Mumbai, India'],
    per_page: 10
  });
  console.log('✅ Found:', results.pagination.total_entries, 'IFAs');
  console.log('✅ First result:', results.people[0]?.name);
  console.log('');

  console.log('🎉 All tests passed!');
}

testApollo().catch(console.error);
```

**Run Tests:**

```bash
cd automation-engine
node test/test-apollo.js
```

---

### Integration Test in Workflow

```bash
# Test enrichment in full workflow (simulation mode)
npm run run:partners

# Check enrichment stats in output
cat data/executions.json | jq '.[-1].enrichment_stats'
```

**Expected Output:**

```json
{
  "total": 50,
  "enriched": 48,
  "failed": 2,
  "skipped": 0,
  "success_rate": "96%",
  "fields_added": {
    "email": 5,
    "phone": 42,
    "linkedin": 10,
    "job_title": 3,
    "company_info": 45
  }
}
```

---

## 📊 Credit Usage Optimization

### Credit Costs

| Operation | Cost | Notes |
|-----------|------|-------|
| **People Search** | Free | No cost to search |
| **People Enrichment** | 1 credit | Per person enriched |
| **Bulk Enrichment (10)** | 10 credits | 1 credit per person |
| **Organization Enrichment** | 1 credit | Per organization |
| **Export to CSV** | Free | No additional cost |

### Monthly Credit Plans

| Plan | Monthly Credits | Cost | Cost per Credit |
|------|----------------|------|-----------------|
| **Basic** | 1,200 | $49/month | $0.041 |
| **Professional** | 12,000 | $99/month | $0.008 |
| **Organization** | Unlimited | $199/month | $0.00 |

**Recommendation:** Organization plan ($199/month) for 7,700 leads = $0/lead

---

### Optimization Strategies

#### **1. Enrich Only When Necessary**

```javascript
// Skip enrichment if lead already has email + phone
const needsEnrichment = leads.filter(l => !l.email || !l.phone);
const enriched = await apollo.batchLeadEnrichment(needsEnrichment);
```

#### **2. Use Search Instead of Enrichment**

```javascript
// Search is FREE, only pay when enriching
const searchResults = await apollo.searchIFAs({ per_page: 100 });

// Enrich only top 50 (by score)
const topLeads = searchResults.people.slice(0, 50);
const enriched = await apollo.batchLeadEnrichment(topLeads);
```

#### **3. Enrich in Stages**

```javascript
// Stage 1: Enrich Hot leads first (score ≥ 80)
const hotLeads = leads.filter(l => l.score >= 80);
await apollo.batchLeadEnrichment(hotLeads);

// Stage 2: Enrich Warm leads after 1 week
const warmLeads = leads.filter(l => l.score >= 60 && l.score < 80);
// ... enrich later
```

---

## 🎯 Use Cases by Segment

### Partners (IFAs)

```javascript
// Search for IFAs
const ifas = await apollo.searchPeople({
  person_titles: ['Financial Advisor', 'Wealth Manager', 'IFA'],
  person_locations: ['Mumbai, India', 'Delhi, India'],
  organization_num_employees_ranges: ['1,50'],
  per_page: 100
});

// Enrich top 50
const enriched = await apollo.batchLeadEnrichment(ifas.people.slice(0, 50));
```

---

### HNI

```javascript
// Search for CEOs, Founders
const hnis = await apollo.searchHNIs({
  locations: ['Mumbai, India'],
  per_page: 100
});

// Enrich and filter by company size
const enriched = await apollo.batchLeadEnrichment(hnis.people);
const qualified = enriched.filter(l => l.company_size >= 100);
```

---

### UHNI

```javascript
// Search for C-suite in large companies
const uhnis = await apollo.searchPeople({
  person_seniorities: ['c_suite', 'owner'],
  organization_num_employees_ranges: ['1001,5000', '5001,10000'],
  person_locations: ['Mumbai, India', 'Delhi, India'],
  per_page: 50
});

// Full enrichment (person + organization)
const enriched = await Promise.all(
  uhnis.people.map(p => apollo.fullLeadEnrichment(p))
);
```

---

## 📝 Summary

### Key Takeaways

✅ **Apollo provides 275M+ contacts** with 95%+ verified emails
✅ **Bulk enrichment saves credits** (10 leads per API call)
✅ **Built-in rate limiting** prevents API errors
✅ **Search is free**, pay only for enrichment
✅ **Organization plan recommended** for unlimited credits

### Next Steps

1. **Get Apollo API Key:** https://app.apollo.io/#/settings/integrations/api
2. **Add to .env:** `APOLLO_API_KEY=your_key_here`
3. **Test Integration:** `node test/test-apollo.js`
4. **Run Workflow:** `npm run run:partners -- --live`
5. **Monitor Credits:** Check usage in Apollo dashboard

---

**For support, contact:** PL Capital Tech Team
**Apollo Support:** support@apollo.io
**API Docs:** https://docs.apollo.io/
