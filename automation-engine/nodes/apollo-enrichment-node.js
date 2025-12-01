/**
 * Apollo Enrichment Node
 *
 * Enriches leads with additional data from Apollo.io:
 * - Email addresses (work + personal)
 * - Phone numbers (mobile + direct dial)
 * - LinkedIn URLs
 * - Job titles and seniority
 * - Company information (size, industry, revenue)
 * - Location details
 *
 * Supports both single enrichment and batch enrichment (10 leads per API call)
 */

import WorkflowNode from './workflow-node.js';
import { ApolloAPI } from '../services/apollo-api.mjs';

export default class ApolloEnrichmentNode extends WorkflowNode {
  async execute(input = []) {
    this.log('🔍 Executing Apollo enrichment node');

    // For now, only simulation mode is supported
    // TODO: Implement live mode Apollo API integration
    return this.simulateEnrichment(input);
  }

  /**
   * Enrich leads in batches of 10 (Apollo bulk limit)
   */
  async enrichLeadsInBatches(leads) {
    const enrichedLeads = [];
    const batchSize = 10;
    const useFullEnrichment = this.config.fullEnrichment !== false; // Default: true

    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      this.logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(leads.length / batchSize)}`);

      try {
        if (useFullEnrichment) {
          // Full enrichment (person + organization)
          const enriched = await this.enrichBatchFull(batch);
          enrichedLeads.push(...enriched);
        } else {
          // Person enrichment only
          const enriched = await this.enrichBatchPerson(batch);
          enrichedLeads.push(...enriched);
        }
      } catch (error) {
        this.logger.error(`Batch enrichment failed: ${error.message}`);
        // Add leads with error status
        enrichedLeads.push(...batch.map(lead => ({
          ...lead,
          enrichment_status: 'failed',
          enrichment_error: error.message
        })));
      }

      // Rate limiting delay between batches
      if (i + batchSize < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 600)); // 600ms between batches
      }
    }

    return enrichedLeads;
  }

  /**
   * Full enrichment (person + organization)
   */
  async enrichBatchFull(batch) {
    const enrichedLeads = [];

    for (const lead of batch) {
      try {
        const result = await this.apollo.fullLeadEnrichment({
          email: lead.email,
          linkedin_url: lead.linkedin_url,
          first_name: lead.first_name,
          last_name: lead.last_name,
          company: lead.company
        });

        if (result.error) {
          enrichedLeads.push({
            ...lead,
            enrichment_status: 'failed',
            enrichment_error: result.error
          });
        } else {
          enrichedLeads.push(this.mergeLead(lead, result));
        }
      } catch (error) {
        this.logger.warn(`Failed to enrich lead ${lead.email || lead.name}: ${error.message}`);
        enrichedLeads.push({
          ...lead,
          enrichment_status: 'failed',
          enrichment_error: error.message
        });
      }
    }

    return enrichedLeads;
  }

  /**
   * Person enrichment only (faster, cheaper)
   */
  async enrichBatchPerson(batch) {
    try {
      // Prepare batch for Apollo bulk API
      const apolloBatch = batch.map(lead => ({
        email: lead.email,
        linkedin_url: lead.linkedin_url,
        first_name: lead.first_name,
        last_name: lead.last_name,
        organization_name: lead.company
      }));

      const results = await this.apollo.bulkEnrichPeople(
        apolloBatch,
        true, // reveal_personal_emails
        true  // reveal_phone_number
      );

      // Merge results with original leads
      return batch.map((lead, index) => {
        const apolloData = results[index];
        if (apolloData && apolloData.person) {
          return this.mergeLead(lead, { person: apolloData.person });
        } else {
          return {
            ...lead,
            enrichment_status: 'failed',
            enrichment_error: 'No data returned from Apollo'
          };
        }
      });
    } catch (error) {
      this.logger.error(`Bulk enrichment failed: ${error.message}`);
      return batch.map(lead => ({
        ...lead,
        enrichment_status: 'failed',
        enrichment_error: error.message
      }));
    }
  }

  /**
   * Merge Apollo data with original lead
   */
  mergeLead(lead, apolloData) {
    const person = apolloData.person || {};
    const organization = apolloData.organization || {};

    return {
      ...lead,
      // Basic info (prefer Apollo data if available)
      first_name: person.first_name || lead.first_name,
      last_name: person.last_name || lead.last_name,
      name: person.name || lead.name,
      email: person.email || lead.email,
      phone: person.phone_numbers?.[0]?.sanitized_number || lead.phone,

      // Professional info
      job_title: person.title || lead.job_title,
      seniority: person.seniority || null,
      departments: person.departments || [],

      // Company info
      company: organization.name || person.organization?.name || lead.company,
      company_domain: organization.primary_domain || person.organization?.primary_domain,
      company_size: organization.estimated_num_employees || person.organization?.estimated_num_employees,
      company_industry: organization.industry || person.organization?.industry,
      company_revenue: organization.estimated_annual_revenue || person.organization?.estimated_annual_revenue,

      // Location
      city: person.city || lead.city,
      state: person.state || lead.state,
      country: person.country || lead.country,
      location: `${person.city || ''}, ${person.state || ''}, ${person.country || ''}`.replace(/^, |, $/g, ''),

      // Social & web
      linkedin_url: person.linkedin_url || lead.linkedin_url,
      twitter_url: person.twitter_url || null,
      facebook_url: person.facebook_url || null,

      // Apollo metadata
      apollo_person_id: person.id,
      apollo_organization_id: organization.id || person.organization?.id,
      apollo_confidence_score: person.email_status === 'verified' ? 100 : 75,

      // Enrichment status
      enrichment_status: 'success',
      enrichment_source: 'apollo',
      enrichment_date: new Date().toISOString(),

      // Additional fields for scoring
      years_experience: this.estimateExperience(person),
      digital_presence: this.calculateDigitalPresence(person, organization),

      // Raw Apollo data (for debugging)
      _apollo_raw: {
        person: person.id ? person : null,
        organization: organization.id ? organization : null
      }
    };
  }

  /**
   * Estimate years of experience from headline/title
   */
  estimateExperience(person) {
    const title = (person.title || '').toLowerCase();

    if (title.includes('senior') || title.includes('principal') || title.includes('lead')) {
      return 10;
    } else if (title.includes('manager') || title.includes('head of')) {
      return 7;
    } else if (title.includes('director') || title.includes('vp')) {
      return 15;
    } else if (title.includes('c-level') || title.includes('ceo') || title.includes('cto') || title.includes('cfo')) {
      return 20;
    } else if (title.includes('junior') || title.includes('associate')) {
      return 3;
    }

    return 5; // Default
  }

  /**
   * Calculate digital presence score (0-100)
   */
  calculateDigitalPresence(person, organization) {
    let score = 0;

    // LinkedIn presence
    if (person.linkedin_url) score += 30;

    // Email verified
    if (person.email_status === 'verified') score += 20;

    // Phone number available
    if (person.phone_numbers?.length > 0) score += 15;

    // Social media presence
    if (person.twitter_url) score += 10;
    if (person.facebook_url) score += 10;

    // Company website
    if (organization.website_url || person.organization?.website_url) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Calculate enrichment statistics
   */
  calculateStats(originalLeads, enrichedLeads) {
    const stats = {
      total: originalLeads.length,
      enriched: 0,
      failed: 0,
      skipped: 0,
      fields_added: {
        email: 0,
        phone: 0,
        linkedin: 0,
        job_title: 0,
        company_info: 0
      }
    };

    enrichedLeads.forEach((lead, index) => {
      const original = originalLeads[index];

      if (lead.enrichment_status === 'success') {
        stats.enriched++;

        // Count fields added
        if (lead.email && !original.email) stats.fields_added.email++;
        if (lead.phone && !original.phone) stats.fields_added.phone++;
        if (lead.linkedin_url && !original.linkedin_url) stats.fields_added.linkedin++;
        if (lead.job_title && !original.job_title) stats.fields_added.job_title++;
        if (lead.company_size && !original.company_size) stats.fields_added.company_info++;
      } else if (lead.enrichment_status === 'failed') {
        stats.failed++;
      } else {
        stats.skipped++;
      }
    });

    stats.success_rate = ((stats.enriched / stats.total) * 100).toFixed(1) + '%';

    return stats;
  }

  /**
   * Simulate enrichment in non-live mode
   */
  async simulateEnrichment(input) {
    this.log('🎭 Simulating Apollo enrichment (demo mode)');

    if (!input || input.length === 0) {
      this.warn('No leads to enrich');
      return [];
    }

    // Add simulated Apollo fields
    const enrichedLeads = input.map(lead => ({
      ...lead,
      // Add missing email if not present
      email: lead.email || `${lead.first_name?.toLowerCase()}.${lead.last_name?.toLowerCase()}@${this.generateDomain(lead.company)}`,

      // Add phone if missing
      phone: lead.phone || this.generateIndianPhone(),

      // Add LinkedIn if missing
      linkedin_url: lead.linkedin_url || `https://linkedin.com/in/${lead.first_name?.toLowerCase()}-${lead.last_name?.toLowerCase()}-${Math.random().toString(36).substring(7)}`,

