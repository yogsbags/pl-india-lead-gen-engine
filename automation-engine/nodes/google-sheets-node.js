import WorkflowNode from './workflow-node.js';

export default class GoogleSheetsNode extends WorkflowNode {
  async execute(input = []) {
    if (!input.length) {
      this.warn('No leads to upsert into Google Sheets');
      return input;
    }

    if (this.shouldSimulate()) {
      await this.context.storeLeads(input);
      this.log('Stored leads locally (simulation mode)', { count: input.length });
      return input;
    }

    if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
      this.warn('GOOGLE_SERVICE_ACCOUNT not set. Writing to local store instead.');
      await this.context.storeLeads(input);
      return input;
    }

    throw new Error('Live Google Sheets integration not implemented yet.');
  }
}
