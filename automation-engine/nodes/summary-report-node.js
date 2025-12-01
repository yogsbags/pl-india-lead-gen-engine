import WorkflowNode from './workflow-node.js';

export default class SummaryReportNode extends WorkflowNode {
  async execute(input = []) {
    const report = {
      runId: this.context.meta.runId,
      segmentId: this.context.segment.id,
      segmentName: this.context.segment.name,
      startedAt: this.context.meta.startedAt,
      completedAt: new Date().toISOString(),
      metrics: { ...this.context.metrics },
      totalLeads: input.length
    };

    await this.context.appendExecutionReport(report);
    this.log('Execution summary recorded', report);
    return input;
  }
}