      // Add company info
      company_size: lead.company_size || this.randomElement(['51-200', '201-500', '501-1000', '1001-5000']),
      company_industry: lead.company_industry || lead.industry || 'Financial Services',

      // Add location if missing
      city: lead.city || this.randomElement(['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai']),
      state: lead.state || 'Maharashtra',
      country: 'India',

      // Apollo metadata
      apollo_confidence_score: Math.floor(Math.random() * 25) + 75, // 75-100
      enrichment_status: 'success',
      enrichment_source: 'apollo_simulation',
      enrichment_date: new Date().toISOString(),

      // Additional fields
      years_experience: Math.floor(Math.random() * 20) + 5,
      digital_presence: Math.floor(Math.random() * 40) + 60 // 60-100
    }));

    this.log(`✅ Simulated enrichment complete: ${enrichedLeads.length} leads enriched`);

    return enrichedLeads;
  }

  /**
   * Helper: Generate domain from company name
   */
  generateDomain(companyName) {
    if (!companyName) return 'example.com';
    return companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  }

  /**
   * Helper: Generate Indian phone number
   */
  generateIndianPhone() {
    const prefixes = ['98', '99', '97', '96', '95', '94', '93', '92', '91', '90'];
    const prefix = this.randomElement(prefixes);
    const number = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `+91-${prefix}${number.substring(0, 4)}-${number.substring(4)}`;
  }

  /**
   * Helper: Random element from array
   */
  randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}
