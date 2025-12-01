# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PL Capital Lead Generation Project** - A comprehensive lead generation automation system targeting 4 distinct customer segments for PL Capital's Portfolio Management Services (PMS). The project includes strategy documentation, Apify scraping workflows, outreach templates, and a custom N8N-style workflow automation engine built in Node.js.

**Key Goals:**
- Generate 7,700 qualified leads across Partners, HNIs, UHNIs, and Mass Affluent segments
- Target 125 conversions with ₹320 Cr projected AUM in Year 1
- Automate lead scraping, scoring, enrichment, and outreach workflows

## Project Structure

```
/lead-generation/
├── README.md                           # Project overview, quick start guide
├── 00_MASTER_STRATEGY.md               # Complete strategy (ICPs, scraping, outreach, ROI)
├── 01_ICP_DEFINITIONS.md               # Detailed buyer personas for all 4 segments
├── 02_APIFY_SCRAPING_GUIDE.md          # Step-by-step Apify implementation guide
├── 03_OUTREACH_TEMPLATES.md            # 50+ email, LinkedIn, WhatsApp templates
└── automation-engine/                  # Node.js workflow automation engine
    ├── main.js                         # CLI entry point
    ├── package.json                    # Dependencies and npm scripts
    ├── config/
    │   ├── segments.js                 # Segment definitions (Partners, HNI, UHNI, Mass Affluent)
    │   ├── settings.js                 # Global configuration
    │   └── environment.js              # Environment detection (live vs simulate)
    ├── core/
    │   ├── workflow-orchestrator.js    # Main orchestrator, runs workflows per segment
    │   ├── workflow-runner.js          # Executes workflow nodes sequentially
    │   ├── workflow-context.js         # Shared context across workflow execution
    │   └── logger.js                   # Pino logger configuration
    ├── workflows/
    │   ├── partners.workflow.js        # Partners segment workflow definition
    │   ├── hni.workflow.js             # HNI segment workflow
    │   ├── uhni.workflow.js            # UHNI segment workflow
    │   ├── mass-affluent.workflow.js   # Mass Affluent segment workflow
    │   └── index.js                    # Workflow registry
    └── nodes/                          # Workflow node implementations
        ├── trigger-node.js             # Workflow trigger (manual/scheduled)
        ├── apify-scraper-node.js       # Apify API integration for lead scraping
        ├── data-quality-node.js        # Validates required fields, email format
        ├── dedupe-node.js              # Deduplicates leads by email/LinkedIn URL
        ├── lead-scoring-node.js        # Applies ICP scoring model (0-100)
        ├── google-sheets-node.js       # Upserts leads to Google Sheets
        ├── email-sequence-node.js      # Enqueues leads for email campaigns
        ├── video-personalization-node.js # HeyGen video personalization for hot leads
        ├── newsletter-enqueue-node.js  # Subscribes cold leads to newsletter
        ├── executive-briefing-node.js  # Generates UHNI executive packages
        ├── slack-notifier-node.js      # Sends Slack summary notifications
        └── summary-report-node.js      # Writes execution summary to data/executions.json
```

## Common Commands

### Installation & Setup
```bash
cd automation-engine
npm install                    # Install dependencies
npm run init                   # Initialize data directories, print segment summary
```

### Running Workflows
```bash
npm start                      # Run all segments (simulated mode)
npm run run:partners           # Run Partners segment only
npm run run:hni                # Run HNI segment only
npm run run:uhni               # Run UHNI segment only
npm run run:mass               # Run Mass Affluent segment only
npm run status                 # Print latest workflow execution summary
```

### Live Mode (requires credentials)
```bash
npm run run -- --segment partners --live    # Execute Partners workflow with real APIs
```

### Development
```bash
npm run lint                   # Run linting checks
```

## Architecture & Design Patterns

### 1. Workflow Orchestration (N8N-Style)

The automation engine uses a **node-based workflow system** inspired by N8N:

- **Workflows** are defined declaratively in `workflows/*.workflow.js` as arrays of nodes
- **Nodes** are modular, single-responsibility units (e.g., `ApifyScraperNode`, `LeadScoringNode`)
- **WorkflowRunner** executes nodes sequentially, passing data through a shared `WorkflowContext`
- **Simulation Mode** (default): Generates synthetic data without hitting real APIs
- **Live Mode** (`--live` flag): Calls real Apify, Google Sheets, HeyGen, and email APIs

### 2. Segment-Based Configuration

Each target segment (Partners, HNI, UHNI, Mass Affluent) has its own:
- **Scraping configuration**: Apify actor, search queries, maxResults
- **Scoring weights**: Customized ICP scoring model (0-100 scale)
- **Outreach templates**: Segment-specific email/LinkedIn/WhatsApp templates
- **Compliance rules**: SEBI disclaimers, LinkedIn rate limits, consent requirements

Configuration is centralized in `config/segments.js`.

### 3. Data Flow

