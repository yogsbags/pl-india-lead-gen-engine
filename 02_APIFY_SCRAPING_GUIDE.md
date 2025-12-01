# Apify Lead Scraping Implementation Guide

**Purpose**: Step-by-step instructions for scraping leads using Apify Actors

---

## 1. Apify Setup

### 1.1 Account Setup
1. Create Apify account at https://apify.com
2. Add payment method (credit card)
3. Set budget alerts ($100, $300, $500)
4. Review pricing tiers (consider GOLD tier for volume: $49/month)

### 1.2 Recommended Pricing Tier

**For PL Capital Lead Gen (7,700 total leads)**:

Option 1: **Pay-as-you-go (FREE tier)**
- No monthly fee
- Higher per-result costs
- Good for testing
- Estimated cost: $2,200

Option 2: **GOLD Tier** ($49/month + usage)
- 30-50% discount on results
- Priority support
- Better for production
- Estimated cost: $1,500 + $49

**Recommendation**: Start with FREE tier for testing, upgrade to GOLD after successful pilot.

---

## 2. Actor Selection & Configuration

### 2.1 Primary Actors for PL Capital

#### Actor 1: LinkedIn Profile Enrichment
**Actor ID**: `anchor/linkedin-profile-enrichment`
**Use Case**: Primary profile scraping for all segments
**Cost**: $4-10 per 1000 profiles (tiered)
**Success Rate**: 99.4%

