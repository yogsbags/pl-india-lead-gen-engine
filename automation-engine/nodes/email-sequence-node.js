import WorkflowNode from './workflow-node.js';

const defaultDelays = [0, 3, 7, 12, 19];

export default class EmailSequenceNode extends WorkflowNode {
  async execute(input = []) {
    if (!input.length) {
      this.warn('No leads to schedule email sequence for');
      return input;
    }

    // Apply filter if configured (e.g., "signal_tier:Warm Signal")
    let filteredLeads = input;
    if (this.config.filter) {
      filteredLeads = this.applyFilter(input, this.config.filter);
      this.log(`Filtered ${input.length} leads → ${filteredLeads.length} match filter: ${this.config.filter}`);
    }

    if (filteredLeads.length === 0) {
      this.log('No leads matched filter, skipping email sequence');
      return input;
    }

    // Get templates from config or segment (with fallback)
    const sequenceName = this.config.sequence_name || 'Default';
    const templates = this.context.segment.outreach?.emailTemplates || ['TEMPLATE-01'];

    const scheduled = filteredLeads.map((lead) => {
      const sequence = templates.map((templateId, index) => ({
        templateId,
        scheduledInDays: defaultDelays[index] ?? defaultDelays.at(-1),
        status: 'queued'
      }));

      return {
        ...lead,
        sequence_status: 'queued',
        sequence_name: sequenceName,
        last_touch: null,
        email_sequence: sequence
      };
    });

    // Merge scheduled leads back into original input (preserve leads that didn't match filter)
    const result = input.map(lead => {
      const scheduledLead = scheduled.find(s => s.email === lead.email || s.linkedin_url === lead.linkedin_url);
      return scheduledLead || lead;
    });

    this.context.metrics.emailSequences = scheduled.length;
    this.log('Prepared email sequence', {
      sequence: sequenceName,
      templates: templates.length,
      leads: scheduled.length
    });

    return result;
  }

  /**
   * Apply filter to leads (e.g., "signal_tier:Warm Signal")
   */
  applyFilter(leads, filter) {
    const [field, value] = filter.split(':');
    return leads.filter(lead => lead[field] === value);
  }
}
