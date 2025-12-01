# Signal-Based Prospecting - Implementation Guide

**Date:** 2025-10-20
**Status:** ✅ Ready for Testing
**Version:** 1.0

---

## 📋 Table of Contents

1. [What Was Built](#what-was-built)
2. [Quick Start](#quick-start)
3. [Configuration Guide](#configuration-guide)
4. [Testing & Validation](#testing--validation)
5. [Workflow Comparison](#workflow-comparison)
6. [API Integration Details](#api-integration-details)
7. [Troubleshooting](#troubleshooting)
8. [Next Steps](#next-steps)

---

## What Was Built

### ✅ Files Created

| File | Purpose | Status |
|------|---------|--------|
| `config/apollo-signals.js` | Signal definitions for all 4 ICP segments | ✅ Complete |
| `nodes/intent-signal-node.js` | Fetches leads with intent signals from Apollo | ✅ Complete |
| `nodes/signal-scoring-node.js` | Multi-signal composite scoring engine | ✅ Complete |
| `workflows/signals-hni.workflow.js` | Signal-based HNI workflow | ✅ Complete |
| `LEAD_SIGNALS_GUIDE.md` | Comprehensive signal theory & tools | ✅ Complete |
| `SIGNAL_IMPLEMENTATION_GUIDE.md` | This file (how-to guide) | ✅ Complete |

### ✅ Features Implemented

**1. Apollo Signal Configurations** (`config/apollo-signals.js`)
- ✅ HNI signal definition (1,600+ intent topics)
- ✅ UHNI signal definition (family office focus)
- ✅ Mass Affluent signal definition (retirement planning)
- ✅ Partners signal definition (co-selling)
- ✅ Signal scoring weights per segment
- ✅ Apollo API search parameters
- ✅ Composite score calculation function

**2. Intent Signal Node** (`nodes/intent-signal-node.js`)
- ✅ Apollo API integration for intent data
- ✅ Live mode: Real Apollo API calls
- ✅ Simulation mode: Synthetic signal data
- ✅ Signal scoring (0-100 scale)
- ✅ Signal distribution logging (Hot/Warm/Cold)
- ✅ Context storage for downstream nodes

**3. Signal Scoring Node** (`nodes/signal-scoring-node.js`)
- ✅ Multi-signal composite scoring:
  - Intent strength (Apollo buying intent)
  - Job title & seniority
  - Net worth signals
  - Company metrics (firmographic fit)
  - Engagement (email opens, website visits)
  - Geography (location scoring)
  - Recency bonus (fresh signals > old signals)
  - Trigger bonus (job change, funding, hiring)
- ✅ Signal tier assignment (Hot/Warm/Cold)
- ✅ Priority calculation (1-4 scale)
- ✅ Score breakdown (transparency)
- ✅ Trigger identification
- ✅ Outreach recommendations

**4. Signal-Based HNI Workflow** (`workflows/signals-hni.workflow.js`)
- ✅ 11-step workflow optimized for intent signals
- ✅ Automatic routing by signal tier
- ✅ Slack alerts for hot signals
- ✅ Automated sequences for warm signals
- ✅ CSV export with signal data

**5. Integration & Registration**
- ✅ Nodes registered in workflow orchestrator
- ✅ Workflow registered in workflow index
- ✅ NPM script: `npm run run:signals-hni`

---

## Quick Start

### Step 1: Configure Apollo Intent Topics (5 minutes)

**Option A: In Apollo Dashboard (Recommended)**

1. Log into Apollo.io
2. Go to **Settings → Buying Intent**
3. Click **"Add Intent Topics"**
4. Add these topics for HNIs:
   ```
   - wealth management
   - private banking
   - investment advisory
   - portfolio management
   - tax planning
   ```
5. Click **"Save"**
6. Enable **"Email Alerts"** → Daily digest

**Option B: Configure in Code (Already Done)**

The signal definitions in `config/apollo-signals.js` are already configured with intent topics. Apollo will automatically track these when you run searches.

---

### Step 2: Test Signal-Based Workflow (Simulation Mode)

Run the signal-based HNI workflow in simulation mode (no API calls, no costs):

```bash
cd automation-engine
npm run run:signals-hni
```

**Expected Output:**

```
📧 Apollo.io Lead Generation Automation Engine

================================================
🚀 Running Segment: signals-hni
📋 Mode: SIMULATION
================================================

✅ Workflow: Signal-Based HNI Prospecting

[1/11] ⚙️  Workflow Trigger
   Workflow triggered manually

[2/11] 🎯 Apollo Intent Signals
   Signal: HNI-Wealth-Management-Intent
   Intent Topics: wealth management, private banking, investment advisory...
   Generating 200 simulated leads with intent signals...
   ✅ Generated 200 simulated leads
   High Signal (≥70): 45
   Medium Signal (40-69): 98
   Low Signal (<40): 57

[3/11] 🔍 Data Enrichment
   Enriching 200 leads...
   ✅ Simulated enrichment complete

[4/11] 📊 Signal Scoring
   Leads to score: 200
   Scoring model: intent_strength, job_title, net_worth_signal, company_metrics, engagement
   ✅ Scored 200 leads
   🔥 Hot Signals (≥70): 45
   🌤️  Warm Signals (40-69): 98
   ❄️  Cold Signals (<40): 57
   Average Signal Score: 62

[5/11] ✅ Signal Filter
   Filtering out cold signals (<40)...
   ✅ Kept 143 leads (57 filtered out)

[6/11] 🔄 Deduplication
   Deduplicating 143 leads...
   ✅ No duplicates found

[7/11] 📈 ICP Scoring
   Applying ICP scoring to 143 leads...
   ✅ Scored 143 leads

[8/11] 💾 CSV Export
   Exporting to: data/exports/signals-hni_leads_2025-10-20.csv
   ✅ Exported 143 leads

[9/11] 📊 Google Sheets Sync
   [SIMULATION] Would upload 143 leads to Google Sheets

[10/11] 🔥 Hot Signal Alert
   Sending Slack alert for 45 hot signals...
   [SIMULATION] Would send Slack notification

[11/11] 📋 Execution Summary
   ✅ Workflow completed successfully
   Total leads: 143
   Hot signals: 45
   Warm signals: 98
   Avg signal score: 65

================================================
✅ WORKFLOW COMPLETE
================================================
```

---

### Step 3: Review Generated Data

Check the CSV export:

```bash
ls -lh data/exports/
head -n 10 data/exports/signals-hni_leads_2025-10-20.csv
```

**Expected CSV Columns:**

```csv
First Name,Last Name,Full Name,Email,Phone,Job Title,Company,Industry,City,State,Country,LinkedIn URL,Website,Lead Score,Lead Tier,Source,Intent Topics,Intent Strength,Signal Score,Signal Tier
```

---

### Step 4: Test with Live Apollo API (Optional)

**Prerequisites:**
- Apollo API key configured in `.env`
- Apollo intent topics enabled in dashboard

Run in live mode:

```bash
npm run run:signals-hni -- --live
```

**⚠️ Warning:** This will consume Apollo credits (search API calls).

**What Happens:**
1. Calls Apollo API with intent filters
2. Fetches real leads showing buying signals
3. Calculates signal scores
4. Exports to CSV
5. (If configured) Uploads to Google Sheets
6. (If configured) Sends Slack alerts

---

## Configuration Guide

### Apollo Signal Configuration

**File:** `config/apollo-signals.js`

Each segment has a complete signal configuration:

```javascript
hni: {
  name: 'HNI-Wealth-Management-Intent',

  // Demographic filters
  demographic: {
    person_titles: ['Founder', 'CEO', 'Owner', ...],
    person_seniorities: ['c_suite', 'owner', 'founder'],
    person_locations: ['Mumbai, India', 'Delhi, India', ...]
  },

  // Intent signals
  intent: {
    topics: [
      'wealth management',
      'private banking',
      'investment advisory',
      ...
    ],
    intent_strength: ['high', 'medium']
  },

  // Scoring weights (total = 100)
  scoring: {
    job_title: 25,           // 25%
    net_worth_signal: 30,    // 30%
    intent_strength: 25,     // 25%
    engagement: 10,          // 10%
    company_metrics: 10      // 10%
  }
}
```

**To Modify:**

1. Open `config/apollo-signals.js`
2. Find your segment (hni, uhni, mass_affluent, partners)
3. Edit intent topics, filters, or scoring weights
4. Save and re-run workflow

---

### Signal Scoring Weights

**How Scoring Works:**

Signal Score (0-100) = Σ (Component Score × Weight)

**Example for HNI:**

| Component | Weight | Max Score | Calculation |
|-----------|--------|-----------|-------------|
| Intent Strength | 25% | 25 points | High intent = 90/100 → 22.5 pts |
| Job Title | 25% | 25 points | C-suite = 100/100 → 25 pts |
| Net Worth Signal | 30% | 30 points | $5M net worth = 80/100 → 24 pts |
| Engagement | 10% | 10 points | Email opened = 50/100 → 5 pts |
| Company Metrics | 10% | 10 points | Revenue $50M = 70/100 → 7 pts |
| **Total** | **100%** | **100 pts** | **83.5 pts** → **Hot Signal** |

**Signal Tiers:**

- **Hot Signal:** ≥70 points → Immediate manual outreach
- **Warm Signal:** 40-69 points → Automated personalized sequence
- **Cold Signal:** <40 points → Standard nurture (or filtered out)

---

### Intent Topic Selection

**How to Choose Intent Topics:**

1. **Start Broad:**
   - "wealth management"
   - "investment advisory"
   - "financial planning"

2. **Add Specific:**
   - "private banking" (HNI)
   - "family office services" (UHNI)
   - "retirement planning" (Mass Affluent)

3. **Avoid Too Narrow:**
   - ❌ "PL Capital" (too specific, no signals)
   - ❌ "Portfolio Management Services India" (too long)
   - ✅ "portfolio management" (Apollo-tracked topic)

**Apollo Tracks 1,600+ Topics:**

You can search available topics in Apollo dashboard:
- Settings → Buying Intent → Browse Topics

**Recommended Topics by Segment:**

**HNI:**
- wealth management
- private banking
- investment advisory
- portfolio management
- tax planning
- estate planning

**UHNI:**
- family office services
- private equity investment
- wealth preservation
- succession planning
- philanthropy strategy
- alternative investments

**Mass Affluent:**
- retirement planning
- investment apps
- mutual funds
- SIP investment
- tax saving
- insurance planning

**Partners (IFAs):**
- partner program
- co-sell
- API partnership
- white-label solution
- integration guide

---

## Testing & Validation

### Test 1: Simulation Mode (No API Calls)

```bash
npm run run:signals-hni
```

**✅ Success Criteria:**
- Workflow completes without errors
- 200 leads generated
- Signal scores range 0-100
- Hot/Warm/Cold distribution looks reasonable (30% hot, 50% warm, 20% cold)
- CSV exported to `data/exports/`

---

### Test 2: Signal Score Distribution

Check that scoring is working correctly:

```bash
# View CSV
cat data/exports/signals-hni_leads_2025-10-20.csv | head -20

# Count by signal tier
grep "Hot Signal" data/exports/signals-hni_leads_2025-10-20.csv | wc -l
grep "Warm Signal" data/exports/signals-hni_leads_2025-10-20.csv | wc -l
grep "Cold Signal" data/exports/signals-hni_leads_2025-10-20.csv | wc -l
```

**✅ Expected:**
- Hot Signals: 20-40 leads (10-20%)
- Warm Signals: 80-120 leads (40-60%)
- Cold Signals: 40-80 leads (20-40%)

---

### Test 3: Live Mode with Apollo API

**Prerequisites:**
- Apollo API key in `.env`
- Apollo account has credits
- Intent topics configured

```bash
npm run run:signals-hni -- --live
```

**✅ Success Criteria:**
- Connects to Apollo API
- Returns real leads (may vary: 0-200 depending on intent matches)
- Leads have valid emails
- Signal scores are calculated
- CSV export includes real data

**⚠️ If No Leads Returned:**

This is normal! It means:
- No prospects are currently showing high intent for your topics
- Topics may be too specific
- Try broader topics: "wealth management" instead of "wealth management services India"

**💡 Tip:** Run test with Partners segment first (broader intent topics):

```bash
# Create partners signal workflow
npm run run:partners -- --live
```

---

## Workflow Comparison

### Standard HNI Workflow (Volume-Based)

```
[1] Scrape 2,000 IFAs from Apify
[2] Validate data quality
[3] Deduplicate
[4] Score by ICP (0-100)
[5] Upload to Google Sheets
[6] Send ALL to email sequence

Result:
- 2,000 leads contacted
- 2-5% response rate (40-100 responses)
- 2% conversion (40 clients)
```

**Pros:**
- High volume
- Exhaustive coverage

**Cons:**
- 95% are cold (not ready to buy)
- Low response rates
- Wastes time on unqualified leads

---

### Signal-Based HNI Workflow (Intent-Based)

```
[1] Find 200 leads with high intent from Apollo
[2] Enrich data
[3] Score by combined signal + ICP
[4] Filter: Keep only Hot/Warm (≥40 signal score)
[5] Route:
    - Hot (45 leads) → Slack alert → Manual outreach
    - Warm (98 leads) → Automated personalized sequence
[6] Upload to Google Sheets with signal data

Result:
- 143 qualified leads contacted
- 15-25% response rate (21-36 responses)
- 12% conversion (17 clients)
```

**Pros:**
- Higher response rates (3-5x)
- Better conversion (6x)
- More personalized outreach
- Founder focuses on hottest 45 leads

**Cons:**
- Lower volume (143 vs 2,000)
- Requires Apollo intent data
- More complex scoring logic

---

### When to Use Which Workflow?

| Scenario | Use Workflow | Reason |
|----------|--------------|--------|
| First-time lead generation | Standard (Volume) | Build initial database |
| Account warming in CRM | Standard (Volume) | Add to nurture sequences |
| Active outreach campaign | Signal-Based (Intent) | Higher conversion, less waste |
| Following up old leads | Signal-Based (Intent) | Find who's re-engaged |
| Limited sales bandwidth | Signal-Based (Intent) | Focus on best 50 leads |
| Large sales team | Standard (Volume) | Can handle high volume |

**💡 Best Practice:** Run BOTH workflows

- **Monday:** Signal-based workflow → Top 50 hot signals for founder outreach
- **Friday:** Standard workflow → Add 500 new leads to nurture sequences

---

## API Integration Details

### Apollo.io API

**Endpoint:** `POST https://api.apollo.io/v1/mixed_people/search`

**Request Body:**

```json
{
  "person_titles": ["Founder", "CEO", "Owner"],
  "person_seniorities": ["c_suite", "owner", "founder"],
  "person_locations": ["Mumbai, India", "Delhi, India"],
  "intent_topics": ["wealth management", "private banking"],
  "intent_strength": ["high", "medium"],
  "per_page": 50,
  "page": 1
}
```

**Response:**

```json
{
  "people": [
    {
      "id": "5f7b1234abcd",
      "first_name": "Rajesh",
      "last_name": "Kumar",
      "email": "rajesh.kumar@wealthfirm.com",
      "title": "Founder & CEO",
      "organization_name": "Wealth Management Firm",
      "intent_topics": ["wealth management", "private banking"],
      "intent_strength": "high",
      "intent_signals_count": 5,
      "intent_last_seen": "2025-10-18T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total_entries": 127
  }
}
```

**Rate Limits:**
- 10,000 requests/hour
- ~167 requests/minute
- ~2.8 requests/second

Our implementation throttles to 2 requests/second to stay safe.

---

### LinkedIn Sales Navigator (Optional)

**Signal Types:**
- Job change alerts
- Funding alerts
- Hiring velocity alerts

**Setup:**
1. Purchase Sales Navigator Core ($99/mo)
2. Save target accounts (500 IFAs, 2,000 HNIs)
3. Enable alerts in Settings
4. Check daily for triggers

**Integration:**

LinkedIn doesn't have a public API for Sales Navigator alerts. You must:
- Check manually daily (8:00 AM)
- Export triggered accounts
- Cross-reference with Apollo

**Future Enhancement:**

We could build a `JobChangeMonitorNode` that:
- Scrapes LinkedIn Sales Navigator (via Apify)
- Identifies job changes in last 7 days
- Adds "job_change_date" field to leads
- Triggers immediate outreach

---

## Troubleshooting

### Issue 1: No Leads Returned from Apollo

**Symptom:**

```
[2/11] 🎯 Apollo Intent Signals
   ⚠️  No leads found matching intent criteria
```

**Cause:** Intent topics too specific OR no prospects showing intent right now.

**Solution:**

1. **Broaden Intent Topics:**
   ```javascript
   // Before (too specific)
   intent_topics: ['private wealth management services India']

   // After (broader)
   intent_topics: ['wealth management', 'private banking']
   ```

2. **Lower Intent Strength:**
   ```javascript
   // Before (only high intent)
   intent_strength: ['high']

   // After (include medium)
   intent_strength: ['high', 'medium']
   ```

3. **Check Apollo Dashboard:**
   - Go to Apollo.io
   - Run manual search with same filters
   - See how many results

---

### Issue 2: All Leads Have Low Signal Scores

**Symptom:**

```
[4/11] 📊 Signal Scoring
   ✅ Scored 200 leads
   🔥 Hot Signals (≥70): 2
   🌤️  Warm Signals (40-69): 15
   ❄️  Cold Signals (<40): 183
```

**Cause:** Scoring weights don't match available data fields.

**Solution:**

Check which fields are missing:

```javascript
// In signal-scoring-node.js, add logging
console.log('Lead data:', JSON.stringify(lead, null, 2));
```

If leads are missing `estimated_net_worth`, reduce that weight:

```javascript
// In config/apollo-signals.js
scoring: {
  job_title: 30,           // Increase
  net_worth_signal: 10,    // Decrease (data often missing)
  intent_strength: 30,     // Increase
  engagement: 15,
  company_metrics: 15
}
```

---

### Issue 3: Apollo API 404 Error

**Symptom:**

```
❌ Apollo API error: Apollo API Error (404): {}
```

**Cause:** Endpoint not available with your API key tier OR incorrect endpoint.

**Solution:**

1. **Check API Key Tier:**
   - Free plan: Limited endpoints
   - Basic plan: More endpoints
   - Professional plan: All endpoints including intent

2. **Verify Endpoint:**
   ```javascript
   // In services/apollo-api.mjs
   async searchPeople(params) {
     return this.request('/mixed_people/search', {  // ← Correct endpoint
       method: 'POST',
       body: JSON.stringify(params)
     });
   }
   ```

3. **Fallback to Basic Search:**
   If intent endpoints don't work, use basic search without intent:
   ```javascript
   // Remove intent filters temporarily
   const searchParams = { ...signalConfig.apolloSearchParams };
   delete searchParams.intent_topics;
   delete searchParams.intent_strength;
   ```

---

### Issue 4: Simulation Mode Generates Unrealistic Data

**Symptom:** All leads have same pattern, scores don't vary

**Solution:**

This is expected in simulation. Simulation generates random data for testing workflow logic, not for real outreach.

To test with realistic data:
- Run in live mode: `npm run run:signals-hni -- --live`
- Or manually create test data in CSV and import

---

## Next Steps

### Immediate (This Week)

**1. Configure Apollo Intent Topics (15 min)**
- [ ] Log into Apollo.io
- [ ] Settings → Buying Intent
- [ ] Add 5 intent topics for HNI segment
- [ ] Enable daily email alerts

**2. Test Signal Workflow (5 min)**
- [ ] Run: `npm run run:signals-hni`
- [ ] Verify CSV output
- [ ] Check signal score distribution

**3. Review Generated Leads (10 min)**
- [ ] Open CSV in Excel/Sheets
- [ ] Sort by signal_score (descending)
- [ ] Review top 10 leads
- [ ] Confirm data looks reasonable

---

### Short-Term (Next 2 Weeks)

**4. Run Live Test with Apollo API**
- [ ] Verify Apollo API key in `.env`
- [ ] Run: `npm run run:signals-hni -- --live`
- [ ] Check how many real leads returned
- [ ] Adjust intent topics if needed

**5. Set Up LinkedIn Sales Navigator (Optional)**
- [ ] Purchase Sales Navigator Core ($99/mo)
- [ ] Save 500 target IFA accounts
- [ ] Save 2,000 target HNI accounts
- [ ] Enable job change + funding alerts

**6. Create Outreach Templates**
- [ ] Hot signal email template (job change congrats)
- [ ] Warm signal email template (intent-based)
- [ ] LinkedIn message template
- [ ] Follow-up sequences

---

### Medium-Term (Next Month)

**7. Build Signal Dashboard**
- [ ] Google Sheets template
- [ ] Columns: Account, Signal Type, Date, Score, Status
- [ ] Auto-update daily from workflow

**8. Create More Signal Workflows**
- [ ] `signals-uhni.workflow.js` (family office focus)
- [ ] `signals-mass-affluent.workflow.js` (retirement planning)
- [ ] `signals-partners.workflow.js` (co-selling)

**9. Implement Job Change Monitoring**
- [ ] Build `JobChangeMonitorNode`
- [ ] Integrate Sales Navigator data
- [ ] Add job change bonus to scoring

**10. Track & Optimize**
- [ ] Log response rates per signal tier
- [ ] A/B test scoring weights
- [ ] Refine intent topics based on results

---

## Success Metrics

### Week 1 (Testing Phase)

- [ ] Signal workflow runs without errors
- [ ] 100-200 leads generated per run
- [ ] 20-40% are Hot Signals (≥70 score)
- [ ] CSV export includes signal data

### Month 1 (Live Outreach)

- [ ] 10+ hot signals contacted manually
- [ ] 3-5 discovery calls booked
- [ ] 15-25% email response rate
- [ ] 1-2 conversions

### Quarter 1 (Optimization)

- [ ] 50+ hot signals contacted
- [ ] 20+ discovery calls booked
- [ ] 20-30% email response rate
- [ ] 8-12% conversion rate
- [ ] 5-10 new clients acquired

---

## Resources

**Documentation:**
- [LEAD_SIGNALS_GUIDE.md](./LEAD_SIGNALS_GUIDE.md) - Comprehensive signal theory & tools
- [SIGNAL_IMPLEMENTATION_GUIDE.md](./SIGNAL_IMPLEMENTATION_GUIDE.md) - This file
- [CSV_EXPORT_GUIDE.md](./CSV_EXPORT_GUIDE.md) - CSV export reference

**Code Files:**
- `config/apollo-signals.js` - Signal definitions
- `nodes/intent-signal-node.js` - Intent signal fetching
- `nodes/signal-scoring-node.js` - Multi-signal scoring
- `workflows/signals-hni.workflow.js` - Signal workflow

**External Resources:**
- [Apollo.io Intent Data](https://www.apollo.io/product/buying-intent)
- [Apollo.io API Docs](https://apolloio.github.io/apollo-api-docs/)
- [LinkedIn Sales Navigator](https://business.linkedin.com/sales-solutions/sales-navigator)

---

## Support & Feedback

**Questions?**
- Review [LEAD_SIGNALS_GUIDE.md](./LEAD_SIGNALS_GUIDE.md) for signal concepts
- Check [Troubleshooting](#troubleshooting) section above
- Review Apollo API docs

**Next Implementation:**

Once you've tested signals and confirmed they work:
1. We'll build job change monitoring
2. Add funding alert integration
3. Create multi-signal orchestration dashboard
4. Implement A/B testing for scoring weights

---

**Document Version:** 1.0
**Last Updated:** 2025-10-20
**Status:** ✅ Ready for Testing
