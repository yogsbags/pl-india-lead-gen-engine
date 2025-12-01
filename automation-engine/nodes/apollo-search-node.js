/**
 * Apollo Search Node
 *
 * Searches for leads using Apollo.io People Search API
 * Replaces Apify scraping with native Apollo search
 */

import ApolloAPI from '../services/apollo-api.mjs';
import WorkflowNode from './workflow-node.js';

export default class ApolloSearchNode extends WorkflowNode {
  async execute(input = []) {
    this.log('Starting Apollo people search...');

    // Check if live mode
    if (this.shouldSimulate()) {
      this.warn('Simulation mode - generating synthetic leads');
      return this.simulateSearch();
    }

    // Get Apollo API key
    const apiKey = process.env.APOLLO_API_KEY;
    if (!apiKey) {
      this.error('APOLLO_API_KEY not found in environment');
      this.warn('Falling back to simulation mode');
      return this.simulateSearch();
    }

    try {
      const apollo = new ApolloAPI(apiKey);
      const segment = this.context.segment;

      // Get segment-specific search configuration
      const searchConfig = this.getSearchConfig(segment);
      const maxResults = this.config.sampleSize || segment.scraping?.maxResults || 50;

      this.log(`Searching for ${maxResults} ${segment.name} leads...`);
      this.log('Search criteria:', {
        titles: searchConfig.person_titles?.slice(0, 3).join(', '),
        locations: searchConfig.person_locations?.join(', '),
        seniorities: searchConfig.person_seniorities?.join(', ')
      });

      // Fetch leads from Apollo
      const leads = [];
      const perPage = 50; // Apollo max per page
      const totalPages = Math.ceil(maxResults / perPage);

      for (let page = 1; page <= totalPages; page++) {
        try {
          const response = await apollo.searchPeople({
            ...searchConfig,
            per_page: Math.min(perPage, maxResults - leads.length),
            page
          });

          if (response.people && response.people.length > 0) {
            const formatted = response.people.map(person => this.formatLead(person));
            leads.push(...formatted);

            this.log(`Fetched page ${page}/${totalPages}: ${formatted.length} leads`);
          }

          // Stop if we've reached the desired count
          if (leads.length >= maxResults) {
            break;
          }

          // Rate limiting delay between pages
          if (page < totalPages) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          this.error(`Error fetching page ${page}: ${error.message}`);
          break;
        }
      }

      // Trim to exact sample size
      const finalLeads = leads.slice(0, maxResults);

      this.log(`✅ Successfully fetched ${finalLeads.length} leads from Apollo`);

      // Enrich leads to reveal emails and phone numbers
      this.log('Enriching leads to reveal contact details...');
      const enrichedLeads = await this.enrichLeads(apollo, finalLeads);

      this.context.leads = enrichedLeads;
      this.context.metrics.fetched = enrichedLeads.length;

      return enrichedLeads;

    } catch (error) {
      this.error(`Apollo search failed: ${error.message}`);
      this.warn('Falling back to simulation mode');
      return this.simulateSearch();
    }
  }

  /**
   * Get segment-specific search configuration
   */
  getSearchConfig(segment) {
    const segmentId = segment.id;

    // HNI segment configuration
    if (segmentId === 'hni') {
      return {
        person_titles: [
          'CEO',
          'Founder',
          'Managing Director',
          'Chief Executive Officer',
          'Co-Founder',
          'CFO',
          'Chief Financial Officer',
          'VP Finance',
          'Director Finance'
        ],
        person_seniorities: ['c_suite', 'owner', 'founder', 'vp'],
        person_locations: [
          'Mumbai, India',
          'Delhi, India',
          'Bangalore, India',
          'Pune, India',
          'Gurgaon, India'
        ],
        organization_num_employees_ranges: [
          '51,200',
          '201,500',
          '501,1000',
          '1001,5000'
        ],
        revenue_range: {
          min: 10000000, // $10M+
          max: null
        }
      };
    }

    // UHNI segment configuration
    if (segmentId === 'uhni') {
      return {
        person_titles: [
          'Chairman',
          'Founder & CEO',
          'Managing Director & CEO',
          'Group CEO',
          'Promoter',
          'Chairperson'
        ],
        person_seniorities: ['owner', 'founder', 'c_suite'],
        person_locations: [
          'Mumbai, India',
          'Delhi, India',
          'Bangalore, India'
        ],
        organization_num_employees_ranges: [
          '1001,5000',
          '5001,10000',
          '10001+'
        ],
        revenue_range: {
          min: 100000000, // $100M+
          max: null
        }
      };
    }

    // Partners (IFAs) segment configuration
    if (segmentId === 'partners') {
      return {
        person_titles: [
          'Financial Advisor',
          'Wealth Manager',
          'Investment Advisor',
          'Financial Consultant',
          'Portfolio Manager',
          'Certified Financial Planner',
          'Wealth Planner'
        ],
        person_locations: [
          'Mumbai, India',
          'Delhi, India',
          'Bangalore, India',
          'Pune, India',
          'Ahmedabad, India',
          'Hyderabad, India',
          'Chennai, India'
        ],
        q_organization_keyword_tags: ['Financial Services', 'Finance', 'Investment', 'Wealth Management']
      };
    }

    // Mass Affluent segment configuration
    if (segmentId === 'mass_affluent') {
      return {
        person_titles: [
          'Senior Manager',
          'Director',
          'VP',
          'General Manager',
          'Senior Director',
          'Head of'
        ],
        person_seniorities: ['director', 'vp', 'manager'],
        person_locations: [
          'Mumbai, India',
          'Delhi, India',
          'Bangalore, India',
          'Pune, India',
          'Hyderabad, India'
        ],
        organization_num_employees_ranges: [
          '201,500',
          '501,1000',
          '1001,5000'
        ]
      };
    }

    // Default fallback
    return {
      person_locations: ['Mumbai, India', 'Delhi, India', 'Bangalore, India'],
      per_page: 50
    };
  }

