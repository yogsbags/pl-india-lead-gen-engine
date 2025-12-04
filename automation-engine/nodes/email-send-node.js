import fetch from 'node-fetch';
import WorkflowNode from './workflow-node.js';
import { getMoengageClient } from '../services/moengage-client.js';
import { getMoengageTemplateSync } from '../services/moengage-template-sync.js';
import { getMoengageCampaignManager } from '../services/moengage-campaign-manager.js';
import PostmarkSendNode from './postmark-send-node.js';

const replacePlaceholders = (template = '', lead = {}, context = {}) => {
  const tokens = {
    firstName: lead.first_name || lead.name?.split(' ')[0] || 'there',
    company: lead.company || 'your firm',
    senderName: context.senderName || process.env.POSTMARK_SENDER_NAME || 'PL Capital Team'
  };
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => tokens[key] || '');
};

/**
 * Email Send Node with MoEngage primary, Postmark fallback
 *
 * Tries to send emails via MoEngage first. If MoEngage fails or is not configured,
 * falls back to Postmark. This ensures email delivery reliability.
 */
export default class EmailSendNode extends WorkflowNode {
  constructor(definition = {}, context) {
    super(definition, context);
    this.postmarkFallback = new PostmarkSendNode(definition, context);
  }

  async execute(input = []) {
    if (!input.length) {
      this.log('No leads to send via email');
      return input;
    }

    const allowSimulated = process.env.POSTMARK_ALLOW_SIMULATED === 'true';
    const hotAndWarm = input.filter((lead) => {
      if (!(lead.lead_tier === 'Hot' || lead.lead_tier === 'Warm')) return false;
      if (allowSimulated) return true;
      return lead.data_source !== 'apify-simulated';
    });

    if (!hotAndWarm.length) {
      this.log('No Hot/Warm leads for email dispatch');
      return input;
    }

    const subjectTemplate = this.context.segment.outreach.initialEmail?.subject;
    const bodyTemplate = this.context.segment.outreach.initialEmail?.htmlBody;

    if (!subjectTemplate || !bodyTemplate) {
      this.warn('No initial email template configured for segment, skipping email dispatch');
      return input;
    }

    // Check if MoEngage is enabled
    const moengageEnabled = Boolean(
      this.context.settings.moengage?.enabled &&
      this.context.settings.moengage?.workspaceId &&
      this.context.settings.moengage?.dataApiKey
    );

    // Try MoEngage first if enabled
    if (moengageEnabled && !this.shouldSimulate()) {
      try {
        // Optionally sync template and campaign to MoEngage if enabled
        const useMoengageTemplates = process.env.MOENGAGE_USE_TEMPLATES === 'true';
        const useMoengageCampaigns = process.env.MOENGAGE_USE_CAMPAIGNS === 'true';

        if (useMoengageTemplates) {
          await this.ensureTemplateSynced();
        }

        if (useMoengageCampaigns) {
          await this.ensureCampaignCreated();
        }

        return await this.sendViaMoengage(hotAndWarm, subjectTemplate, bodyTemplate, input, useMoengageTemplates);
      } catch (error) {
        this.warn('MoEngage send failed, falling back to Postmark', {
          error: error.message,
          count: hotAndWarm.length
        });
        // Fall through to Postmark fallback
      }
    }

    // Fallback to Postmark
    this.log('Using Postmark for email dispatch', { count: hotAndWarm.length });
    return await this.postmarkFallback.execute(input);
  }

  async ensureTemplateSynced() {
    try {
      const templateSync = getMoengageTemplateSync({
        ...this.context.settings.moengage,
        logger: this.context.logger
      });
      const results = await templateSync.syncSegmentTemplates(this.context.segment);
      const synced = results.filter(r => r.success);
      if (synced.length > 0) {
        this.log(`Synced ${synced.length} template(s) to MoEngage`, { results: synced });
        // Store MoEngage template ID for later use
        this.context.meta.moengageTemplateId = synced[0].moengageTemplateId;
      }
    } catch (error) {
      this.warn('Template sync failed, continuing with event-based approach', {
        error: error.message
      });
    }
  }

  async ensureCampaignCreated() {
    try {
      const campaignManager = getMoengageCampaignManager({
        ...this.context.settings.moengage,
        logger: this.context.logger
      });
      const campaign = await campaignManager.ensureCampaignForSegment(this.context.segment);
      this.log(`Ensured campaign exists for segment ${this.context.segment.id}`, {
        campaignId: campaign.id || campaign.campaign_id
      });
      this.context.meta.moengageCampaignId = campaign.id || campaign.campaign_id;
    } catch (error) {
      this.warn('Campaign creation failed, continuing with event-based approach', {
        error: error.message
      });
    }
  }

