export default {
  id: 'mass_affluent',
  name: 'Mass Affluent Lead Workflow',
  description:
    'Scaled capture and nurture workflow for mass affluent prospects driving newsletter growth.',
  nodes: [
    { id: 'trigger', handler: 'TriggerNode', name: 'Daily Trigger', config: { trigger: 'daily' } },
    {
      id: 'apify',
      handler: 'ApifyScraperNode',
      name: 'Apify Scraper',
      config: { sampleSize: 60 }
    },
    { id: 'quality', handler: 'DataQualityNode', name: 'Data Quality Checks' },
    { id: 'dedupe', handler: 'DedupeNode', name: 'Deduplicate Leads' },
    { id: 'score', handler: 'LeadScoringNode', name: 'Lead Scoring' },
    {
      id: 'newsletter',
      handler: 'NewsletterEnqueueNode',
      name: 'Newsletter Queue'
    },
    { id: 'sheets', handler: 'GoogleSheetsNode', name: 'Google Sheets Upsert' },
    { id: 'email', handler: 'EmailSequenceNode', name: 'Email Sequence Enqueue' },
    { id: 'postmark', handler: 'PostmarkSendNode', name: 'Postmark Dispatch' },
    { id: 'slack', handler: 'SlackNotifierNode', name: 'Slack Summary' },
    { id: 'summary', handler: 'SummaryReportNode', name: 'Execution Summary' }
  ]
};
