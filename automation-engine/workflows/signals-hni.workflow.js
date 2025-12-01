/**
 * Signal-Based HNI Workflow
 *
 * This workflow prioritizes leads showing active buying signals rather than
 * scraping broad lists. It's optimized for higher conversion rates with lower volume.
 *
 * Key Difference from Standard Workflow:
 * - Standard: Scrape 2,000 leads → Filter → Score → Outreach to all
 * - Signal-Based: Find 100-200 high-intent leads → Score → Outreach to top 50
 *
 * Expected Results:
 * - Volume: 200 leads/month (vs 2,000)
 * - Response Rate: 15-25% (vs 2-5%)
 * - Conversion: 12% (vs 2%)
 */

export default {
  id: 'signals-hni',
  name: 'Signal-Based HNI Prospecting',
  description: 'Intent-driven outreach to high-net-worth individuals showing buying signals',
  segment: 'hni',

  // Workflow nodes
  nodes: [
    {
      id: 'trigger',
      handler: 'TriggerNode',
      name: 'Workflow Trigger',
      config: {
        schedule: '0 8 * * *', // Daily at 8 AM
        manual: true
      }
    },

    // STEP 1: Fetch leads with intent signals
    {
      id: 'intent_signals',
      handler: 'IntentSignalNode',
      name: 'Apollo Intent Signals',
      config: {
        maxResults: 200, // Smaller, high-quality sample
        prioritize_high_intent: true
      }
    },

    // STEP 2: Enrich with additional data
    {
      id: 'enrich',
      handler: 'ApolloEnrichmentNode',
      name: 'Data Enrichment',
      config: {
        reveal_personal_emails: true,
        reveal_phone_number: false, // Expensive, use selectively
        enrich_organization: true
      }
    },

    // STEP 3: Score signals (composite intent + ICP)
    {
      id: 'signal_score',
      handler: 'SignalScoringNode',
      name: 'Signal Scoring',
      config: {
        min_signal_score: 40 // Only keep signals ≥40
      }
    },

    // STEP 4: Filter by signal tier
    {
      id: 'filter_signals',
      handler: 'DataQualityNode',
      name: 'Signal Filter',
      config: {
        required_fields: ['email', 'signal_score'],
        min_signal_score: 40,
        signal_tiers: ['Hot Signal', 'Warm Signal'] // Drop cold signals
      }
    },

    // STEP 5: Deduplicate
    {
      id: 'dedupe',
      handler: 'DedupeNode',
      name: 'Deduplication'
    },

    // STEP 6: Apply ICP scoring (traditional lead scoring)
    {
      id: 'icp_score',
      handler: 'LeadScoringNode',
      name: 'ICP Scoring'
    },

    // STEP 7: Export to CSV
    {
      id: 'csv',
      handler: 'CsvExportNode',
      name: 'CSV Export',
      config: {
        includeHeader: true,
        includeSignalData: true // Include signal scores in CSV
      }
    },

    // STEP 8: Upload to Google Sheets
    {
      id: 'sheets',
      handler: 'GoogleSheetsNode',
      name: 'Google Sheets Sync',
      config: {
        operation: 'upsert',
        includeSignalColumns: true
      }
    },

    // STEP 9: Hot Signals → Manual outreach
    {
      id: 'hot_alert',
      handler: 'SlackNotifierNode',
      name: 'Hot Signal Alert',
      config: {
        filter: 'signal_tier:Hot Signal',
        message_template: '🔥 {count} HOT SIGNALS detected!\n\nTop lead: {lead.name} ({lead.company})\nIntent: {lead.intent_topics}\nScore: {lead.signal_score}\n\n👉 Review now for immediate outreach!'
      }
    },

    // STEP 10: Warm Signals → Automated personalized sequence
    {
      id: 'warm_sequence',
      handler: 'EmailSequenceNode',
      name: 'Warm Signal Sequence',
      config: {
        filter: 'signal_tier:Warm Signal',
        sequence_name: 'HNI Warm Intent',
        personalization_fields: ['intent_topics', 'signal_triggers']
      }
    },

    // STEP 11: Summary report
    {
      id: 'summary',
      handler: 'SummaryReportNode',
      name: 'Execution Summary'
    }
  ],

  // Workflow execution flow (optional: override default sequential execution)
  flow: [
    'trigger',
    'intent_signals',
    'enrich',
    'signal_score',
    'filter_signals',
    'dedupe',
    'icp_score',
    'csv',
    'sheets',
    // Branch: Hot signals
    { if: 'signal_tier:Hot Signal', then: 'hot_alert' },
    // Branch: Warm signals
    { if: 'signal_tier:Warm Signal', then: 'warm_sequence' },
    'summary'
  ]
};
