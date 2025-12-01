import WorkflowNode from './workflow-node.js';

export default class DataQualityNode extends WorkflowNode {
  async execute(input = []) {
    const sanitized = input.map((lead) => this.sanitizeLead(lead));
    this.context.metrics.cleaned = sanitized.length;
    this.log('Data quality checks completed', { count: sanitized.length });
    return sanitized;
  }

  sanitizeLead(lead) {
    const sanitized = { ...lead };
    sanitized.name = sanitized.name?.trim();
    sanitized.job_title = sanitized.job_title?.trim();
    sanitized.company = sanitized.company?.trim();
    sanitized.email = sanitized.email?.toLowerCase();
    sanitized.location = sanitized.location || 'Unknown';
    sanitized.segment = this.context.segment.name;
    if (!sanitized.linkedin_url) {
      sanitized.linkedin_url = 'https://www.linkedin.com';
    }
    if (!sanitized.scraped_at) {
      sanitized.scraped_at = new Date().toISOString();
    }
    sanitized.notes = sanitized.notes || '';
    return sanitized;
  }
}
