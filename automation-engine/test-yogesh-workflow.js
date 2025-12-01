/**
 * Test script to process Yogesh Bagle through HeyGen and Postmark stages
 */

import fs from 'fs-extra';
import logger from './core/logger.js';
import WorkflowContext from './core/workflow-context.js';
import VideoPersonalizationNode from './nodes/video-personalization-node.js';
import PostmarkSendNode from './nodes/postmark-send-node.js';
import { getSegmentById } from './config/segments.js';

async function testYogeshWorkflow() {
  try {
    // Read HNI leads
    const hniLeads = await fs.readJson('./data/leads/hni.json');

    // Find Yogesh Bagle (updated email)
    const yogeshLead = hniLeads.find(l =>
      l.first_name === 'Yogesh' && l.last_name === 'Bagle'
    );

    if (!yogeshLead) {
      logger.error('Yogesh Bagle not found in HNI leads');
      return;
    }

    logger.info({ lead: yogeshLead }, 'Found Yogesh Bagle lead');
    logger.info(`Lead Score: ${yogeshLead.lead_score}, Tier: ${yogeshLead.lead_tier}`);

    // Create workflow context
    const segment = getSegmentById('hni');
    const context = new WorkflowContext({
      segment,
      logger,
      live: true // Run in live mode
    });

    // Force live mode for HeyGen
    context.environment = { isLive: true };

    // Set leads in context
    context.leads = [yogeshLead];
    context.metrics.hot = 1;

    logger.info('='.repeat(80));
    logger.info('STAGE 1: HeyGen Video Personalization');
    logger.info('='.repeat(80));

    // Run HeyGen video personalization with forceLive config
    const videoNode = new VideoPersonalizationNode({ forceLive: true }, context);
    const videoResult = await videoNode.execute([yogeshLead]);

    logger.info({ result: videoResult }, 'HeyGen stage completed');

    logger.info('='.repeat(80));
    logger.info('STAGE 2: Postmark Email Dispatch');
    logger.info('='.repeat(80));

    // Run Postmark email dispatch
    const postmarkNode = new PostmarkSendNode({}, context);
    const postmarkResult = await postmarkNode.execute(videoResult || [yogeshLead]);

    logger.info({ result: postmarkResult }, 'Postmark stage completed');

    logger.info('='.repeat(80));
    logger.info('✅ Workflow completed successfully for Yogesh Bagle');
    logger.info('='.repeat(80));

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Workflow failed');
    process.exit(1);
  }
}

// Run the test
testYogeshWorkflow();
