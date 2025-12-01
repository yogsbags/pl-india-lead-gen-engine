import fs from 'fs-extra';
import path from 'path';
import settings from '../config/settings.js';

const buildKey = (lead) => {
  if (lead.email) return lead.email.toLowerCase();
  if (lead.linkedin_url) return lead.linkedin_url.toLowerCase();
  return lead.lead_id;
};

export default class WorkflowContext {
  constructor({ segment, logger, live = false }) {
    this.segment = segment;
    this.logger = logger;
    this.live = live;
    this.settings = settings;
    this.meta = {};
    this.metrics = {
      scraped: 0,
      cleaned: 0,
      deduped: 0,
      scored: 0,
      hot: 0,
      warm: 0,
      cold: 0
    };
    this.artifacts = {};
    this.leadStoreLoaded = false;
    this.leadStore = [];
    this.existingLeadKeySet = new Set();
  }

  async init() {
    await fs.ensureDir(this.settings.dataDir);
    await fs.ensureDir(this.settings.leadsDir);
    await this.loadLeadStore();
  }

  updateMeta(meta = {}) {
    this.meta = { ...this.meta, ...meta };
  }

  addArtifact(name, value) {
    if (!this.artifacts[name]) {
      this.artifacts[name] = [];
    }
    this.artifacts[name].push(value);
  }

  async loadLeadStore() {
    if (this.leadStoreLoaded) return this.leadStore;
    const filePath = this.getLeadFilePath();
    if (await fs.pathExists(filePath)) {
      const content = await fs.readJson(filePath);
      if (Array.isArray(content)) {
        this.leadStore = content;
        content.forEach((lead) => this.existingLeadKeySet.add(buildKey(lead)));
      }
    }
    this.leadStoreLoaded = true;
    return this.leadStore;
  }

  getLeadFilePath() {
    return path.join(this.settings.leadsDir, `${this.segment.id}.json`);
  }

  getExistingLeadKeys() {
    return Array.from(this.existingLeadKeySet);
  }

  async storeLeads(leads = []) {
    await this.loadLeadStore();
    const newLeads = [];

    for (const lead of leads) {
      const key = buildKey(lead);
      if (this.existingLeadKeySet.has(key)) {
        continue;
      }
      this.existingLeadKeySet.add(key);
      newLeads.push(lead);
    }

    if (!newLeads.length) return;

    this.leadStore.push(...newLeads);
    await fs.writeJson(this.getLeadFilePath(), this.leadStore, { spaces: 2 });
  }

  async appendExecutionReport(report) {
    const reportFile = this.settings.reportFile;
    let history = [];
    if (await fs.pathExists(reportFile)) {
      try {
        history = await fs.readJson(reportFile);
      } catch (error) {
        this.logger.error({ err: error }, 'Failed to parse execution report file');
      }
    }
    if (!Array.isArray(history)) {
      history = [];
    }
    history.push(report);
    await fs.writeJson(reportFile, history, { spaces: 2 });
  }

  async flushArtifacts() {
    const artifactKeys = Object.keys(this.artifacts);
    if (!artifactKeys.length) return;

    for (const key of artifactKeys) {
      const filePath = path.join(
        this.settings.leadsDir,
        `${this.segment.id}-${key}.json`
      );
      await fs.writeJson(filePath, this.artifacts[key], { spaces: 2 });
    }
  }
}
