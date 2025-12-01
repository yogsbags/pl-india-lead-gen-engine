# PL Capital Lead Automation Engine

End-to-end **n8n-style workflow implementation** in Node.js for PL Capital's four ICP segments:

- Partners (IFAs, Wealth Managers)
- High Net Worth Individuals (HNIs)
- Ultra High Net Worth Individuals (UHNIs)
- Mass Affluent investors

The engine mirrors the structure of the `enhanced-bulk-generator` project while translating the Apify → Scoring → Outreach loops from the strategy documents into codified pipelines.

## ✨ Key Capabilities

- **Config-driven pipelines:** Each segment has its own workflow definition with triggers, scraping, enrichment, scoring, outreach, and reporting stages.
- **Node registry:** Modular node handlers for Apify actors, Google Sheets, email, Slack, CRM sync, and analytics updates.
- **Simulation-first design:** Ships with deterministic mock data so teams can validate orchestration without live credentials; flip the `simulate` flag to call real services.
- **Runbook integration:** Workflows embed compliance requirements, template references, and decision criteria from `01_ICP_DEFINITIONS.md` and `03_OUTREACH_TEMPLATES.md`.
- **Structured logging:** Opinionated logging via Pino (pretty by default) to mirror n8n execution logs.

## 🗂️ Project Layout

```
automation-engine/
├── main.js                     # CLI entry point (init, run, status)
├── config/
│   ├── environment.js          # Env loader with defaults
│   ├── segments.js             # ICP metadata & scoring weights
│   └── settings.js             # Global workflow defaults
├── core/
│   ├── logger.js               # Shared structured logger
│   ├── workflow-context.js     # Execution context & state helpers
│   ├── workflow-orchestrator.js# High-level orchestrator
│   └── workflow-runner.js      # Stage-by-stage executor
├── nodes/                      # Pluggable node handlers (n8n style)
│   ├── apify-scraper-node.js
│   ├── data-quality-node.js
│   ├── dedupe-node.js
│   ├── email-sequence-node.js
│   ├── google-sheets-node.js
│   ├── lead-scoring-node.js
│   ├── slack-notifier-node.js
│   ├── summary-report-node.js
│   └── workflow-node.js        # Base node class
├── workflows/                  # Segment-specific pipeline definitions
│   ├── partners.workflow.js
│   ├── hni.workflow.js
│   ├── uhni.workflow.js
│   ├── mass-affluent.workflow.js
│   └── index.js                # Workflow registry
├── data/                       # Generated execution data & reports
│   ├── executions.json         # Rolling execution history
│   └── leads/                  # Per-segment lead payloads (gitignored)
└── scripts/
    └── run-lint.js             # Placeholder lint hook (no-op)
```

## 🚀 Getting Started

```bash
cd projects/lead-generation/automation-engine
npm install
```

### 1. Bootstrap Files

```bash
npm run init
```

- Creates `data/executions.json`
- Verifies workflow definitions are loadable
- Prints segment summary with ICP goals

### 2. Dry Run (Simulated Data)

```bash
npm run run:partners
```

All workflows default to **simulate mode**, producing deterministic leads based on ICP attributes and outreach templates.

### 3. Connect Real Services

Set the following environment variables (or add them to `.env.local`):

- `APIFY_TOKEN` – required for live Apollo scraping
- `GOOGLE_SERVICE_ACCOUNT` (base64 JSON)
- `CRM_API_KEY` (Zoho/HubSpot/Airtable)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`
- `HEYGEN_API_KEY` (for HNI hot leads)
- `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM_EMAIL`, `POSTMARK_MESSAGE_STREAM` (default `outbound`)

Then run with:

```bash
node main.js run --segment hni --live
```

> ℹ️ Live mode (`--live`) attempts real Apify runs using the `apify~apollo-scraper` actor. If the request fails or returns empty results, the workflow automatically falls back to deterministic simulated data so downstream nodes can still execute. When `POSTMARK_SERVER_TOKEN` is present, the workflow also emails Hot/Warm leads via Postmark using the first template for each segment.

## 📊 Workflow Stages

Each workflow contains the following nodes (executed sequentially, similar to n8n):

1. **Trigger** – schedule/webhook simulation with run metadata.
2. **Apify Scraper** – orchestrates actors defined in `segments.js`.
3. **Data Quality** – cleans, fills missing fields, ensures compliance fields present.
4. **Dedupe** – removes duplicates against stored dataset (email/LinkedIn ID).
5. **Lead Scoring** – applies segment-specific weighting from ICP doc.
6. **Google Sheets** – upserts to segment tab using column schema from README.
7. **Email Sequence** – queues appropriate templates from `03_OUTREACH_TEMPLATES.md`.
8. **Slack Notifier** – alerts on hot leads or execution summary.
9. **Summary Report** – writes execution log + KPI snapshot to `/data/executions.json`.

UHNI & Mass Affluent flows include optional nodes (HeyGen video generation, newsletter updates) controlled by feature flags in settings.

## 🧪 Testing & Validation

- `npm run init` – sanity checks config.
- `node main.js status` – prints latest execution summary.
- `data/executions.json` – inspect history for QA.

## 📓 Notes

- The engine avoids network calls when required env variables are missing, emitting actionable warnings instead.
- All modules stick to ASCII and prefer short descriptive comments (per repo guidelines).
- Review `docs/` strategy & ICP files for context when adjusting scoring, templates, or compliance messaging.

Happy automating! 🚀