  async sendViaMoengage(leads, subjectTemplate, bodyTemplate, allLeads, useTemplateId = false) {
    const client = getMoengageClient(this.context.settings.moengage);
    let success = 0;
    let failure = 0;

    // Get MoEngage template ID if using templates
    let moengageTemplateId = null;
    if (useTemplateId) {
      try {
        const templateSync = getMoengageTemplateSync({
          ...this.context.settings.moengage,
          logger: this.context.logger
        });
        moengageTemplateId = await templateSync.getTemplateIdForSegment(this.context.segment);
        if (moengageTemplateId) {
          this.log(`Using MoEngage template ID: ${moengageTemplateId}`);
        }
      } catch (error) {
        this.warn('Could not retrieve MoEngage template ID, using event-based approach', {
          error: error.message
        });
      }
    }

    for (const lead of leads) {
      const email = lead.email || lead.linkedin_url || '';

      if (!email || !email.includes('@')) {
        this.warn('Skipping lead without valid email for MoEngage', { lead: lead.lead_id });
        continue;
      }

      const subject = replacePlaceholders(subjectTemplate, lead, this.context.meta);
      const htmlBody = replacePlaceholders(bodyTemplate, lead, this.context.meta);
      const plainText = htmlBody.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n').trim();

      try {
        // Track customer profile update
        await client.track({
          type: 'customer',
          customer_id: lead.lead_id || lead.email || `lead-${Date.now()}`,
          attributes: {
            email: email,
            first_name: lead.first_name || lead.name?.split(' ')[0] || '',
            last_name: lead.name?.split(' ').slice(1).join(' ') || '',
            company: lead.company || '',
            job_title: lead.job_title || '',
            phone: lead.phone || '',
            linkedin_url: lead.linkedin_url || '',
            lead_tier: lead.lead_tier || '',
            lead_score: lead.lead_score || 0,
            segment: this.context.segment.id || '',
            source: 'lead-generation-automation'
          }
        });

        // Track email sent event
        await client.track({
          type: 'event',
          customer_id: lead.lead_id || lead.email || `lead-${Date.now()}`,
          actions: [
            {
              action: 'LeadEmailSent',
              timestamp: Date.now(),
              attributes: {
                subject: subject,
                email_type: 'initial_outreach',
                segment: this.context.segment.id || '',
                lead_tier: lead.lead_tier || '',
                lead_score: lead.lead_score || 0,
                campaign_type: 'email-outreach',
                source: 'lead-generation-automation'
              }
            }
          ]
        });

        // Push email content event for MoEngage campaign to pick up
        // If using template ID, include it; otherwise send full HTML
        const emailAttributes = {
          email: email,
          lead_id: lead.lead_id || '',
          segment: this.context.segment.id || '',
          lead_tier: lead.lead_tier || '',
          source: 'lead-generation-automation',
          campaignType: 'email-outreach'
        };

        if (moengageTemplateId) {
          // Use template ID approach (more efficient)
          emailAttributes.template_id = moengageTemplateId;
          emailAttributes.subject = subject; // Still include subject for personalization
        } else {
          // Event-based approach with full HTML (current method)
          emailAttributes.subject = subject;
          emailAttributes.html = htmlBody.slice(0, 48000); // Keep payload size manageable
          emailAttributes.plainText = plainText.slice(0, 48000);
        }

        await client.track({
          type: 'event',
          customer_id: lead.lead_id || lead.email || `lead-${Date.now()}`,
          actions: [
            {
              action: 'EmailOutreachReady',
              timestamp: Date.now(),
              attributes: emailAttributes
            }
          ]
        });

        success += 1;
        lead.sequence_status = 'email_1_sent';
        lead.last_touch = new Date().toISOString();
        lead.email_provider = 'moengage';
        lead.moengage_tracked = true;
      } catch (error) {
        this.warn('MoEngage send error for lead', {
          lead: lead.lead_id,
          email: email,
          message: error.message
        });
        failure += 1;
        // Mark for Postmark fallback
        lead.email_provider = 'moengage_failed';
      }
    }

    this.context.metrics.moengageSent = success;
    this.context.metrics.moengageFailed = failure;
    this.log('MoEngage dispatch complete', { success, failure });

    // If some failed, try Postmark for failed ones
    const failedLeads = allLeads.filter(lead => lead.email_provider === 'moengage_failed');
    if (failedLeads.length > 0) {
      this.log('Attempting Postmark fallback for failed MoEngage sends', {
        count: failedLeads.length
      });
      await this.postmarkFallback.execute(failedLeads);
    }

    return allLeads;
  }
}

