/**
 * Signal-Based UHNI Workflow
 *
 * Ultra-high-net-worth individuals showing intent for:
 * - Family office services
 * - Private equity investment
 * - Wealth preservation
 * - Succession planning
 *
 * Key Difference: Lower volume (50-100 leads), ultra-high quality
 */

export default {
  id: 'signals-uhni',
  name: 'Signal-Based UHNI Prospecting',
  description: 'Intent-driven outreach to ultra-high-net-worth individuals',
  segment: 'uhni',

  nodes: [
    {
      id: 'trigger',
      handler: 'TriggerNode',
      name: 'Workflow Trigger',
      config: {
        schedule: '0 8 * * 1,4', // Monday & Thursday at 8 AM
        manual: true
      }
    },

    // STEP 1: Fetch UHNI leads with intent signals
    {
      id: 'intent_signals',
      handler: 'IntentSignalNode',
      name: 'Apollo Intent Signals',
      config: {
        maxResults: 100, // Smaller, ultra-high-quality sample
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
        reveal_phone_number: true, // UHNI worth the extra cost
        enrich_organization: true
      }
    },

    // STEP 3: Score signals
    {
      id: 'signal_score',
      handler: 'SignalScoringNode',
      name: 'Signal Scoring',
      config: {
        min_signal_score: 50 // Higher threshold for UHNI
      }
    },

    // STEP 4: Filter - UHNI requires higher bar
    {
      id: 'filter_signals',
      handler: 'DataQualityNode',
      name: 'UHNI Filter',
      config: {
        required_fields: ['email', 'signal_score'],
        min_signal_score: 50, // Higher than HNI (40)
        signal_tiers: ['Hot Signal', 'Warm Signal']
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

    // STEP 7: Video personalization for top UHNIs
    {
      id: 'video',
      handler: 'VideoPersonalizationNode',
      name: 'Video Personalization',
      config: {
        filter: 'signal_tier:Hot Signal AND icp_score:>=80',
        video_template: 'uhni_introduction'
      }
    },

    // STEP 8: Executive briefing for UHNIs
    {
      id: 'briefing',
      handler: 'ExecutiveBriefingNode',
      name: 'Executive Briefing',
      config: {
        filter: 'signal_tier:Hot Signal'
      }
    },

    // STEP 9: Export to CSV
    {
      id: 'csv',
      handler: 'CsvExportNode',
      name: 'CSV Export',
      config: {
        includeHeader: true,
        includeSignalData: true
      }
    },

    // STEP 10: Upload to Google Sheets
    {
      id: 'sheets',
      handler: 'GoogleSheetsNode',
      name: 'Google Sheets Sync',
      config: {
        operation: 'upsert',
        includeSignalColumns: true
      }
    },

    // STEP 11: Hot signals → Manual founder outreach only
    {
      id: 'hot_alert',
      handler: 'SlackNotifierNode',
      name: 'Hot UHNI Alert',
      config: {
        filter: 'signal_tier:Hot Signal',
        message_template: '🔥🔥🔥 ULTRA-HOT UHNI SIGNAL!\n\nProspect: {lead.name} ({lead.company})\nNet Worth: ${lead.estimated_net_worth}\nIntent: {lead.intent_topics}\nSignal Score: {lead.signal_score}\n\n⚠️ FOUNDER OUTREACH REQUIRED\n\n👉 Review executive briefing + personalized video'
      }
    },

    // STEP 12: Warm signals → High-touch sequence
    {
      id: 'warm_sequence',
      handler: 'EmailSequenceNode',
      name: 'UHNI Warm Sequence',
      config: {
        filter: 'signal_tier:Warm Signal',
        sequence_name: 'UHNI High-Touch Intent',
        personalization_fields: ['intent_topics', 'signal_triggers', 'estimated_net_worth']
      }
    },

    // STEP 13: Summary report
    {
      id: 'summary',
      handler: 'SummaryReportNode',
      name: 'Execution Summary'
    }
  ]
};
