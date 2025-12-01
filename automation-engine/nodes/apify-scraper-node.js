import fetch from 'node-fetch';
import { nanoid } from 'nanoid';
import WorkflowNode from './workflow-node.js';

const pick = (arr = []) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateEmail = (firstName, company) => {
  const normalizedFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const normalizedCompany = company
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, 12);
  return `${normalizedFirst}@${normalizedCompany || 'lead'}.com`;
};

export default class ApifyScraperNode extends WorkflowNode {
  async execute(input = []) {
    if (!this.shouldSimulate() && process.env.APIFY_TOKEN) {
      try {
        const liveLeads = await this.fetchFromApify();
        if (liveLeads.length) {
          this.log(`Fetched ${liveLeads.length} leads from Apify`);
          this.context.metrics.scraped = liveLeads.length;
          return liveLeads;
        }
        this.warn('Apify returned no leads, falling back to simulation');
      } catch (error) {
        this.error('Apify scraping failed, falling back to simulation', {
          message: error.message
        });
      }
    }

    const simulated = this.generateSimulatedLeads();
    this.log(`Simulated ${simulated.length} leads via Apify actor`);
    this.context.metrics.scraped = simulated.length;
    return simulated;
  }

  async fetchFromApify() {
    const actorId =
      this.config.actorId || this.context.segment.scraping.actorId || 'apify~apollo-scraper';
    const queries = this.context.segment.scraping.queries || [];
    if (!queries.length) {
      throw new Error('No queries configured for Apify scraping');
    }

    const items = [];
    const queryLimit = this.config.queryLimit || 1;
    const sampleSize =
      this.config.sampleSize || this.context.settings.defaultBatchSize || 25;

    for (const query of queries.slice(0, queryLimit)) {
      // eslint-disable-next-line no-await-in-loop
      const datasetItems = await this.runApifyActor(actorId, query);
      datasetItems.forEach((item) => items.push(this.normalizeApifyItem(item, query)));
      if (items.length >= sampleSize) break;
    }

    return items.slice(0, sampleSize);
  }

