# PL Capital - Lead Generation Frontend

Modern Next.js 14 frontend for the PL Capital Lead Generation automation engine.

## Features

- **6-Stage Workflow**: Configuration → Scraping → Processing → CRM → Outreach → Analytics
- **8 Target Segments**: Partners, HNI, UHNI, Mass Affluent + Signal-based variants
- **Real-Time Updates**: Server-Sent Events (SSE) for live progress tracking
- **Dual Execution Modes**: Full workflow or stage-by-stage execution
- **Simulation & Live Modes**: Test safely with simulated data or run with real APIs
- **Lead Scoring Dashboard**: Visual ICP scoring with Hot/Warm/Cold distribution
- **Outreach Campaigns**: Email, LinkedIn, Video personalization, Newsletter tracking

## Installation

```bash
cd /Users/yogs87/Downloads/sanity/projects/lead-generation/frontend
npm install
```

## Development

```bash
npm run dev
```

Frontend will be available at **http://localhost:3005**

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx                      # Main dashboard with 6-stage workflow
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Global styles with Tailwind
│   ├── components/
│   │   ├── LeadScoringDashboard.tsx  # Stage 3: Lead scoring visualization
│   │   └── OutreachCampaigns.tsx     # Stage 5: Outreach campaign tracking
│   └── api/workflow/
│       ├── execute/route.ts          # Full workflow execution (SSE)
│       ├── segment/route.ts          # Single stage execution (SSE)
│       └── data/route.ts             # Fetch workflow data from backend
├── package.json                      # Dependencies (port 3005)
├── next.config.js                    # Next.js configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # This file
```

## Target Segments

### Core Segments
1. **Partners** (🤝): IFAs & Wealth Managers | Target: 500 leads, 25 conversions
2. **HNIs** (💼): ₹5-25 Cr Net Worth | Target: 2,000 leads, 40 conversions
3. **UHNIs** (👔): ₹25 Cr+ Net Worth | Target: 200 leads, 10 conversions
4. **Mass Affluent** (📈): ₹50 Lakh - ₹5 Cr | Target: 5,000 leads, 50 conversions

### Signal-Based Segments (Intent-Driven)
5. **HNI Signals** (🎯): HNI leads with active buying intent
6. **UHNI Signals** (🎯): UHNI leads with ultra-high intent
7. **Mass Signals** (🎯): Mass affluent with retirement planning intent
8. **Partner Signals** (🎯): Strategic partners showing partnership intent

## Workflow Stages

### Stage 1: Configuration & Setup
- Select target segment
- Choose execution mode (Full/Staged)
- Set environment (Simulation/Live)
- Configure max leads count

### Stage 2: Lead Scraping (Apify)
- Apify actor execution
- LinkedIn/Apollo scraping
- Email enrichment
- Real-time progress tracking
- **Metrics**: Total leads, with email, with LinkedIn

### Stage 3: Data Processing
- Data quality validation
- Deduplication (by email/LinkedIn URL)
- ICP scoring (0-100 scale)
- Hot/Warm/Cold classification
- **Dashboard**: Score distribution, quality metrics

### Stage 4: CRM Integration
- Google Sheets sync
- Lead database upsert
- Enrichment fields
- Segment-specific tabs

### Stage 5: Outreach Campaigns
- **Email**: Queue leads for email sequences
- **LinkedIn**: Connection requests & messaging
- **Video**: HeyGen personalization for hot leads (score ≥80)
- **Newsletter**: Enroll cold leads in nurture campaigns
- **Dashboard**: Campaign metrics, templates, compliance

### Stage 6: Analytics & Tracking
- Workflow execution summary
- Lead quality metrics
- Conversion funnel tracking
- ROI projections

## Execution Modes

### Full Workflow
Executes all 6 stages sequentially with real-time SSE updates.

```
Click "🚀 Execute Full Workflow" button
→ All stages run automatically
→ Watch real-time progress in UI
```

### Stage-by-Stage
Execute stages individually for more control.

```
Select "Stage-by-Stage" mode
→ Click "▶ Run Stage" on each stage
→ Review results before proceeding
```

## Environment Modes

### Simulation Mode (Default)
- Uses mock data from `config/segments.js`
- No API calls, no costs
- Safe for testing and development
- Generates realistic Indian lead data

### Live Mode (Requires Credentials)
- Calls real Apify, Google Sheets, HeyGen APIs
- Uses backend `.env` credentials
- Incurs scraping and API costs
- Production-ready execution

## API Routes

### POST `/api/workflow/execute`
Execute full workflow for a segment.

**Query Params:**
- `segment`: partners | hni | uhni | mass_affluent | signals-*
- `live`: true | false (default: false)
- `maxResults`: Number of leads to scrape (default: 100)

**Response**: SSE stream with stage updates

### POST `/api/workflow/segment`
Execute a single workflow stage.

**Query Params:**
- `segment`: Segment ID
- `stage`: 1-6 (stage number)
- `live`: true | false
- `maxResults`: Number of leads

**Response**: SSE stream with stage-specific updates

### GET `/api/workflow/data`
Fetch current workflow data for a segment.

**Query Params:**
- `segment`: Segment ID

**Response**: JSON with scraping, processing, and outreach data

## Backend Integration

The frontend communicates with the backend automation engine at:
```
/Users/yogs87/Downloads/sanity/projects/lead-generation/automation-engine/
```

Via Node.js `spawn` executing `main.js` with segment and mode parameters.

**Backend Commands:**
```bash
node main.js run --segment hni              # Run HNI workflow (simulation)
node main.js run --segment partners --live  # Run Partners workflow (live)
node main.js status                         # Check latest execution
```

## Lead Scoring Models

Each segment has a unique ICP scoring model (0-100):

### Partners
- **Weights**: experience (25%), AUM (20%), client base (20%), digital presence (15%), engagement (10%), location (10%)
- **Tiers**: Hot ≥80, Warm ≥60, Cold ≥40

### HNIs
- **Weights**: net worth (30%), role seniority (20%), education (15%), investment activity (15%), geography (10%), engagement (10%)
- **Tiers**: Hot ≥82, Warm ≥65, Cold ≥45

### UHNIs
- **Weights**: ownership (30%), liquidity events (25%), family office (20%), philanthropy (10%), international (10%), engagement (5%)
- **Tiers**: Hot ≥85, Warm ≥70, Cold ≥50

### Mass Affluent
- **Weights**: income (25%), digital behavior (20%), investment history (20%), geography (15%), engagement (10%), intent (10%)
- **Tiers**: Hot ≥78, Warm ≥58, Cold ≥38

## Outreach Strategy by Segment

### Partners
- **Channel**: LinkedIn + Email
- **Focus**: Commission structure, 80-year legacy, quant edge
- **Templates**: P-E-01 through P-E-05
- **Compliance**: SEBI disclaimers, LinkedIn rate limits

### HNIs
- **Channel**: Educational email sequences + videos for hot leads
- **Focus**: AQUA's 76% returns, systematic approach
- **Video**: HeyGen personalization for score ≥82
- **Lead Magnet**: "The Quant Edge" report

### UHNIs
- **Channel**: Executive briefings + personal introductions
- **Focus**: Bespoke proposals, direct fund manager access
- **Requirement**: EA coordination, physical mailers
- **Approach**: High-touch, personalized

### Mass Affluent
- **Channel**: Newsletter-first with automated sequences
- **Focus**: Financial education, quant frameworks
- **Newsletter**: "The Quant Edge" bi-weekly
- **Conversion**: Long-term nurture funnel

## Compliance & Best Practices

### LinkedIn Automation
- Rate limit: <100 connection requests per week
- Use residential proxies (configured in Apify)
- Avoid aggressive scraping
- No fake profiles

### Email Marketing
- Include unsubscribe link in all emails
- Honor opt-out requests within 48 hours
- Double opt-in for newsletters
- Include sender identification and physical address

### SEBI Regulations
- All performance claims must include disclaimer
- Risk disclosures required
- Minimum investment thresholds clearly stated
- No performance guarantees

### Data Privacy
- Secure lead data storage
- Explicit consent before email marketing
- Delete data after 2 years if no engagement
- No third-party data sharing

## Performance Metrics

### Target Lead Counts (Year 1)
- **Total**: 7,700 leads
- **Partners**: 500 → 25 conversions (5%)
- **HNI**: 2,000 → 40 conversions (2%)
- **UHNI**: 200 → 10 conversions (5%)
- **Mass Affluent**: 5,000 → 50 conversions (1%)

### Projected Outcomes
- **Total Conversions**: 125 clients
- **Total AUM**: ₹320 Cr
- **Revenue** (@ 2% mgmt fee): ₹6.4 Cr
- **Budget**: ~₹20,000 (Year 1)
- **ROI**: 320x

### KPIs to Monitor
- **Lead Quality**: Average score, Hot/Warm/Cold distribution
- **Email Metrics**: Open rate (35-45%), CTR (10-20%), Reply rate (8-15%)
- **LinkedIn**: Connection acceptance (30-50%), Message response (15-25%)
- **Conversion**: Discovery call booking (5-10%), Client conversion (1-5% by segment)

## Troubleshooting

### Frontend won't start
```bash
cd frontend
npm install
npm run dev
```

### Backend not responding
```bash
cd ../automation-engine
npm install
node main.js init
```

### SSE stream not working
- Check backend is running
- Verify backend path in API routes
- Check browser console for errors

### No data in dashboard
- Run a workflow first: `node main.js run --segment hni`
- Check `automation-engine/data/leads/` for JSON files
- Verify `automation-engine/data/executions.json` exists

## Dependencies

- **Next.js 14.2.18**: React framework with App Router
- **React 18.2.0**: UI library
- **TypeScript 5.3.3**: Type-safe development
- **Tailwind CSS 3.4.18**: Utility-first CSS framework

## Development Tips

1. **Use Simulation Mode** for development (no API costs)
2. **Test Stage-by-Stage** before running full workflow
3. **Monitor Backend Logs** in terminal for debugging
4. **Check Data Files** in `automation-engine/data/` for results
5. **Review Templates** in `03_OUTREACH_TEMPLATES.md` for copy

## Additional Resources

- **Backend README**: `../automation-engine/README.md`
- **Master Strategy**: `../00_MASTER_STRATEGY.md`
- **ICP Definitions**: `../01_ICP_DEFINITIONS.md`
- **Apify Guide**: `../02_APIFY_SCRAPING_GUIDE.md`
- **Outreach Templates**: `../03_OUTREACH_TEMPLATES.md`

---

**Built with**: Next.js 14, TypeScript, Tailwind CSS
**Backend**: Node.js automation engine (N8N-style)
**Port**: 3005
**Owner**: PL Capital Marketing & Business Development