  /**
   * Enrich leads to reveal emails and phone numbers
   */
  async enrichLeads(apollo, leads) {
    const enrichedLeads = [];

    for (const lead of leads) {
      try {
        // Use Apollo enrichment to reveal contact details
        // Note: reveal_phone_number requires a webhook_url, so we only request emails
        const enrichmentData = await apollo.enrichPerson({
          id: lead.apollo_id,
          reveal_personal_emails: true
        });

        if (enrichmentData?.person) {
          // Update lead with enriched data
          const enrichedLead = {
            ...lead,
            email: enrichmentData.person.email || lead.email,
            phone: enrichmentData.person.phone_numbers?.[0]?.sanitized_number ||
                   enrichmentData.person.phone_numbers?.[0]?.raw_number ||
                   lead.phone,
            // Update other fields that might have been enriched
            first_name: enrichmentData.person.first_name || lead.first_name,
            last_name: enrichmentData.person.last_name || lead.last_name,
            title: enrichmentData.person.title || lead.title,
            data_quality_score: enrichmentData.person.email ? 95 : lead.data_quality_score
          };

          enrichedLeads.push(enrichedLead);
          this.log(`Enriched: ${enrichedLead.name} - Email: ${enrichedLead.email ? '✓' : '✗'}`);
        } else {
          enrichedLeads.push(lead);
          this.warn(`Enrichment failed for ${lead.name}, using original data`);
        }

        // Rate limiting between enrichment calls
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        this.warn(`Enrichment error for ${lead.name}: ${error.message}`);
        enrichedLeads.push(lead);
      }
    }

    // Filter out leads without valid emails
    const leadsWithEmails = enrichedLeads.filter(l =>
      l.email &&
      !l.email.includes('email_not_unlocked') &&
      !l.email.includes('@domain.com')
    );

    const withEmails = leadsWithEmails.length;
    this.log(`Enrichment complete: ${withEmails}/${enrichedLeads.length} leads have verified emails`);

    if (withEmails === 0) {
      this.warn('No leads with verified emails found. Returning all leads.');
      return enrichedLeads;
    }

    this.log(`Filtering to ${withEmails} leads with verified emails`);
    return leadsWithEmails;
  }

  /**
   * Format Apollo person data to standard lead format
   */
  formatLead(person) {
    return {
      // Basic info
      first_name: person.first_name || '',
      last_name: person.last_name || '',
      name: person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim(),
      email: person.email || '',

      // Contact info
      phone: person.phone_numbers?.[0]?.raw_number || person.phone_numbers?.[0]?.sanitized_number || '',
      linkedin_url: person.linkedin_url || '',

      // Professional info
      title: person.title || '',
      seniority: person.seniority || '',
      company: person.organization?.name || '',
      company_domain: person.organization?.primary_domain || '',
      company_industry: person.organization?.industry || '',
      company_size: person.organization?.estimated_num_employees || '',
      company_revenue: person.organization?.estimated_annual_revenue || '',

      // Location
      city: person.city || '',
      state: person.state || '',
      country: person.country || 'India',

      // Apollo metadata
      apollo_id: person.id || '',
      apollo_contact_stage: person.contact_stage_id || '',

      // Enrichment metadata
      data_quality_score: person.email ? 85 : 50, // Estimated based on email availability
      enriched_at: new Date().toISOString(),
      source: 'apollo_search',

      // Raw data for debugging
      _raw_apollo_data: person
    };
  }

  /**
   * Simulation mode - generate synthetic leads
   */
  async simulateSearch() {
    const segment = this.context.segment;
    const sampleSize = this.config.sampleSize || 10;

    this.log(`Generating ${sampleSize} simulated leads for ${segment.name}...`);

    const simulatedLeads = [];
    const simulation = segment.simulation || {};

    for (let i = 0; i < sampleSize; i++) {
      const firstName = this.randomChoice(simulation.firstNames || ['Raj', 'Priya', 'Amit', 'Sneha']);
      const lastName = this.randomChoice(simulation.lastNames || ['Sharma', 'Patel', 'Singh', 'Kumar']);
      const title = this.randomChoice(simulation.titles || ['CEO', 'CFO', 'Director']);
      const company = this.randomChoice(simulation.companies || ['Acme Corp', 'Global Industries']);
      const city = this.randomChoice(simulation.cities || ['Mumbai', 'Delhi', 'Bangalore']);

      simulatedLeads.push({
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: '+91' + Math.floor(7000000000 + Math.random() * 3000000000),
        linkedin_url: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Math.random().toString(36).substr(2, 6)}`,
        title,
        company,
        company_domain: `${company.toLowerCase().replace(/\s+/g, '')}.com`,
        city,
        state: city === 'Mumbai' ? 'Maharashtra' : (city === 'Delhi' ? 'Delhi' : 'Karnataka'),
        country: 'India',
        data_quality_score: 75,
        source: 'apollo_simulation',
        enriched_at: new Date().toISOString()
      });
    }

    this.context.leads = simulatedLeads;
    this.context.metrics.fetched = simulatedLeads.length;
    this.log(`✅ Generated ${simulatedLeads.length} simulated leads`);

    return simulatedLeads;
  }

  /**
   * Helper: random choice from array
   */
  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
