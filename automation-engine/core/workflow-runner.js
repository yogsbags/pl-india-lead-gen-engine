export default class WorkflowRunner {
  constructor({ nodeRegistry, logger }) {
    this.nodeRegistry = nodeRegistry;
    this.logger = logger;
  }

  async run(workflow, context) {
    this.logger.info(
      { workflow: workflow.id, segment: context.segment.id },
      'Starting workflow execution'
    );

    await context.init();

    let items = [];
    for (const nodeDef of workflow.nodes) {
      const NodeClass = this.nodeRegistry[nodeDef.handler];
      if (!NodeClass) {
        throw new Error(`Unknown node handler: ${nodeDef.handler}`);
      }

      const node = new NodeClass(nodeDef, context);
      this.logger.info(
        { node: node.name, segment: context.segment.id },
        'Executing node'
      );

      try {
        // eslint-disable-next-line no-await-in-loop
        items = await node.execute(items);
      } catch (error) {
        this.logger.error(
          { node: node.name, err: error },
          'Node execution failed'
        );
        throw error;
      }
    }

    await context.flushArtifacts();

    this.logger.info(
      {
        workflow: workflow.id,
        segment: context.segment.id,
        total: items.length,
        metrics: context.metrics
      },
      'Workflow execution completed'
    );

    return items;
  }
}
