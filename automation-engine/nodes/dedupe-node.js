import WorkflowNode from './workflow-node.js';

const buildKey = (lead) => {
  if (lead.email) {
    return lead.email.toLowerCase();
  }
  if (lead.linkedin_url) {
    return lead.linkedin_url.toLowerCase();
  }
  return lead.lead_id;
};

export default class DedupeNode extends WorkflowNode {
  async execute(input = []) {
    if (process.env.LEAD_AUTOMATION_ALLOW_DUPLICATES === 'true') {
      this.log('Deduplication skipped for test mode');
      this.context.metrics.deduped = input.length;
      return input;
    }

    const seen = new Set(this.context.getExistingLeadKeys());
    const output = [];
    let duplicates = 0;

    for (const lead of input) {
      const key = buildKey(lead);
      if (seen.has(key)) {
        duplicates += 1;
        continue;
      }
      seen.add(key);
      output.push(lead);
    }

    this.context.metrics.duplicates = duplicates;
    this.context.metrics.deduped = output.length;
    this.log('Dedupe complete', { removed: duplicates, remaining: output.length });
    return output;
  }
}
