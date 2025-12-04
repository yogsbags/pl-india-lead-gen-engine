export default {
  id: 'uhni',
  name: 'UHNI Lead Workflow',
  description:
    'Focused pipeline for UHNI principals and family offices, producing executive briefing materials.',
  nodes: [
    { id: 'trigger', handler: 'TriggerNode', name: 'Manual Trigger', config: { trigger: 'curated' } },
    {
      id: 'apify',
      handler: 'ApifyScraperNode',
      name: 'Apify Scraper',
      config: { sampleSize: 15 }
    },
    { id: 'quality', handler: 'DataQualityNode', name: 'Data Quality Checks' },
    { id: 'dedupe', handler: 'DedupeNode', name: 'Deduplicate Leads' },
    { id: 'score', handler: 'LeadScoringNode', name: 'Lead Scoring' },
    {
      id: 'briefing',
      handler: 'ExecutiveBriefingNode',
      name: 'Executive Briefing Prep'
    },
    { id: 'sheets', handler: 'GoogleSheetsNode', name: 'Google Sheets Upsert' },
    { id: 'email', handler: 'EmailSequenceNode', name: 'EA Email Sequence' },
    { id: 'email-send', handler: 'EmailSendNode', name: 'Email Dispatch (MoEngage/Postmark)' },
    { id: 'slack', handler: 'SlackNotifierNode', name: 'Slack Summary' },
    { id: 'summary', handler: 'SummaryReportNode', name: 'Execution Summary' }
  ]
};
