import fs from 'fs-extra';
import settings from '../config/settings.js';
import segments, { segmentList, getSegmentById } from '../config/segments.js';
import logger from './logger.js';
import WorkflowRunner from './workflow-runner.js';
import WorkflowContext from './workflow-context.js';
import workflows, { getWorkflow } from '../workflows/index.js';
import TriggerNode from '../nodes/trigger-node.js';
import ApifyScraperNode from '../nodes/apify-scraper-node.js';
import DataQualityNode from '../nodes/data-quality-node.js';
import DedupeNode from '../nodes/dedupe-node.js';
import LeadScoringNode from '../nodes/lead-scoring-node.js';
import GoogleSheetsNode from '../nodes/google-sheets-node.js';
import EmailSequenceNode from '../nodes/email-sequence-node.js';
import SlackNotifierNode from '../nodes/slack-notifier-node.js';
import SummaryReportNode from '../nodes/summary-report-node.js';
import VideoPersonalizationNode from '../nodes/video-personalization-node.js';
import NewsletterEnqueueNode from '../nodes/newsletter-enqueue-node.js';
import ExecutiveBriefingNode from '../nodes/executive-briefing-node.js';
import PostmarkSendNode from '../nodes/postmark-send-node.js';
import CsvExportNode from '../nodes/csv-export-node.js';
import IntentSignalNode from '../nodes/intent-signal-node.js';
import SignalScoringNode from '../nodes/signal-scoring-node.js';
import ApolloEnrichmentNode from '../nodes/apollo-enrichment-node.js';
import ApolloSearchNode from '../nodes/apollo-search-node.js';
import PhantomBusterNode from '../nodes/phantombuster-node.js';
import InstagramFollowerScraperNode from '../nodes/instagram-follower-scraper-node.js';
import TwitterFollowerScraperNode from '../nodes/twitter-follower-scraper-node.js';

export default class WorkflowOrchestrator {
  constructor() {
    this.logger = logger;
    this.settings = settings;
    this.nodeRegistry = {
      TriggerNode,
      ApifyScraperNode,
      ApolloSearchNode,
      DataQualityNode,
      DedupeNode,
      LeadScoringNode,
      GoogleSheetsNode,
      EmailSequenceNode,
      SlackNotifierNode,
      SummaryReportNode,
      VideoPersonalizationNode,
      NewsletterEnqueueNode,
      ExecutiveBriefingNode,
      PostmarkSendNode,
      CsvExportNode,
      IntentSignalNode,
      SignalScoringNode,
      ApolloEnrichmentNode,
      PhantomBusterNode,
      InstagramFollowerScraperNode,
      TwitterFollowerScraperNode
    };
    this.runner = new WorkflowRunner({
      nodeRegistry: this.nodeRegistry,
      logger: this.logger
    });
  }

  async init() {
    await fs.ensureDir(this.settings.dataDir);
    await fs.ensureDir(this.settings.leadsDir);
    if (!(await fs.pathExists(this.settings.reportFile))) {
      await fs.writeJson(this.settings.reportFile, []);
    }
    this.logger.info(
      { segments: segmentList.length, simulate: this.settings.simulateByDefault },
      'Lead automation orchestrator initialized'
    );
  }

  async runSegment({ segmentId, live = false }) {
    const segment = getSegmentById(segmentId);
    if (!segment) {
      throw new Error(`Unknown segment: ${segmentId}`);
    }

    const workflow = getWorkflow(segmentId);
    const context = new WorkflowContext({ segment, logger: this.logger, live });
    const result = await this.runner.run(workflow, context);
    return { result, context };
  }

  async runAll({ live = false } = {}) {
    const outcomes = [];
    for (const segment of segmentList) {
      // eslint-disable-next-line no-await-in-loop
      const outcome = await this.runSegment({
        segmentId: segment.id,
        live
      });
      outcomes.push(outcome);
    }
    return outcomes;
  }

  async status() {
    if (!(await fs.pathExists(this.settings.reportFile))) {
      this.logger.info('No execution history found. Run init or execute a workflow first.');
      return;
    }
    const history = await fs.readJson(this.settings.reportFile);
    if (!history?.length) {
      this.logger.info('Execution history is empty.');
      return;
    }
    const last = history[history.length - 1];
    this.logger.info({ lastRun: last }, 'Latest execution summary');
  }

  listSegments() {
    return segmentList.map((segment) => ({
      id: segment.id,
      name: segment.name,
      targetLeads: segment.target.leads,
      targetConversion: segment.target.conversion,
      description: segment.description
    }));
  }
}
