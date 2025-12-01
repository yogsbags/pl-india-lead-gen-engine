/**
 * Competitor Social Media Analysis Workflow
 * Scrapes followers from competitor Instagram and Twitter accounts
 * Generates insights for content strategy and audience targeting
 */

export const competitorAnalysisWorkflow = {
  id: 'competitor-social-analysis',
  name: 'Competitor Social Media Analysis',
  description: 'Analyze competitor followers on Instagram and Twitter for content strategy',

  // Define your competitor accounts here
  competitors: {
    instagram: [
      'zerodhaonline',           // Zerodha
      'growwapp',                // Groww
      'angelbroking',            // Angel One
      'paytmmoney',              // Paytm Money
      'upstoxofficial'           // Upstox
    ],
    twitter: [
      'zerodhaonline',           // Zerodha
      'groww_official',          // Groww
      'angelbroking',            // Angel One
      'Paytm_Money',             // Paytm Money
      'upstox'                   // Upstox
    ]
  },

  nodes: [
    // Trigger
    {
      handler: 'TriggerNode',
      config: {
        name: 'Competitor Analysis Trigger',
        type: 'manual', // or 'scheduled' with cron
        description: 'Initiate competitor social media analysis'
      }
    },

    // Instagram Follower Scraping
    {
      handler: 'InstagramFollowerScraperNode',
      config: {
        name: 'Instagram Competitor Analysis',
        agentId: 'YOUR_INSTAGRAM_SCRAPER_AGENT_ID', // Get from PhantomBuster dashboard
        targetAccounts: [
          'zerodhaonline',
          'growwapp',
          'angelbroking',
          'paytmmoney',
          'upstoxofficial'
        ],
        maxFollowers: 500, // Followers to scrape per account
        outputField: 'instagramFollowers'
      }
    },

    // Twitter Follower Scraping
    {
      handler: 'TwitterFollowerScraperNode',
      config: {
        name: 'Twitter Competitor Analysis',
        agentId: 'YOUR_TWITTER_SCRAPER_AGENT_ID', // Get from PhantomBuster dashboard
        targetAccounts: [
          'zerodhaonline',
          'groww_official',
          'angelbroking',
          'Paytm_Money',
          'upstox'
        ],
        maxFollowers: 500, // Followers to scrape per account
        outputField: 'twitterFollowers'
      }
    },

    // Deduplicate followers across platforms
    {
      handler: 'DedupeNode',
      config: {
        name: 'Cross-Platform Dedupe',
        inputFields: ['instagramFollowers', 'twitterFollowers'],
        dedupeKey: 'username', // or 'handle' for Twitter
        outputField: 'uniqueAudienceMembers'
      }
    },

    // Export to Google Sheets for analysis
    {
      handler: 'GoogleSheetsNode',
      config: {
        name: 'Export Competitor Insights',
        sheetName: 'Competitor Analysis',
        tabs: {
          instagram: 'instagramFollowers',
          twitter: 'twitterFollowers',
          combined: 'uniqueAudienceMembers'
        }
      }
    },

    // Export to CSV
    {
      handler: 'CsvExportNode',
      config: {
        name: 'Export CSV Reports',
        exports: [
          {
            inputField: 'instagramFollowers_insights',
            filename: 'instagram_insights.csv'
          },
          {
            inputField: 'twitterFollowers_insights',
            filename: 'twitter_insights.csv'
          }
        ]
      }
    },

    // Slack notification with insights
    {
      handler: 'SlackNotifierNode',
      config: {
        name: 'Notify Team',
        message: 'Competitor social media analysis complete',
        includeInsights: true
      }
    },

    // Summary report
    {
      handler: 'SummaryReportNode',
      config: {
        name: 'Analysis Summary',
        includeFields: [
          'instagramFollowers_insights',
          'twitterFollowers_insights',
          'uniqueAudienceMembers'
        ]
      }
    }
  ]
};

export default competitorAnalysisWorkflow;
