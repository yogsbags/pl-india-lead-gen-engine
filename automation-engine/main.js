#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import WorkflowOrchestrator from './core/workflow-orchestrator.js';
import { isLiveModeEnabled } from './config/environment.js';

const program = new Command();
program.name('lead-automation').description('PL Capital lead automation engine');

const orchestrator = new WorkflowOrchestrator();

const handleError = (error) => {
  console.error(chalk.red('✖ Workflow failed')); // eslint-disable-line no-console
  console.error(error); // eslint-disable-line no-console
  process.exitCode = 1;
};

program
  .command('init')
  .description('Initialise data directories and print segment summary')
  .action(async () => {
    try {
      await orchestrator.init();
      const segments = orchestrator.listSegments();
      console.log(chalk.green('Lead automation engine initialised.')); // eslint-disable-line no-console
      segments.forEach((segment) => {
        console.log(
          ` • ${segment.id} (${segment.name}) → Target Leads: ${segment.targetLeads}, Conversion Target: ${segment.targetConversion}`
        );
      });
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('run')
  .description('Execute workflows for a segment or all segments')
  .option('--segment <segmentId>', 'Segment ID (partners, hni, uhni, mass_affluent)')
  .option('--all', 'Run all segments')
  .option('--live', 'Enforce live mode (requires credentials)')
  .action(async (options) => {
    try {
      await orchestrator.init();
      const live = isLiveModeEnabled(Boolean(options.live));
      const runAll = options.all || !options.segment;
      if (runAll) {
        await orchestrator.runAll({ live });
        console.log(chalk.green('All workflows completed.')); // eslint-disable-line no-console
        return;
      }
      const segmentId = options.segment;
      await orchestrator.runSegment({ segmentId, live });
      console.log(chalk.green(`Workflow completed for segment: ${segmentId}`)); // eslint-disable-line no-console
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('status')
  .description('Print latest workflow execution summary')
  .action(async () => {
    try {
      await orchestrator.status();
    } catch (error) {
      handleError(error);
    }
  });

program.parseAsync(process.argv);
