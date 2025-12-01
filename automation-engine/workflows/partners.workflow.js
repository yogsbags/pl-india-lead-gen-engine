export default {
  id: 'partners',
  name: 'Partners Lead Workflow',
  description: 'Scrape, score, and nurture partner leads for PL Capital PMS partnerships.',
  nodes: [
    { id: 'trigger', handler: 'TriggerNode', name: 'Manual Trigger', config: { trigger: 'manual' } },
    {
      id: 'apify',
      handler: 'ApifyScraperNode',
      name: 'Apify Scraper',
      config: { sampleSize: 25 }
    },
    { id: 'quality', handler: 'DataQualityNode', name: 'Data Quality Checks' },
    { id: 'dedupe', handler: 'DedupeNode', name: 'Deduplicate Leads' },
    { id: 'score', handler: 'LeadScoringNode', name: 'Lead Scoring' },
    { id: 'csv', handler: 'CsvExportNode', name: 'CSV Export', config: { includeHeader: true } },
    { id: 'sheets', handler: 'GoogleSheetsNode', name: 'Google Sheets Upsert' },
    { id: 'email', handler: 'EmailSequenceNode', name: 'Email Sequence Enqueue' },
    { id: 'postmark', handler: 'PostmarkSendNode', name: 'Postmark Dispatch' },
    { id: 'slack', handler: 'SlackNotifierNode', name: 'Slack Summary' },
    { id: 'summary', handler: 'SummaryReportNode', name: 'Execution Summary' }
  ]
};