```
1. TriggerNode (manual/scheduled)
   ↓
2. ApifyScraperNode (fetch raw leads from LinkedIn/Apollo)
   ↓
3. DataQualityNode (validate required fields, email format)
   ↓
4. DedupeNode (remove duplicates by email/LinkedIn URL)
   ↓
5. LeadScoringNode (apply ICP scoring model → Hot/Warm/Cold)
   ↓
6. GoogleSheetsNode (upsert to segment-specific sheet tab)
   ↓
7. EmailSequenceNode/NewsletterEnqueueNode (trigger outreach)
   ↓
8. SlackNotifierNode (send summary to team)
   ↓
9. SummaryReportNode (log execution metrics)
```

### 4. Simulation vs Live Mode

- **Simulation Mode** (default): Uses `segments.js` `simulation` config to generate realistic fake data
  - No API calls, no costs, safe for testing
  - Generates leads with Indian names, job titles, companies from config

- **Live Mode** (`--live` flag): Requires environment variables:
  - `APIFY_API_TOKEN`: Apify API key
  - `GOOGLE_SHEETS_CREDENTIALS`: Service account JSON
  - `HEYGEN_API_KEY`: For video personalization (optional)
  - `SLACK_WEBHOOK_URL`: For notifications (optional)

Environment detection is in `config/environment.js`.

### 5. Node Registry Pattern

The `WorkflowOrchestrator` maintains a **nodeRegistry** mapping handler names to node classes:

```javascript
this.nodeRegistry = {
  TriggerNode,
  ApifyScraperNode,
  DataQualityNode,
  // ... etc
};
```

Workflows reference nodes by handler name (string), allowing for dynamic node instantiation.

### 6. Logging & Error Handling

- Uses **Pino** logger with pretty-printing for development
- All nodes receive a logger instance via `WorkflowContext`
- Errors are caught per-node and logged, but workflow continues (fail-safe)
- Execution summaries are written to `data/executions.json` for audit trail

## Key Integration Points

### Apify Integration
- **Actor**: `apify/apollo-scraper` (configurable per segment)
- **Purpose**: Scrape LinkedIn/Apollo leads based on search queries
- **Configuration**: `segments.js` → `scraping.apifyInput`
- **Node**: `nodes/apify-scraper-node.js`

### Google Sheets Integration
- **Purpose**: Central lead database (one sheet per segment)
- **Sheet Tabs**: `Partners_Leads`, `HNI_Leads`, `UHNI_Leads`, `Mass_Affluent_Leads`
- **Node**: `nodes/google-sheets-node.js`
- **Operation**: Upsert (insert or update by email/LinkedIn URL)

### HeyGen Video Integration
- **Purpose**: Personalized video messages for hot HNI/UHNI leads
- **Node**: `nodes/video-personalization-node.js`
- **Triggered**: Only for leads with score ≥ 80

### Email Automation
- **Purpose**: Enqueue leads for email sequences (n8n or Lemlist)
- **Templates**: Defined in `03_OUTREACH_TEMPLATES.md`
- **Node**: `nodes/email-sequence-node.js`
- **Mapping**: `segments.js` → `outreach.emailTemplates`

### Slack Notifications
- **Purpose**: Post workflow execution summaries to team channel
- **Node**: `nodes/slack-notifier-node.js`
- **Format**: Lead counts, scoring breakdown, Hot/Warm/Cold distribution

## ICP Scoring Models

Each segment has a unique scoring model (0-100 scale) defined in `segments.js`:

### Partners Segment
- **Weights**: years_experience (25%), aum_band (20%), client_base (20%), digital_presence (15%), engagement (10%), location_tier (10%)
- **Tiers**: Hot ≥80, Warm ≥60, Cold ≥40

### HNI Segment
- **Weights**: net_worth_signal (30%), role_seniority (20%), education_pedigree (15%), investment_activity (15%), geography_score (10%), engagement (10%)
- **Tiers**: Hot ≥82, Warm ≥65, Cold ≥45

### UHNI Segment
- **Weights**: ownership_stake (30%), liquidity_events (25%), family_office_structure (20%), philanthropic_activity (10%), international_presence (10%), engagement (5%)
- **Tiers**: Hot ≥85, Warm ≥70, Cold ≥50

### Mass Affluent Segment
- **Weights**: income_band (25%), digital_behavior (20%), investment_history (20%), geography_score (15%), engagement (10%), intent_signal (10%)
- **Tiers**: Hot ≥78, Warm ≥58, Cold ≥38

Scoring logic is implemented in `nodes/lead-scoring-node.js`.

## Compliance & Best Practices

### LinkedIn Automation
- Rate limit: <100 connection requests per week per account
- Use residential proxies (configured in Apify)
- Avoid aggressive scraping (stagger requests)
- Do not use fake profiles

### Email Marketing
- Include unsubscribe link in all emails
- Honor opt-out requests within 48 hours
- Use double opt-in for newsletters
- Include sender identification and physical address

### SEBI Regulations
- All performance claims must include disclaimer:
  > "Past performance does not guarantee future returns. Investments in PMS are subject to market risks."
- Include risk disclosures
- Minimum investment thresholds (₹50 lakh for PMS) must be clearly stated

