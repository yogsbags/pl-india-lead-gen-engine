import { getMoengageClient } from './moengage-client.js';
import { getMoengageTemplateSync } from './moengage-template-sync.js';

/**
 * Service for managing MoEngage email campaigns programmatically
 */
export class MoengageCampaignManager {
  constructor(settings = {}) {
    this.client = getMoengageClient(settings);
    this.templateSync = getMoengageTemplateSync(settings);
    this.settings = settings;
  }

  /**
   * Create or update a campaign for a segment's initial email outreach
   * @param {Object} segment - Segment configuration object
   * @param {Object} options - Campaign options (trigger event, schedule, etc.)
   * @returns {Promise<Object>} Created/updated campaign response
   */
  async ensureCampaignForSegment(segment, options = {}) {
    const campaignName = `${segment.id}-initial-outreach`;

    try {
      // First, ensure template exists
      const templateResults = await this.templateSync.syncSegmentTemplates(segment);
      const syncedTemplate = templateResults.find(r => r.success);

      if (!syncedTemplate || !syncedTemplate.moengageTemplateId) {
        throw new Error(`Template sync failed for segment ${segment.id}`);
      }

      // Check if campaign already exists
      const existingCampaigns = await this.client.listEmailCampaigns({ name: campaignName });
      let campaignId = null;

      if (existingCampaigns.campaigns && existingCampaigns.campaigns.length > 0) {
        campaignId = existingCampaigns.campaigns[0].id || existingCampaigns.campaigns[0].campaign_id;
        this.log(`Found existing campaign: ${campaignName} (ID: ${campaignId})`);
      }

      const campaignConfig = {
        name: campaignName,
        template_id: syncedTemplate.moengageTemplateId,
        delivery_type: options.deliveryType || 'triggered',
        trigger: {
          event_name: 'EmailOutreachReady',
          event_attributes: {
            segment: segment.id,
            campaignType: 'email-outreach'
          }
        },
        target_audience: {
          segment_id: segment.id,
          // Add any additional targeting criteria
          ...(options.targeting || {})
        },
        schedule: options.schedule || {
          type: 'immediate'
        },
        from_name: this.settings.fromName || 'PL Capital Team',
        from_email: this.settings.fromEmail || 'ops@plcapital.in',
        reply_to: this.settings.replyTo || 'ops@plcapital.in',
        metadata: {
          segment_id: segment.id,
          source: 'lead-generation-automation',
          created_at: new Date().toISOString()
        }
      };

      if (campaignId) {
        // Update existing campaign
        this.log(`Updating campaign: ${campaignName}`);
        return await this.client.updateEmailCampaign(campaignId, campaignConfig);
      } else {
        // Create new campaign
        this.log(`Creating campaign: ${campaignName}`);
        return await this.client.createEmailCampaign(campaignConfig);
      }
    } catch (error) {
      throw new Error(`Failed to ensure campaign for segment ${segment.id}: ${error.message}`);
    }
  }

  /**
   * Create a campaign that triggers on EmailOutreachReady event
   * @param {Object} config - Campaign configuration
   * @returns {Promise<Object>} Created campaign response
   */
  async createTriggeredCampaign(config) {
    const campaignConfig = {
      name: config.name,
      template_id: config.templateId,
      delivery_type: 'triggered',
      trigger: {
        event_name: config.triggerEvent || 'EmailOutreachReady',
        event_attributes: config.triggerAttributes || {}
      },
      target_audience: config.targetAudience || {},
      from_name: config.fromName || this.settings.fromName || 'PL Capital Team',
      from_email: config.fromEmail || this.settings.fromEmail || 'ops@plcapital.in',
      reply_to: config.replyTo || this.settings.replyTo || 'ops@plcapital.in',
      ...(config.metadata && { metadata: config.metadata })
    };

    return await this.client.createEmailCampaign(campaignConfig);
  }

  /**
   * Create a scheduled campaign
   * @param {Object} config - Campaign configuration with schedule
   * @returns {Promise<Object>} Created campaign response
   */
  async createScheduledCampaign(config) {
    const campaignConfig = {
      name: config.name,
      template_id: config.templateId,
      delivery_type: 'scheduled',
      schedule: config.schedule,
      target_audience: config.targetAudience || {},
      from_name: config.fromName || this.settings.fromName || 'PL Capital Team',
      from_email: config.fromEmail || this.settings.fromEmail || 'ops@plcapital.in',
      reply_to: config.replyTo || this.settings.replyTo || 'ops@plcapital.in',
      ...(config.metadata && { metadata: config.metadata })
    };

    return await this.client.createEmailCampaign(campaignConfig);
  }

  /**
   * Test a campaign before sending
   * @param {string} campaignId - Campaign ID
   * @param {Array<string>} testEmails - Email addresses to send test to
   * @returns {Promise<Object>} Test result
   */
  async testCampaign(campaignId, testEmails) {
    return await this.client.testEmailCampaign(campaignId, {
      test_emails: testEmails
    });
  }

  /**
   * Get campaign reachability estimate
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object>} Reachability data
   */
  async getCampaignReachability(campaignId) {
    return await this.client.getCampaignMeta(campaignId);
  }

  /**
   * Get campaign details including status
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object>} Campaign details
   */
  async getCampaignDetails(campaignId) {
    return await this.client.getEmailCampaign(campaignId);
  }

  /**
   * List all campaigns for a segment
   * @param {string} segmentId - Segment ID
   * @returns {Promise<Array>} List of campaigns
   */
  async listSegmentCampaigns(segmentId) {
    const allCampaigns = await this.client.listEmailCampaigns();
    if (!allCampaigns.campaigns) return [];

    return allCampaigns.campaigns.filter(campaign =>
      campaign.metadata?.segment_id === segmentId ||
      campaign.name?.includes(segmentId)
    );
  }

  log(message) {
    if (this.settings.logger) {
      this.settings.logger.info({ service: 'MoengageCampaignManager' }, message);
    } else {
      console.log(`[MoengageCampaignManager] ${message}`);
    }
  }
}

export function getMoengageCampaignManager(settings = {}) {
  return new MoengageCampaignManager(settings);
}