  async runApifyActor(actorId, query) {
    const token = process.env.APIFY_TOKEN;
    const encodedActorId = encodeURIComponent(actorId);
    const endpoint = `https://api.apify.com/v2/acts/${encodedActorId}/run-sync-get-dataset-items?token=${token}`;

    const input = this.buildApifyInput(query);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Apify actor failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Unexpected Apify response format');
    }
    return data;
  }

  buildApifyInput(query) {
    const template = this.context.segment.scraping.apifyInput || {
      query: '{{query}}',
      positionLimit: this.context.segment.scraping.limit || 50,
      includeEmails: true,
      enrichPdl: true
    };

    // If the template doesn't use placeholders, return as-is
    const hasPlaceholders = JSON.stringify(template).includes('{{query}}');
    if (!hasPlaceholders) {
      return template;
    }

    const replacePlaceholders = (value) => {
      if (typeof value === 'string') {
        return value.replace('{{query}}', query);
      }
      if (Array.isArray(value)) {
        return value.map((item) => replacePlaceholders(item));
      }
      if (value && typeof value === 'object') {
        return Object.entries(value).reduce((acc, [key, val]) => {
          acc[key] = replacePlaceholders(val);
          return acc;
        }, {});
      }
      return value;
    };

    return replacePlaceholders(template);
  }

  normalizeApifyItem(item = {}, query) {
    const firstName = item.firstName || item.first_name || '';
    const lastName = item.lastName || item.last_name || '';
    const companyName =
      item.organizationName || item.companyName || item.company || 'Unknown Company';

    return {
      lead_id: item.id || item.profileId || `${this.context.segment.id}-${nanoid(10)}`,
      name: item.name || `${firstName} ${lastName}`.trim() || 'Unknown',
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      job_title: item.title || item.position || item.jobTitle || 'Unknown',
      company: companyName,
      email: item.email || item.emails?.[0] || '',
      phone: item.phone || item.phones?.[0] || '',
      linkedin_url:
        item.linkedinUrl ||
        item.linkedinProfile ||
        item.linkedin ||
        `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(query)}`,
      website: item.organizationWebsite || item.website || '',
      location: item.location || item.city || item.region || 'Unknown',
      industry: item.organizationIndustry || item.industry || '',
      data_source: 'apify-apollo',
      scraped_at: new Date().toISOString(),
      raw_enrichment: item
    };
  }

  generateSimulatedLeads() {
    const segment = this.context.segment;
    const sampleSize =
      this.config.sampleSize || this.context.settings.defaultBatchSize || 25;
    const leads = [];

    for (let i = 0; i < sampleSize; i += 1) {
      const firstName = pick(segment.simulation.sampleFirstNames);
      const lastName = pick([
        'Sharma',
        'Mehta',
        'Iyer',
        'Reddy',
        'Gupta',
        'Patel',
        'Kapoor'
      ]);
      const company = pick(segment.simulation.sampleCompanies);
      const jobTitle = pick(segment.simulation.jobTitles);
      const location = pick(segment.simulation.sampleLocations);
      const linkedinUrl = `https://www.linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${randomInt(
        1000,
        9999
      )}`;

      const baseLead = {
        lead_id: `${segment.id}-${Date.now()}-${i}`,
        name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        job_title: jobTitle,
        company,
        email: generateEmail(firstName, company),
        phone: `+91${randomInt(7000000000, 9999999999)}`,
        linkedin_url: linkedinUrl,
        website: `https://${company.toLowerCase().replace(/\s+/g, '')}.com`,
        location,
        data_source: 'apify-simulated',
        scraped_at: new Date().toISOString(),
        raw_enrichment: {}
      };

      if (segment.id === 'partners') {
        baseLead.aum = `${randomInt(10, 250)} Cr`;
        baseLead.client_base = randomInt(50, 350);
        baseLead.sebi_registration = randomInt(0, 1) ? 'Yes' : 'In Progress';
        baseLead.digital_presence = randomInt(30, 95);
        baseLead.years_experience = randomInt(
          segment.simulation.minExperienceYears || 3,
          segment.simulation.maxExperienceYears || 18
        );
      }

      if (segment.id === 'hni') {
        baseLead.net_worth_signal = randomInt(5, 25) * 1_00_00_000;
        baseLead.education = pick(segment.simulation.education);
        baseLead.role_seniority = pick(['Senior', 'CXO', 'Founder']);
        baseLead.investment_activity = randomInt(60, 100);
        baseLead.interests = pick(segment.simulation.interests);
      }

      if (segment.id === 'uhni') {
        baseLead.ownership_stake = `${randomInt(20, 70)}%`;
        baseLead.family_office = pick(segment.simulation.familyOffices);
        baseLead.liquidity_events = randomInt(1, 5);
        baseLead.philanthropy = randomInt(40, 100);
        baseLead.international_presence = randomInt(50, 100);
      }

      if (segment.id === 'mass_affluent') {
        baseLead.income_band = randomInt(25, 90) * 1_00_000;
        baseLead.digital_behavior = randomInt(55, 95);
        baseLead.investment_history = randomInt(30, 90);
        baseLead.intent_signal = randomInt(20, 90);
        baseLead.interests = pick(segment.simulation.interests);
      }

      leads.push(baseLead);
    }

    const testEmail = process.env.POSTMARK_TEST_EMAIL;
    if (testEmail && leads.length) {
      leads[0].email = testEmail;
      leads[0].data_source = 'apify-test';
      leads[0].digital_presence = 95;
      leads[0].years_experience = leads[0].years_experience || 12;
      leads[0].client_base = Math.max(leads[0].client_base || 150, 180);
    }

    return leads;
  }
}