**Configuration**:
```json
{
  "profiles": [
    "https://www.linkedin.com/in/profile1/",
    "https://www.linkedin.com/in/profile2/"
  ],
  "maxConcurrency": 10,
  "proxy": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

**Input Methods**:
1. Upload CSV with LinkedIn URLs
2. Paste URLs directly
3. Import from previous dataset

**Output Fields**:
- Full name
- Current title
- Current company
- Location
- Experience summary
- Education
- Skills
- Profile URL
- Email (if available)
- Phone (if available)

---

#### Actor 2: Leads Finder with Emails
**Actor ID**: `code_crafter/leads-finder`
**Use Case**: B2B lead generation with verified emails
**Cost**: $1.5 per 1000 leads
**Success Rate**: 91.9%

**Configuration**:
```json
{
  "searchQueries": [
    {
      "title": "Financial Advisor",
      "location": "Mumbai, India",
      "industry": "Financial Services"
    },
    {
      "title": "CEO",
      "location": "Bangalore, India",
      "companySize": "51-500"
    }
  ],
  "maxResults": 1000,
  "includeEmail": true,
  "includePhone": true
}
```

**Advanced Filters**:
- Title keywords
- Location (city, country)
- Industry
- Company size
- Seniority level
- Years of experience

---

#### Actor 3: LinkedIn Company Scraper
**Actor ID**: `dev_fusion/Linkedin-Company-Scraper`
**Use Case**: Partner segment (IFA firms, wealth management companies)
**Cost**: $8 per 1000 companies
**Success Rate**: 99.9%

**Configuration**:
```json
{
  "companyUrls": [
    "https://www.linkedin.com/company/company1/",
    "https://www.linkedin.com/company/company2/"
  ],
  "includeEmployees": false,
  "maxConcurrency": 5
}
```

**Output Fields**:
- Company name
- Industry
- Company size (employee count)
- Website
- Description
- Location
- Specialties
- Founded year

---

#### Actor 4: Contact Details Scraper
**Actor ID**: `poidata/contact-details-scraper`
**Use Case**: Email/phone enrichment from company websites
**Cost**: $8-20 per 1000 results
**Success Rate**: 99.4%

**Configuration**:
```json
{
  "startUrls": [
    {"url": "https://www.company1.com"},
    {"url": "https://www.company2.com"}
  ],
  "scrapeEmails": true,
  "scrapePhones": true,
  "scrapeSocialMedia": true,
  "maxDepth": 2
}
```

---

#### Actor 5: Bulk Email Finder
**Actor ID**: `icypeas_official/bulk-email-finder`
**Use Case**: Verify and find professional emails
**Cost**: $28 per 1000 emails
**Success Rate**: 100%

**Configuration**:
```json
{
  "prospects": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "companyDomain": "company.com"
    }
  ],
  "verifyEmails": true
}
```

---

## 3. Lead Scraping Workflows

### 3.1 Partners Segment Workflow (Target: 500 leads)

**Step 1: LinkedIn Company Search**
```
Search Query: "financial advisor" OR "wealth management"
Location: Mumbai, Delhi, Bangalore, Pune
Filters: Company size (1-50), Financial Services industry
```

**Step 2: Scrape Company Profiles**
- Actor: `dev_fusion/Linkedin-Company-Scraper`
- Input: 800 company URLs (to get 500 qualified)
- Output: Company details

**Step 3: Find Decision Makers**
- Manual: Visit company page → People tab → Filter by "Founder/Owner"
- OR Use: `anchor/linkedin-profile-enrichment` for individual profiles

**Step 4: Enrich with Contact Data**
- Actor: `poidata/contact-details-scraper`
- Input: Company websites from Step 2
- Output: Email, phone, social media

**Step 5: Email Verification**
- Actor: `icypeas_official/bulk-email-finder`
- Input: Name + Company domain
- Output: Verified work email

**Estimated Cost**: $10 (500 companies + enrichment)
**Timeline**: 2-3 hours runtime

---

### 3.2 HNI Segment Workflow (Target: 2000 leads)

**Step 1: Define LinkedIn Search**
```
Title: "CEO" OR "CFO" OR "Founder" OR "Director" OR "VP"
Location: Mumbai, Delhi NCR, Bangalore, Pune, Hyderabad
Company Size: 51-1000
Industry: Technology, Healthcare, Manufacturing, BFSI
Education: IIT OR IIM OR "Indian Institute"
```

**Step 2: Use Leads Finder**
- Actor: `code_crafter/leads-finder`
- Input: Search criteria above
- Max results: 2500 (to get 2000 qualified after filtering)
- Output: Profile + Email + Phone

**Step 3: Enrichment (if needed)**
- Actor: `anchor/linkedin-profile-enrichment`
- Input: LinkedIn URLs from Step 2
- Output: Complete profile data

**Step 4: Filter & Score**
- Export to Google Sheets
- Apply scoring model (from ICP document)
- Filter for score >60

**Estimated Cost**: $33 (2000 profiles)
**Timeline**: 4-6 hours runtime

---

### 3.3 UHNI Segment Workflow (Target: 200 leads)

**Step 1: Manual Seed List Creation**
- Forbes India Rich List
- Hurun India Rich List
- LinkedIn search: Title="Chairman" OR "Promoter", Listed companies
- BSE/NSE promoter databases

**Step 2: LinkedIn Profile Enrichment**
- Actor: `anchor/linkedin-profile-enrichment`
- Input: 300 LinkedIn URLs (to get 200 qualified)
- Output: Complete profile

**Step 3: Deep Manual Research** (Per lead)
- Company website
- Annual reports
- News articles
- Shareholding patterns
- Family office details
- Board positions

**Step 4: Contact Enrichment** (Critical for UHNIs)
- Executive assistant name/email
- Office phone number
- Company address
- Preferred communication channel

**Estimated Cost**: $3 (Apify) + $2000 (manual research)
**Timeline**: 2-3 weeks (including manual research)

---

### 3.4 Mass Affluent Segment Workflow (Target: 5000 leads)

**Step 1: Bulk LinkedIn Search**
```
Title: "Vice President" OR "Director" OR "Senior Manager" OR "Manager"
Location: All major Indian cities
Company: Fortune 500, MNCs, Unicorns, Tech companies
Industry: IT, Banking, Consulting, Technology
Experience: 8-20 years
```

**Step 2: Bulk Lead Scraping**
- Actor: `code_crafter/leads-finder`
- Input: Multiple search queries (10-15 variations)
- Max results: 6000 (to get 5000 qualified)
- Output: Leads with emails

**Step 3: Score & Filter**
- Export to Google Sheets
- Apply mass affluent scoring model
- Filter for score >40

**Estimated Cost**: $27.5 (5000 profiles)
**Timeline**: 6-8 hours runtime

---

## 4. Apify Console Operations

### 4.1 Running an Actor

**Method 1: Console UI**
1. Go to Apify Store
2. Search for actor (e.g., "anchor/linkedin-profile-enrichment")
3. Click "Try for free"
4. Configure input (JSON or UI form)
5. Click "Start"
6. Monitor run in "Runs" tab

**Method 2: API** (for automation)
```bash
curl -X POST https://api.apify.com/v2/acts/anchor~linkedin-profile-enrichment/runs \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profiles": ["https://www.linkedin.com/in/profile1/"]
  }'
```

### 4.2 Monitoring Runs

**Real-time Monitoring**:
- Log output (live updates)
- Progress bar
- Estimated time remaining
- Credits consumed

**Alerts**:
- Set up email alerts for:
  - Run completion
  - Run failure
  - Budget threshold

### 4.3 Retrieving Results

**Method 1: Download from Console**
1. Go to "Storage" → "Datasets"
2. Find your dataset
3. Click "Export" → Choose format (CSV, JSON, Excel)
4. Download

**Method 2: API**
```bash
curl https://api.apify.com/v2/datasets/YOUR_DATASET_ID/items?format=csv \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  > leads.csv
```

---

## 5. Data Processing Pipeline

### 5.1 Post-Scraping Workflow

```
Raw Data (Apify)
    ↓
Clean & Deduplicate (Google Sheets / Python)
    ↓
Enrich (Additional actors if needed)
    ↓
Score (Apply ICP scoring model)
    ↓
Segment (Hot/Warm/Cold tiers)
    ↓
CRM Import (Tag by segment)
    ↓
