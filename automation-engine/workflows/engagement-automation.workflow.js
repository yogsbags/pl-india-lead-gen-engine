/**
 * LinkedIn Engagement Automation Workflow
 * Automates LinkedIn engagement (connections, messages, visits) for lead generation
 */

export const engagementAutomationWorkflow = {
  id: 'linkedin-engagement-automation',
  name: 'LinkedIn Engagement Automation',
  description: 'Automated LinkedIn engagement for warm lead generation',

  nodes: [
    // Trigger (daily execution recommended)
    {
      handler: 'TriggerNode',
      config: {
        name: 'Daily Engagement Trigger',
        type: 'scheduled',
        cron: '0 9 * * 1-5', // 9 AM weekdays
        description: 'Daily LinkedIn engagement automation'
      }
    },

    // Load qualified leads from Google Sheets
    {
      handler: 'GoogleSheetsNode',
      config: {
        name: 'Load Qualified Leads',
        operation: 'read',
        sheetName: 'Lead Database',
        filters: {
          score: { $gte: 60 },           // Score >= 60
          connectionSent: { $ne: true }   // Not yet contacted
        },
        limit: 100,
        outputField: 'qualifiedLeads'
      }
    },

    // Step 1: Profile Visits (Warm Engagement)
    {
      handler: 'PhantomBusterNode',
      config: {
        name: 'Profile Visit Automation',
        agentId: 'YOUR_PROFILE_VISITOR_AGENT_ID',
        phantomType: 'profile-visitor',
        inputField: 'qualifiedLeads',
        argument: {
          numberOfVisitsPerLaunch: 100,
          csvName: 'profile_visits_daily'
        },
        filter: lead => lead.score >= 60 && lead.score < 80, // Warm leads
        outputField: 'profileVisits'
      }
    },

    // Step 2: Connection Requests (Hot Leads)
    {
      handler: 'PhantomBusterNode',
      config: {
        name: 'Connection Request Automation',
        agentId: 'YOUR_NETWORK_BOOSTER_AGENT_ID',
        phantomType: 'network-booster',
        inputField: 'qualifiedLeads',
        argument: {
          numberOfConnectionsPerLaunch: 25, // LinkedIn safe limit
          message: 'Hi {firstName}, came across your profile and was impressed by your work at {currentCompany}. I share insights about systematic investing and portfolio management. Would love to connect!',
          onlySecondCircle: true,
          csvName: 'connection_requests_daily'
        },
        filter: lead => lead.score >= 80, // Hot leads only
        outputField: 'connectionRequests'
      }
    },

    // Wait 3 days before follow-up messages
    {
      handler: 'DelayNode',
      config: {
        name: 'Wait for Connection Acceptance',
        days: 3
      }
    },

    // Step 3: Follow-up Messages (Accepted Connections)
    {
      handler: 'PhantomBusterNode',
      config: {
        name: 'Follow-up Message Automation',
        agentId: 'YOUR_MESSAGE_SENDER_AGENT_ID',
        phantomType: 'message-sender',
        inputField: 'connectionRequests',
        argument: {
          numberOfMessagesPerLaunch: 30,
          messageColumn: 'Custom Message',
          csvName: 'follow_up_messages'
        },
        filter: lead => lead.connectionAccepted === true,
        messageTemplate: `Thanks for connecting, {firstName}!

I noticed your background in {industry} and thought you might find our recent insights interesting:

📊 Our AQUA fund has delivered 76% returns over 18 months through systematic quant strategies.

Would you be open to a quick 15-min intro call to explore how our PMS approach could complement your portfolio?`,
        outputField: 'messagesSent'
      }
    },

    // Update Google Sheets with engagement data
    {
      handler: 'GoogleSheetsNode',
      config: {
        name: 'Update Lead Status',
        operation: 'update',
        sheetName: 'Lead Database',
        updates: [
          {
            field: 'profileVisited',
            value: true,
            condition: { id: { $in: 'profileVisits' } }
          },
          {
            field: 'connectionSent',
            value: true,
            condition: { id: { $in: 'connectionRequests' } }
          },
          {
            field: 'messageSent',
            value: true,
            condition: { id: { $in: 'messagesSent' } }
          }
        ]
      }
    },

    // Track engagement metrics
    {
      handler: 'SummaryReportNode',
      config: {
        name: 'Daily Engagement Summary',
        metrics: {
          profileVisits: 'profileVisits.length',
          connectionRequests: 'connectionRequests.length',
          messagesSent: 'messagesSent.length',
          executionTime: 'context.executionTime'
        }
      }
    },

    // Notify team via Slack
    {
      handler: 'SlackNotifierNode',
      config: {
        name: 'Daily Engagement Notification',
        message: '📊 LinkedIn Engagement Summary',
        fields: [
          { title: 'Profile Visits', value: '{profileVisits.length}' },
          { title: 'Connection Requests', value: '{connectionRequests.length}' },
          { title: 'Messages Sent', value: '{messagesSent.length}' },
          { title: 'Execution Time', value: '{executionTime} minutes' }
        ]
      }
    }
  ]
};

export default engagementAutomationWorkflow;