### Data Privacy
- Store lead data securely
- Get explicit consent before email marketing
- Delete data after 2 years if no engagement
- Do not share data with third parties

## Development Workflow

### Adding a New Segment
1. Define segment in `config/segments.js` with scraping, scoring, and outreach config
2. Create workflow file in `workflows/{segment}.workflow.js`
3. Register workflow in `workflows/index.js`
4. Add npm script to `package.json`: `"run:{segment}": "node main.js run --segment {segment}"`
5. Test in simulation mode: `npm run run:{segment}`
6. Test in live mode: `npm run run:{segment} -- --live` (requires credentials)

### Creating a New Node
1. Create `nodes/{node-name}-node.js` implementing `execute(context)` method
2. Register node in `core/workflow-orchestrator.js` → `this.nodeRegistry`
3. Add node to relevant workflow in `workflows/*.workflow.js`
4. Test workflow execution

### Modifying Scoring Logic
1. Update scoring weights in `config/segments.js` for target segment
2. Modify scoring calculation in `nodes/lead-scoring-node.js` if needed
3. Run workflow in simulation mode to validate score distribution
4. Adjust tier thresholds (hot/warm/cold) if distribution is skewed

## Environment Variables

Create `.env` file in `automation-engine/` directory:

```bash
# Required for live mode
APIFY_API_TOKEN=your_apify_token_here
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
GOOGLE_SHEETS_SPREADSHEET_ID=your_sheet_id_here

# Optional integrations
HEYGEN_API_KEY=your_heygen_key_here
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/...

# Execution mode
FORCE_LIVE_MODE=false    # Set to true to enforce live mode
```

## Testing & Validation

### Simulation Mode Testing
```bash
npm run init                          # Initialize data directories
npm run run:partners                  # Test Partners workflow (simulated)
npm run status                        # Check execution summary
cat data/executions.json | jq .      # View detailed execution log
```

### Live Mode Testing (requires credentials)
```bash
# Test with small sample size (override in node config)
npm run run:partners -- --live        # Run with real Apify API
npm run status                        # Verify execution
```

### Data Validation
- Check `data/leads/partners_leads.json` for output format
- Verify scoring distribution (Hot/Warm/Cold counts should match target conversion rates)
- Test deduplication by running workflow twice (should not duplicate leads)

## ROI & Success Metrics

### Target Lead Counts
- **Partners**: 500 leads → 25 conversions (5%) → ₹100 Cr indirect AUM
- **HNI**: 2,000 leads → 40 conversions (2%) → ₹40 Cr AUM
- **UHNI**: 200 leads → 10 conversions (5%) → ₹150 Cr AUM
- **Mass Affluent**: 5,000 leads → 50 conversions (1%) → ₹30 Cr AUM
- **Total**: 7,700 leads → 125 conversions → ₹320 Cr AUM → ₹6.4 Cr revenue @ 2% mgmt fee

### Budget Estimates
- **Apify scraping**: ~$2,073 (one-time)
- **Monthly outreach tools**: $400-950
- **Annual software stack**: $7,900
- **Total Year 1 investment**: ~$20,000
- **Projected ROI**: 320x

### KPIs to Monitor
- Lead quality: Average score, Hot/Warm/Cold distribution
- Email metrics: Open rate (35-45%), CTR (10-20%), Reply rate (8-15%)
- LinkedIn: Connection acceptance (30-50%), Message response (15-25%)
- Conversion: Discovery call booking (5-10%), Client conversion (1-5% by segment)

## Troubleshooting

### "No execution history found"
- Run `npm run init` to initialize data directories
- Execute a workflow: `npm run run:partners`

### "Unknown segment: {segment}"
- Check segment ID matches config key in `config/segments.js`
- Valid IDs: `partners`, `hni`, `uhni`, `mass_affluent`

### Workflow fails in live mode
- Verify all required environment variables are set in `.env`
- Check API credentials are valid (test Apify token in Apify console)
- Review logs for specific node failures

### Simulation mode not generating realistic data
- Check `config/segments.js` → `simulation` config for your segment
- Ensure `sharedSimulation` arrays have sufficient sample data
- Adjust `sampleSize` in node config if you need more/fewer samples

### Google Sheets integration failing
- Verify `GOOGLE_SHEETS_CREDENTIALS` is valid service account JSON (not file path)
- Ensure service account has editor access to the sheet
- Check `GOOGLE_SHEETS_SPREADSHEET_ID` matches your sheet

## Additional Resources

- **Apify Documentation**: https://docs.apify.com
- **Strategy Documents**: Read `00_MASTER_STRATEGY.md` for comprehensive overview
- **ICP Details**: Refer to `01_ICP_DEFINITIONS.md` for detailed buyer personas
- **Apify Guide**: See `02_APIFY_SCRAPING_GUIDE.md` for scraping workflows
- **Templates**: Use `03_OUTREACH_TEMPLATES.md` for email/LinkedIn copy

---

**Document Version**: 1.0
**Created**: 2025-10-09
**Owner**: PL Capital Marketing & Business Development
