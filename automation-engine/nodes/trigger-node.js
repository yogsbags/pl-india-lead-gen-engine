import { nanoid } from 'nanoid';
import WorkflowNode from './workflow-node.js';

export default class TriggerNode extends WorkflowNode {
  async execute(input = []) {
    const runId = nanoid(12);
    const timestamp = new Date().toISOString();
    const payload = {
      runId,
      startedAt: timestamp,
      segmentId: this.context.segment.id,
      trigger: this.config.trigger || 'manual'
    };

    this.context.updateMeta(payload);
    this.log('Trigger executed', payload);
    return input;
  }
}
