import { randomUUID } from 'crypto';

export default class WorkflowNode {
  constructor(definition = {}, context) {
    this.id = definition.id || randomUUID();
    this.name = definition.name || this.constructor.name;
    this.type = definition.type || 'action';
    this.config = definition.config || {};
    this.context = context;
  }

  async execute(input = []) {
    throw new Error(`Node ${this.name} must implement execute()`);
  }

  log(message, extra = {}) {
    this.context.logger.info({ node: this.name, ...extra }, message);
  }

  warn(message, extra = {}) {
    this.context.logger.warn({ node: this.name, ...extra }, message);
  }

  error(message, extra = {}) {
    this.context.logger.error({ node: this.name, ...extra }, message);
  }

  isLiveMode() {
    return this.context.live === true;
  }

  shouldSimulate() {
    if (this.config.forceLive) {
      return false;
    }
    if (this.config.forceSimulate) {
      return true;
    }
    return !this.isLiveMode();
  }
}
