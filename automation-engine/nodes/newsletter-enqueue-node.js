import WorkflowNode from './workflow-node.js';

export default class NewsletterEnqueueNode extends WorkflowNode {
  async execute(input = []) {
    // Get campaign from config or segment (with fallback)
    const campaign = this.config.newsletter_list ||
                     this.context.segment.outreach?.newsletterCampaign ||
                     'default_newsletter';

    if (!campaign || campaign === 'disabled') {
      this.log('Newsletter enrollment disabled for segment');
      return input;
    }

    // Apply filter if configured (e.g., "signal_tier:Cold Signal")
    let filteredLeads = input;
    if (this.config.filter) {
      filteredLeads = this.applyFilter(input, this.config.filter);
      this.log(`Filtered ${input.length} leads → ${filteredLeads.length} match filter: ${this.config.filter}`);
    }

    if (filteredLeads.length === 0) {
      this.log('No leads matched filter for newsletter enrollment');
      return input;
    }

    if (this.shouldSimulate()) {
      const enqueued = filteredLeads.map((lead) => ({
        ...lead,
        newsletter_status: 'queued',
        newsletter_campaign: campaign
      }));

      // Merge back into original input
      const result = input.map(lead => {
        const enqueuedLead = enqueued.find(e => e.email === lead.email || e.linkedin_url === lead.linkedin_url);
        return enqueuedLead || lead;
      });

      this.context.metrics.newsletter = enqueued.length;
      this.log('Queued leads for newsletter (simulation)', {
        campaign,
        count: enqueued.length
      });
      return result;
    }

    if (!process.env.NEWSLETTER_API_KEY) {
      this.warn('Newsletter provider not configured. Skipping.');
      return input;
    }

    throw new Error('Live newsletter integration not implemented yet.');
  }

  /**
   * Apply filter to leads (e.g., "signal_tier:Cold Signal")
   */
  applyFilter(leads, filter) {
    const [field, value] = filter.split(':');
    return leads.filter(lead => lead[field] === value);
  }
}
