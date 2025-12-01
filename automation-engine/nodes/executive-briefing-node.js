import WorkflowNode from './workflow-node.js';

export default class ExecutiveBriefingNode extends WorkflowNode {
  async execute(input = []) {
    // Skip if executive briefing not required (gracefully handle missing outreach config)
    if (!this.context.segment.outreach?.requiresExecutiveAssistant) {
      this.log('Executive briefing not required for segment');
      return input;
    }

    // Apply filter if configured (e.g., "signal_tier:Hot Signal")
    let filteredLeads = input;
    if (this.config.filter) {
      filteredLeads = this.applyFilter(input, this.config.filter);
      this.log(`Filtered ${input.length} leads → ${filteredLeads.length} match filter: ${this.config.filter}`);
    }

    if (filteredLeads.length === 0) {
      this.log('No leads matched filter for executive briefing');
      return input;
    }

    const briefings = filteredLeads.map((lead) => ({
      lead_id: lead.lead_id,
      to: lead.email,
      contact_role: lead.lead_tier === 'Hot' || lead.signal_tier === 'Hot Signal' ? 'Principal' : 'Executive Assistant',
      subject: `Meeting Request for ${lead.name}`,
      summary: [
        `Introduce PL Capital's quant PMS (MADP & AQUA) with 80-year legacy.`,
        'Highlight bespoke mandate option and dedicated fund manager access.',
        'Request 30-45 minute meeting, include compliance disclaimer.'
      ]
    }));

    this.context.metrics.briefings = briefings.length;
    this.log('Prepared executive briefing packets', { count: briefings.length });
    if (this.context.addArtifact) {
      this.context.addArtifact('executiveBriefings', briefings);
    }
    return input;
  }

  /**
   * Apply filter to leads (e.g., "signal_tier:Hot Signal")
   */
  applyFilter(leads, filter) {
    const [field, value] = filter.split(':');
    return leads.filter(lead => lead[field] === value);
  }
}
