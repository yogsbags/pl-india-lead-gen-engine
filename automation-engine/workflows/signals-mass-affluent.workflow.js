/**
 * Signal-Based Mass Affluent Workflow
 *
 * Mass affluent professionals showing intent for:
 * - Retirement planning
 * - Investment apps
 * - Mutual funds / SIPs
 * - Tax saving
 *
 * Key Difference: Higher volume (300-500 leads), automated nurture
 */

export default {
  id: 'signals-mass-affluent',
  name: 'Signal-Based Mass Affluent Prospecting',
  description: 'Intent-driven outreach to mass affluent professionals',
  segment: 'mass_affluent',

  nodes: [
    {
      id: 'trigger',
      handler: 'TriggerNode',
      name: 'Workflow Trigger',
      config: {
        schedule: '0 9 * * *', // Daily at 9 AM
        manual: true
      }
    },

    // STEP 1: Fetch mass affluent leads with intent
    {
      id: 'intent_signals',
      handler: 'IntentSignalNode',
      name: 'Apollo Intent Signals',
      config: {
        maxResults: 500, // Higher volume for mass market
        prioritize_high_intent: false // Accept medium/low intent too
      }
    },

    // STEP 2: Enrich (basic enrichment only)
    {
      id: 'enrich',
      handler: 'ApolloEnrichmentNode',
      name: 'Data Enrichment',
      config: {
        reveal_personal_emails: true,
        reveal_phone_number: false, // Too expensive for mass market
        enrich_organization: false
      }
    },

    // STEP 3: Score signals
    {
      id: 'signal_score',
      handler: 'SignalScoringNode',
      name: 'Signal Scoring',
      config: {
        min_signal_score: 30 // Lower threshold for mass market
      }
    },

    // STEP 4: Filter - Keep all signals
    {
      id: 'filter_signals',
      handler: 'DataQualityNode',
      name: 'Quality Filter',
      config: {
        required_fields: ['email', 'signal_score'],
        min_signal_score: 30, // Lower bar
        signal_tiers: ['Hot Signal', 'Warm Signal', 'Cold Signal'] // Keep all
      }
    },

    // STEP 5: Deduplicate
    {
      id: 'dedupe',
      handler: 'DedupeNode',
      name: 'Deduplication'
    },

    // STEP 6: Apply ICP scoring
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
        includeSignalData: true
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

    // STEP 9: Hot signals → Sales team review
    {
      id: 'hot_alert',
      handler: 'SlackNotifierNode',
      name: 'Hot Signal Alert',
      config: {
        filter: 'signal_tier:Hot Signal',
        message_template: '🔥 {count} HOT Mass Affluent signals!\n\nTop lead: {lead.name}\nIntent: {lead.intent_topics}\nScore: {lead.signal_score}\n\n👉 Add to high-priority outreach queue'
      }
    },

    // STEP 10: Warm signals → Automated sequence
    {
      id: 'warm_sequence',
      handler: 'EmailSequenceNode',
      name: 'Warm Signal Sequence',
      config: {
        filter: 'signal_tier:Warm Signal',
        sequence_name: 'Mass Affluent Retirement Planning',
        personalization_fields: ['intent_topics', 'signal_triggers']
      }
    },

    // STEP 11: Cold signals → Newsletter enrollment
    {
      id: 'cold_newsletter',
      handler: 'NewsletterEnqueueNode',
      name: 'Newsletter Enrollment',
      config: {
        filter: 'signal_tier:Cold Signal',
        newsletter_list: 'mass_affluent_education'
      }
    },

    // STEP 12: Summary report
    {
      id: 'summary',
      handler: 'SummaryReportNode',
      name: 'Execution Summary'
    }
  ]
};
