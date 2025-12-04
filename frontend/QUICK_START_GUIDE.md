# Quick Start Guide - Lead Generation Automation

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd /Users/yogs87/Downloads/sanity/projects/lead-generation/frontend
npm install
```

This installs:
- `axios` (for API requests)
- `@google/generative-ai` (for Gemini AI integration)
- All existing Next.js dependencies

### Step 2: Configure Environment Variables

Create `frontend/.env.local`:

```bash
# Apollo.io API (get from https://app.apollo.io/#/settings/integrations/api)
APOLLO_API_KEY=your_apollo_api_key_here

# Google Gemini AI (get from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# MoEngage credentials (already configured in automation-engine)
# No additional env vars needed
```

**Important**: You'll need both API keys to run the lead generation workflow.

### Step 3: Start Development Server

```bash
npm run dev
```

Visit: **http://localhost:3005/lead-gen**

### Step 4: Run Your First Campaign

1. **Configure**:
   - Segment: "Partners - Mega"
   - Lead Count: 25
   - Outreach Mode: Email ✓

2. **Execute**: Click "🚀 Start Lead Generation"

3. **Watch the magic**:
   - ✅ 25 leads scraped from Apollo
   - ✅ Emails enriched with verified addresses
   - ✅ ICP scores assigned
   - ✅ Leads displayed in table

4. **Create Campaign**:
   - Click "✉️ Create Campaign (25)"
   - ✅ AI generates 25 personalized emails

5. **Preview & Test**:
   - Review scripts
   - Enter test emails: `test@yourdomain.com`
   - Click "🧪 Send Test Campaign"

6. **Publish**:
   - Click "🚀 Publish to Production"
   - ✅ Segment created
   - ✅ Campaign published

7. **View Analytics**:
   - See conversion funnel
   - Read AI optimization insights
   - Apply recommendations for next campaign

**Total time**: ~2-3 minutes per campaign

---

## 📊 What You Get

### Immediate Value

1. **AI-Powered Personalization**: 50 unique emails generated in <2 minutes
2. **Lead Quality**: Only >80% email confidence leads
3. **Optimization Insights**: AI tells you how to improve
4. **CSV Export**: Download enriched leads anytime
5. **Test-First Workflow**: Never send to production without testing

### Example Output

**Enriched Lead**:
```json
{
  "name": "Rajesh Sharma",
  "email": "rajesh.sharma@reliance.com",
  "email_confidence": 92,
  "phone": "+91 9876543210",
  "title": "CEO",
  "company": "Reliance Industries",
  "industry": "Financial Services",
  "icp_score": 88,
  "tier": "cold"
}
```

**Note**: All leads start as "cold" tier. They progress to "warm" or "hot" based on engagement tracking (opens, clicks, replies, bookings).

**AI-Generated Email** (for Hot Lead):
```
Subject: Rajesh, exclusive portfolio strategy for Reliance Industries

Hi Rajesh,

Given your leadership at Reliance Industries, I wanted to personally
reach out about an exclusive quantitative investing opportunity.

PL Capital's AQUA Fund has delivered 76% annualized returns (2019-2023)
using proprietary data models—eliminating human bias and emotional
decision-making.

I'd love to discuss a custom portfolio analysis for Reliance Industries'
leadership team.

Can we schedule a 15-minute discovery call?

📅 Book here: https://calendly.com/plcapital/discovery

Best regards,
PL Capital Team

---
Past performance does not guarantee future returns. Investments in PMS
are subject to market risks. Minimum investment: ₹50 lakh.
```

---

## 🎯 Next Steps

### Run Multiple Campaigns

1. **Partners Campaign**: 50 mega partners
2. **HNI Campaign**: 50 high net worth individuals
3. **UHNI Campaign**: 25 ultra high net worth (quality over quantity)

### Track Performance

1. View analytics after each campaign
2. Read AI recommendations
3. Apply insights to next campaign
4. Repeat and optimize

---

## 🔧 Additional Utilities

### Person Search (http://localhost:3005/person-search)

**Purpose**: Search for and enrich individual people from Apollo

**Workflow**:
1. Enter person name/title/company in search box
2. Click "Search Apollo" to find matches
3. Select person from results
4. Click "Enrich" to get verified email, phone, LinkedIn
5. Download as CSV or add to campaign

**Use Case**: Manual lead discovery, executive research, quick enrichment

---

### CSV Upload (http://localhost:3005/csv-upload)

**Purpose**: Bulk upload and enrich leads from CSV files

**Workflow**:
1. Upload CSV file with columns: name, email, company, title, phone, city, linkedin
2. Preview parsed leads
3. Click "Enrich Leads" to fetch verified data from Apollo
4. Download enriched CSV or add all leads to campaign

**Use Case**: Event attendees, webinar registrants, purchased lead lists

**Example CSV Format**:
```csv
name,email,company,title,city
Rajesh Sharma,rajesh@example.com,Reliance Industries,CEO,Mumbai
Priya Patel,priya@example.com,Tata Group,CFO,Bangalore
```

---

## 🔄 Lead Lifecycle & Tier Progression

**Important**: All leads from Apollo start as **COLD** tier (regardless of ICP score).

**Tier Progression** (Event-Driven):
```
COLD (All scraped leads)
  ↓ Email opened or clicked
WARM (Engaged leads)
  ↓ Email replied or call booked
HOT (High-intent leads)
```

**ICP Score vs Tier**:
- **ICP Score** (0-100): Quality metric based on seniority, company size, location, industry
- **Tier** (cold/warm/hot): Engagement level based on MoEngage event tracking

**Automated Campaigns**:
- When a COLD lead opens/clicks → Auto-qualify to WARM → Trigger warm campaign
- When a WARM lead replies/books → Auto-qualify to HOT → Trigger hot campaign

**Track Progressions**:
Visit `http://localhost:3005/api/moengage/webhook?limit=50` to see recent tier progressions

---

## 🔧 Troubleshooting

### "npm install" fails

**Fix**: Use Node.js 18+
```bash
node --version  # Should be v18 or higher
nvm install 18  # If using nvm
nvm use 18
npm install
```

### Port 3005 already in use

**Fix**: Use different port
```bash
npm run dev -- -p 3006
```

### API route not found (404)

**Fix**: Restart dev server
```bash
# Press Ctrl+C to stop
npm run dev
```

### MoEngage integration fails

**Fix**: Check automation-engine is configured
```bash
cd ../automation-engine
cat .env | grep MOENGAGE  # Should show MOENGAGE_* variables
```

---

## 📚 Documentation

- **Implementation Summary**: `LEAD_GEN_IMPLEMENTATION_SUMMARY.md` (this file)
- **Complete Flow Diagram**: `LEAD_GEN_AUTOMATION_FLOW.md`
- **Frontend Analysis**: `FRONTEND_WORKFLOW_ENGINE_ANALYSIS.md`
- **Master Strategy**: `../00_MASTER_STRATEGY.md`

---

## ✅ Checklist

Before going live:

- [ ] Install dependencies (`npm install`)
- [ ] Add API keys to `.env.local`
- [ ] Send test campaign to internal emails
- [ ] Verify email formatting and deliverability
- [ ] Review AI-generated scripts for accuracy
- [ ] Run first production campaign (25 leads max)
- [ ] Monitor analytics
- [ ] Apply AI recommendations
- [ ] Scale to 50 leads per campaign

---

## 🎉 You're Ready!

Visit: **http://localhost:3005/lead-gen**

Start generating leads in the next 60 seconds.

**Questions?** Check `LEAD_GEN_IMPLEMENTATION_SUMMARY.md` for detailed documentation.
