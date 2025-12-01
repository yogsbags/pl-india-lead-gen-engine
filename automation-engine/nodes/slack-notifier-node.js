import WorkflowNode from './workflow-node.js';

export default class SlackNotifierNode extends WorkflowNode {
  async execute(input = []) {
    // Check if Slack notifications are disabled (gracefully handle missing outreach config)
    if (this.context.segment.outreach?.slackSummary === false) {
      this.log('Slack notifications disabled for segment');
      return input;
    }

    // Apply filter if configured (e.g., "signal_tier:Hot Signal")
    let filteredLeads = input;
    if (this.config.filter) {
      filteredLeads = this.applyFilter(input, this.config.filter);
      this.log(`Filtered ${input.length} leads → ${filteredLeads.length} match filter: ${this.config.filter}`);
    }

    const summary = {
      total: filteredLeads.length,
      hot: this.context.metrics.hot || 0,
      warm: this.context.metrics.warm || 0,
      cold: this.context.metrics.cold || 0
    };

    if (this.shouldSimulate() || !process.env.SLACK_BOT_TOKEN) {
      this.log('Slack summary (simulation)', summary);

      // Generate message preview
      if (filteredLeads.length > 0 && this.config.message_template) {
        const preview = this.renderTemplate(this.config.message_template, filteredLeads[0], filteredLeads.length);
        this.log('Message preview:', preview);
      }

      return input; // Pass through original input, not filtered
    }

    throw new Error('Live Slack integration not implemented yet.');
  }

  /**
   * Apply filter to leads (e.g., "signal_tier:Hot Signal")
   */
  applyFilter(leads, filter) {
    const [field, value] = filter.split(':');
    return leads.filter(lead => lead[field] === value);
  }

  /**
   * Render message template with lead data
   */
  renderTemplate(template, lead, count) {
    return template
      .replace(/\{count\}/g, count)
      .replace(/\{lead\.(\w+)\}/g, (match, key) => lead[key] || '');
  }
}
