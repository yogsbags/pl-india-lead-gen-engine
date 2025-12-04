import { getMoengageClient } from './moengage-client.js';

/**
 * Service for syncing email templates from segment configurations to MoEngage
 */
export class MoengageTemplateSync {
  constructor(settings = {}) {
    this.client = getMoengageClient(settings);
    this.settings = settings;
  }

  /**
   * Create or update a template in MoEngage from segment configuration
   * @param {Object} segment - Segment configuration object
   * @param {string} templateId - Template identifier (e.g., 'P-E-01')
   * @returns {Promise<Object>} Created/updated template response
   */
  async syncTemplateFromSegment(segment, templateId) {
    const initialEmail = segment.outreach?.initialEmail;
    if (!initialEmail || !initialEmail.subject || !initialEmail.htmlBody) {
      throw new Error(`Segment ${segment.id} missing initialEmail configuration`);
    }

    const templateName = `${segment.id}-${templateId}-initial`;
    const templateData = {
      name: templateName,
      subject: initialEmail.subject,
      html_body: initialEmail.htmlBody,
      plain_text_body: initialEmail.htmlBody.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n').trim(),
      from_name: this.settings.fromName || 'PL Capital Team',
      from_email: this.settings.fromEmail || 'ops@plcapital.in',
      reply_to: this.settings.replyTo || 'ops@plcapital.in',
      // Metadata for tracking
      metadata: {
        segment_id: segment.id,
        template_id: templateId,
        source: 'lead-generation-automation',
        created_at: new Date().toISOString()
      }
    };

    try {
      // Try to find existing template
      const searchResults = await this.client.searchEmailTemplates({ name: templateName });

      if (searchResults.templates && searchResults.templates.length > 0) {
        // Update existing template
        const existingTemplate = searchResults.templates[0];
        this.log(`Updating existing template: ${templateName} (ID: ${existingTemplate.id})`);
        return await this.client.updateEmailTemplate(existingTemplate.id, templateData);
      } else {
        // Create new template
        this.log(`Creating new template: ${templateName}`);
        return await this.client.createEmailTemplate(templateData);
      }
    } catch (error) {
      throw new Error(`Failed to sync template ${templateName}: ${error.message}`);
    }
  }

  /**
   * Sync all templates for a segment
   * @param {Object} segment - Segment configuration object
   * @returns {Promise<Array>} Array of sync results
   */
  async syncSegmentTemplates(segment) {
    const emailTemplates = segment.outreach?.emailTemplates || [];
    const results = [];

    for (const templateId of emailTemplates) {
      try {
        // For now, sync the initialEmail template
        // In the future, we could support multiple templates per segment
        if (templateId === emailTemplates[0]) {
          const result = await this.syncTemplateFromSegment(segment, templateId);
          results.push({
            templateId,
            success: true,
            moengageTemplateId: result.id || result.template_id,
            moengageTemplateName: result.name || result.template_name
          });
        }
      } catch (error) {
        results.push({
          templateId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get MoEngage template ID for a segment's initial email template
   * @param {Object} segment - Segment configuration object
   * @returns {Promise<string|null>} MoEngage template ID or null if not found
   */
  async getTemplateIdForSegment(segment) {
    const templateName = `${segment.id}-${segment.outreach?.emailTemplates?.[0] || 'initial'}-initial`;

    try {
      const searchResults = await this.client.searchEmailTemplates({ name: templateName });
      if (searchResults.templates && searchResults.templates.length > 0) {
        return searchResults.templates[0].id || searchResults.templates[0].template_id;
      }
    } catch (error) {
      // Template not found, return null
    }

    return null;
  }

  log(message) {
    if (this.settings.logger) {
      this.settings.logger.info({ service: 'MoengageTemplateSync' }, message);
    } else {
      console.log(`[MoengageTemplateSync] ${message}`);
    }
  }
}

export function getMoengageTemplateSync(settings = {}) {
  return new MoengageTemplateSync(settings);
}

