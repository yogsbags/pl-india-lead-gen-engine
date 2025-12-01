import partnersWorkflow from './partners.workflow.js';
import hniWorkflow from './hni.workflow.js';
import uhniWorkflow from './uhni.workflow.js';
import massAffluentWorkflow from './mass-affluent.workflow.js';
import signalsHniWorkflow from './signals-hni.workflow.js';
import signalsUhniWorkflow from './signals-uhni.workflow.js';
import signalsMassAffluentWorkflow from './signals-mass-affluent.workflow.js';
import signalsPartnersWorkflow from './signals-partners.workflow.js';

const workflows = {
  partners: partnersWorkflow,
  hni: hniWorkflow,
  uhni: uhniWorkflow,
  mass_affluent: massAffluentWorkflow,
  'signals-hni': signalsHniWorkflow,
  'signals-uhni': signalsUhniWorkflow,
  'signals-mass-affluent': signalsMassAffluentWorkflow,
  'signals-partners': signalsPartnersWorkflow
};

export const getWorkflow = (segmentId) => {
  const workflow = workflows[segmentId];
  if (!workflow) {
    throw new Error(`No workflow definition for segment: ${segmentId}`);
  }
  return workflow;
};

export const listWorkflows = () => Object.values(workflows);

export default workflows;