Outreach Assignment
```

### 5.2 Data Cleaning Checklist

- [ ] Remove duplicates (based on email or LinkedIn URL)
- [ ] Validate email format
- [ ] Standardize phone format (+91-XXXXXXXXXX)
- [ ] Clean company names (remove "Pvt Ltd", "Private Limited" variations)
- [ ] Standardize location names
- [ ] Remove incomplete records (missing key fields)
- [ ] Flag bounced emails from previous campaigns

### 5.3 Enrichment Checklist

**For Partners**:
- [ ] SEBI registration verified (via SEBI website)
- [ ] Company website working
- [ ] LinkedIn company page exists
- [ ] AUM estimated (via website/LinkedIn)
- [ ] Decision maker identified

**For HNIs**:
- [ ] Current role verified
- [ ] Company size confirmed
- [ ] LinkedIn activity checked
- [ ] Email verified (via hunter.io or similar)
- [ ] Net worth indicators noted

**For UHNIs**:
- [ ] Deep research completed
- [ ] Mutual connections identified
- [ ] EA contact found
- [ ] Recent news/activities noted
- [ ] Investment interests identified

**For Mass Affluent**:
- [ ] Current employment verified
- [ ] Salary range estimated
- [ ] LinkedIn engagement level checked
- [ ] Email verified
- [ ] Finance content interests noted

---

## 6. Cost Optimization Tips

### 6.1 Reduce Apify Costs

1. **Use tiered pricing**: Upgrade to GOLD tier if scraping >50K results/month
2. **Batch requests**: Run larger batches to reduce per-result cost
3. **Filter early**: Use actor filters to reduce unnecessary scraping
4. **Reuse data**: Don't re-scrape profiles, store and update incrementally
5. **Monitor usage**: Set budget alerts, review spending weekly

### 6.2 Free/Cheaper Alternatives for Testing

**LinkedIn Sales Navigator** ($99/month):
- Manual search and export
- 25 lead credits/month
- Good for UHNI manual research
- Not scalable for large volumes

**Google Sheets + Manual**:
- LinkedIn manual search → Export URLs → Spreadsheet
- Free but time-consuming
- Good for small tests (<100 leads)

**Browser Extensions**:
- LinkedIn Helper ($15/month)
- Phantombuster ($50/month)
- Lower success rates than Apify

---

## 7. Compliance & Best Practices

### 7.1 LinkedIn ToS Compliance

**Allowed**:
- Scraping publicly available data
- Using official APIs where available
- Rate-limiting requests (via Apify)
- Residential proxies (avoid detection)

**Not Allowed**:
- Aggressive scraping (>1000 profiles/day from single account)
- Fake accounts
- Automated messaging from personal profiles
- Scraping private/restricted profiles

**Best Practices**:
- Use Apify's built-in rate limiting
- Spread scraping across multiple days
- Use residential proxies (included with Apify)
- Don't scrape from own LinkedIn account

### 7.2 Data Privacy

**India Data Protection**:
- Store data securely
- Get consent before email marketing
- Provide opt-out mechanisms
- Delete data after 2 years if no engagement
- Don't share data with third parties

**Email Verification**:
- Use double opt-in for newsletters
- Include unsubscribe link
- Honor opt-out requests within 48 hours

---

## 8. Troubleshooting

### 8.1 Common Issues

**Issue**: Actor run fails immediately
**Solution**:
- Check input JSON format
- Verify LinkedIn URLs are correct
- Ensure sufficient Apify credits
- Check actor-specific requirements

**Issue**: Low success rate (<80%)
**Solution**:
- Use residential proxies
- Reduce concurrency (maxConcurrency: 5)
- Add delays between requests
- Check if LinkedIn is blocking requests

**Issue**: Missing data fields
**Solution**:
- Some profiles don't have all fields public
- Use multiple actors for cross-verification
- Manual enrichment for critical leads (UHNIs)

**Issue**: Duplicate results
**Solution**:
- Deduplicate based on email or LinkedIn URL
- Use Google Sheets UNIQUE() function
- Set up deduplication in Apify input

### 8.2 Support Resources

- **Apify Discord**: https://discord.gg/apify
- **Apify Documentation**: https://docs.apify.com
- **Actor-specific docs**: On each actor's page
- **Community forum**: https://community.apify.com

---

## 9. Execution Checklist

### Pre-Scraping
- [ ] Apify account created and funded
- [ ] ICP definitions finalized
- [ ] LinkedIn search queries tested manually
- [ ] Output format decided (CSV/JSON)
- [ ] Storage location set up (Google Sheets/Drive)
- [ ] Scoring model ready in spreadsheet

### During Scraping
- [ ] Monitor runs in real-time
- [ ] Check for errors in logs
- [ ] Validate sample output (first 10 records)
- [ ] Adjust configuration if needed
- [ ] Track costs in real-time

### Post-Scraping
- [ ] Download all datasets
- [ ] Deduplicate and clean data
- [ ] Apply scoring model
- [ ] Segment into tiers
- [ ] Import to CRM
- [ ] Assign to outreach sequences

---

## Document Control

**Version**: 1.0
**Created**: 2025-10-03
**Last Updated**: 2025-10-03
**Owner**: Marketing Ops Team
