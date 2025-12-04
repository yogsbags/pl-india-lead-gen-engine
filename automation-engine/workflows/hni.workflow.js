export default {
  id: 'hni',
  name: 'HNI Lead Workflow',
  description:
    'Automated scraping, enrichment, HeyGen personalization, and nurture for High Net Worth Individuals.',
  nodes: [
    { id: 'trigger', handler: 'TriggerNode', name: 'Scheduled Trigger', config: { trigger: 'weekly' } },
    {
      id: 'apollo',
      handler: 'ApolloSearchNode',
      name: 'Apollo Search',
      config: { sampleSize: 10 }
    },
    { id: 'quality', handler: 'DataQualityNode', name: 'Data Quality Checks' },
    { id: 'dedupe', handler: 'DedupeNode', name: 'Deduplicate Leads' },
    { id: 'score', handler: 'LeadScoringNode', name: 'Lead Scoring' },
    {
      id: 'video',
      handler: 'VideoPersonalizationNode',
      name: 'HeyGen Personalization'
    },
    { id: 'sheets', handler: 'GoogleSheetsNode', name: 'Google Sheets Upsert' },
    { id: 'email', handler: 'EmailSequenceNode', name: 'Email Sequence Enqueue' },
    { id: 'email-send', handler: 'EmailSendNode', name: 'Email Dispatch (MoEngage/Postmark)' },
    { id: 'slack', handler: 'SlackNotifierNode', name: 'Slack Summary' },
    { id: 'summary', handler: 'SummaryReportNode', name: 'Execution Summary' }
  ]
};
