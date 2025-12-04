import path from 'path';
import { fileURLToPath } from 'url';
import env, { getEnv } from './environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultSheetColumns = [
  'name',
  'job_title',
  'company',
  'email',
  'phone',
  'linkedin_url',
  'website',
  'location',
  'aum',
  'segment',
  'lead_score',
  'lead_tier',
  'data_source',
  'scraped_at',
  'sequence_status',
  'last_touch',
  'notes'
];

const settings = {
  simulateByDefault: getEnv('LEAD_AUTOMATION_SIMULATE', 'true') !== 'false',
  defaultBatchSize: Number.parseInt(getEnv('LEAD_AUTOMATION_BATCH', '25'), 10),
  dataDir: env.dataDir,
  leadsDir: env.leadsDir,
  logLevel: getEnv('LEAD_AUTOMATION_LOG_LEVEL', 'info'),
  sheetId: getEnv('LEAD_AUTOMATION_SHEET_ID', 'PL_CAPITAL_LEADS_SHEET_ID'),
  sheetColumns: defaultSheetColumns,
  slackChannel: getEnv('LEAD_AUTOMATION_SLACK_CHANNEL', '#lead-gen-notifications'),
  reportFile: path.join(env.dataDir, 'executions.json'),
  heygen: {
    enabled: getEnv('HEYGEN_API_KEY') ? true : false,
    apiKey: getEnv('HEYGEN_API_KEY', '')
  },
  moengage: {
    enabled: Boolean(
      getEnv('MOENGAGE_WORKSPACE_ID') &&
      getEnv('MOENGAGE_DATA_API_KEY') &&
      getEnv('MOENGAGE_REPORTING_API_KEY')
    ),
    workspaceId: getEnv('MOENGAGE_WORKSPACE_ID', ''),
    dataApiKey: getEnv('MOENGAGE_DATA_API_KEY', ''),
    reportingApiKey: getEnv('MOENGAGE_REPORTING_API_KEY', ''),
    baseUrl: getEnv('MOENGAGE_BASE_URL', 'https://api-01.moengage.com'),
    reportsBaseUrl: getEnv('MOENGAGE_REPORTS_BASE_URL', 'https://api-01.moengage.com')
  },
  postmark: {
    enabled: Boolean(getEnv('POSTMARK_SERVER_TOKEN')),
    serverToken: getEnv('POSTMARK_SERVER_TOKEN', ''),
    fromEmail: getEnv('POSTMARK_FROM_EMAIL', 'ops@plcapital.in'),
    messageStream: getEnv('POSTMARK_MESSAGE_STREAM', 'outbound')
  },
  crm: {
    provider: getEnv('CRM_PROVIDER', 'hubspot'),
    apiKey: getEnv('CRM_API_KEY', '')
  },
  featureFlags: {
    enableCrmSync: getEnv('LEAD_AUTOMATION_ENABLE_CRM_SYNC', 'false') === 'true',
    enableNewsletterQueue: true
  },
  paths: {
    templates: path.join(__dirname, '..', 'config', 'templates')
  }
};

export default settings;
