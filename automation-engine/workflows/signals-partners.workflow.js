/**
 * Signal-Based Partners Workflow
 *
 * Strategic partners (IFAs, FinTech, Wealth-Tech) showing intent for:
 * - Partner programs
 * - Co-selling
 * - API partnerships
 * - White-label solutions
 *
 * Key Difference: Focus on organizations, not individuals
 */

export default {
  id: 'signals-partners',
  name: 'Signal-Based Partners Prospecting',
  description: 'Intent-driven outreach to strategic partners',
  segment: 'partners',

  nodes: [
    {
      id: 'trigger',
      handler: 'TriggerNode',
      name: 'Workflow Trigger',
      config: {
        schedule: '0 10 * * 2,5', // Tuesday & Friday at 10 AM
        manual: true
      }
    },

    // STEP 1: Fetch partner leads with intent
    {
      id: 'intent_signals',
      handler: 'IntentSignalNode',
      name: 'Apollo Intent Signals',
      config: {
        maxResults: 150, // Medium volume for partners
        prioritize_high_intent: true
      }
    },

    // STEP 2: Enrich
    {
      id: 'enrich',
      handler: 'ApolloEnrichmentNode',
      name: 'Data Enrichment',
      config: {
        reveal_personal_emails: true,
        reveal_phone_number: false,
        enrich_organization: true // Important for partners
      }
    },

    // STEP 3: Score signals
    {
      id: 'signal_score',
      handler: 'SignalScoringNode',
      name: 'Signal Scoring',
      config: {
        min_signal_score: 40
      }
    },

    // STEP 4: Filter signals
    {
      id: 'filter_signals',
      handler: 'DataQualityNode',
      name: 'Partner Filter',
      config: {
        required_fields: ['email', 'signal_score', 'company'],
        min_signal_score: 40,
        signal_tiers: ['Hot Signal', 'Warm Signal']
      }
    },

    // STEP 5: Deduplicate by company (not email)
    {
      id: 'dedupe',
      handler: 'DedupeNode',
      name: 'Deduplication',
      config: {
        dedupe_by: 'company' // For partners, dedupe by organization
      }
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

    // STEP 9: Hot signals → Business development review
    {
      id: 'hot_alert',
      handler: 'SlackNotifierNode',
      name: 'Hot Partner Alert',
      config: {
        filter: 'signal_tier:Hot Signal',
        message_template: '🤝 {count} HOT Partner signals!\n\nCompany: {lead.company}\nContact: {lead.name} ({lead.title})\nIntent: {lead.intent_topics}\nScore: {lead.signal_score}\nFunding: {lead.organization.recent_funding}\n\n💼 Business Development Outreach Required\n\n👉 Schedule partnership discovery call'
      }
    },

    // STEP 10: Warm signals → Partner nurture sequence
    {
      id: 'warm_sequence',
      handler: 'EmailSequenceNode',
      name: 'Partner Warm Sequence',
      config: {
        filter: 'signal_tier:Warm Signal',
        sequence_name: 'Partner Co-Selling Opportunity',
        personalization_fields: ['intent_topics', 'signal_triggers', 'company', 'organization.technologies']
      }
    },

    // STEP 11: Summary report
    {
      id: 'summary',
      handler: 'SummaryReportNode',
      name: 'Execution Summary'
    }
  ]
};
