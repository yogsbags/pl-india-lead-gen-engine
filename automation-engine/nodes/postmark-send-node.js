import fetch from 'node-fetch';
import WorkflowNode from './workflow-node.js';

const TOKEN_ENV = 'POSTMARK_SERVER_TOKEN';
const FROM_ENV = 'POSTMARK_FROM_EMAIL';
const STREAM_ENV = 'POSTMARK_MESSAGE_STREAM';

const replacePlaceholders = (template = '', lead = {}, context = {}) => {
  const tokens = {
    firstName: lead.first_name || lead.name?.split(' ')[0] || 'there',
    company: lead.company || 'your firm',
    senderName: context.senderName || process.env.POSTMARK_SENDER_NAME || 'PL Capital Team'
  };
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => tokens[key] || '');
};

export default class PostmarkSendNode extends WorkflowNode {
  async execute(input = []) {
    const enabled = Boolean(process.env[TOKEN_ENV] || this.context.settings.postmark.serverToken);
    if (!input.length) {
      this.log('No leads to send via Postmark');
      return input;
    }

    const allowSimulated = process.env.POSTMARK_ALLOW_SIMULATED === 'true';
    const hotAndWarm = input.filter((lead) => {
      if (!(lead.lead_tier === 'Hot' || lead.lead_tier === 'Warm')) return false;
      if (allowSimulated) return true;
      return lead.data_source !== 'apify-simulated';
    });
    if (!hotAndWarm.length) {
      this.log('No Hot/Warm leads for Postmark dispatch');
      return input;
    }

    if (!enabled || this.shouldSimulate()) {
      this.log('Postmark send (simulation)', { count: hotAndWarm.length });
      this.context.metrics.postmarkSimulated = hotAndWarm.length;
      return input;
    }

    const subjectTemplate = this.context.segment.outreach.initialEmail?.subject;
    const bodyTemplate = this.context.segment.outreach.initialEmail?.htmlBody;

    if (!subjectTemplate || !bodyTemplate) {
      this.warn('No initial email template configured for segment, skipping Postmark dispatch');
      return input;
    }

    const token = process.env[TOKEN_ENV] || this.context.settings.postmark.serverToken;
    const fromEmail = process.env[FROM_ENV] || this.context.settings.postmark.fromEmail;
    const messageStream =
      process.env[STREAM_ENV] || this.context.settings.postmark.messageStream || 'outbound';

    let success = 0;
    let failure = 0;

    for (const lead of hotAndWarm) {
      const payload = {
        From: fromEmail,
        To: lead.email || lead.linkedin_url || '',
        Subject: replacePlaceholders(subjectTemplate, lead, this.context.meta),
        HtmlBody: replacePlaceholders(bodyTemplate, lead, this.context.meta),
        MessageStream: messageStream
      };

      if (!payload.To || !payload.To.includes('@')) {
        this.warn('Skipping lead without valid email for Postmark', { lead: lead.lead_id });
        continue;
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await fetch('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Postmark-Server-Token': token
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorBody = await response.text();
          this.warn('Postmark send failed', {
            lead: lead.lead_id,
            status: response.status,
            body: errorBody
          });
          failure += 1;
          continue;
        }

        const data = await response.json();
        success += 1;
        lead.sequence_status = 'email_1_sent';
        lead.last_touch = new Date().toISOString();
        lead.postmark_message_id = data.MessageID;
      } catch (error) {
        this.warn('Postmark send error', { lead: lead.lead_id, message: error.message });
        failure += 1;
      }
    }

    this.context.metrics.postmarkSent = success;
    this.context.metrics.postmarkFailed = failure;
    this.log('Postmark dispatch complete', { success, failure });
    return input;
  }
}
