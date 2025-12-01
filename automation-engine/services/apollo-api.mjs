/**
 * Apollo.io API Service (ES Module)
 *
 * Complete integration with Apollo.io using native fetch
 */

export class ApolloAPI {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Apollo API key is required');
    }

    this.apiKey = apiKey;
    this.baseURL = 'https://api.apollo.io/v1';

    // Rate limiting (Apollo: 10,000 requests/hour = ~167/min = ~2.8/sec)
    this.requestsPerSecond = 2;
    this.lastRequestTime = 0;
  }

  /**
   * Rate limiting throttle
   */
  async throttle() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / this.requestsPerSecond;

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    await this.throttle();

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': this.apiKey,
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Apollo API Error (${response.status}): ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      if (error.message.includes('401')) {
        throw new Error('Apollo API: Invalid API key');
      } else if (error.message.includes('429')) {
        throw new Error('Apollo API: Rate limit exceeded - please retry later');
      } else if (error.message.includes('500')) {
        throw new Error('Apollo API: Server error - please retry');
      } else {
        throw error;
      }
    }
  }

  // ============================================
  // ENRICHMENT APIs
  // ============================================

  async enrichPerson(params) {
    return this.request('/people/match', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async bulkEnrichPeople(people, reveal_personal_emails = false, reveal_phone_number = false) {
    if (people.length > 10) {
      throw new Error('Bulk enrichment limited to 10 people per request');
    }

    return this.request('/people/bulk_match', {
      method: 'POST',
      body: JSON.stringify({
        details: people,
        reveal_personal_emails,
        reveal_phone_number
      })
    });
  }

  async enrichOrganization(domain) {
    return this.request(`/organizations/enrich?domain=${encodeURIComponent(domain)}`);
  }

  // ============================================
  // SEARCH APIs
  // ============================================

  async searchPeople(params) {
    return this.request('/mixed_people/search', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async searchOrganizations(params) {
    return this.request('/mixed_companies/search', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async getOrganizationJobPostings(organizationId) {
    return this.request(`/organizations/${organizationId}/job_postings`);
  }

  // ============================================
  // CRM APIs
  // ============================================

  async createContact(params) {
    return this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async searchContacts(params = {}) {
    return this.request('/contacts/search', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async createAccount(params) {
    return this.request('/accounts', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // ============================================
  // EMAIL & SEQUENCE APIs
  // ============================================

  /**
   * Get list of email accounts (mailboxes)
   * Requires master API key
   */
  async getEmailAccounts() {
    return this.request('/emailer_accounts');
  }

  /**
   * Get list of sequences
   */
  async getSequences() {
    return this.request('/email_sequences');
  }

  /**
   * Get sequence details by ID
   */
  async getSequence(sequenceId) {
    return this.request(`/email_sequences/${sequenceId}`);
  }

  /**
   * Add contacts to a sequence
   * @param {Object} params - Sequence parameters
   * @param {string} params.sequence_id - Sequence ID to add contacts to
   * @param {Array<string>} params.contact_ids - Array of Apollo contact IDs
   * @param {string} params.emailer_account_id - Email account ID to send from
   * @param {string} params.sequence_active_in_other_campaigns - "remove" or "do_nothing"
   * @param {boolean} params.send_email_from_email_account_id - Use specific email account
   */
  async addContactsToSequence(params) {
    return this.request('/email_sequences/add_contact_ids', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Remove contacts from a sequence
   */
  async removeContactsFromSequence(sequenceId, contactIds) {
    return this.request(`/email_sequences/${sequenceId}/remove_contacts`, {
      method: 'POST',
      body: JSON.stringify({ contact_ids: contactIds })
    });
  }

  // ============================================
  // MISCELLANEOUS
  // ============================================

  async getUsageStats() {
    return this.request('/auth/health');
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  async fullLeadEnrichment(lead) {
    try {
      const personData = await this.enrichPerson({
        email: lead.email,
        linkedin_url: lead.linkedin_url,
        first_name: lead.first_name,
        last_name: lead.last_name,
        organization_name: lead.company,
        reveal_personal_emails: true,
        reveal_phone_number: true
      });

      let orgData = null;
      if (personData.person?.organization?.primary_domain) {
        try {
          orgData = await this.enrichOrganization(
            personData.person.organization.primary_domain
          );
        } catch (error) {
          console.warn('Organization enrichment failed:', error.message);
        }
      }

      return {
        person: personData.person,
        organization: orgData?.organization || personData.person?.organization,
        enriched_at: new Date().toISOString(),
        source: 'apollo'
      };
    } catch (error) {
      console.error('Full enrichment failed:', error.message);
      return {
        error: error.message,
        original_lead: lead
      };
    }
  }

  async batchLeadEnrichment(leads, reveal_personal_emails = true, reveal_phone_number = true) {
    const results = [];
    const batchSize = 10;

    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);

      try {
        const enriched = await this.bulkEnrichPeople(
          batch,
          reveal_personal_emails,
          reveal_phone_number
        );
        results.push(...enriched.matches);
      } catch (error) {
        console.error(`Batch ${i / batchSize + 1} failed:`, error.message);
        results.push(...batch.map(lead => ({ ...lead, error: error.message })));
      }

      if (i + batchSize < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  async searchIFAs(params = {}) {
    return this.searchPeople({
      person_titles: [
        'Financial Advisor',
        'Wealth Manager',
        'Investment Advisor',
        'Financial Consultant',
        'Portfolio Manager',
        'Certified Financial Planner'
      ],
      person_locations: params.locations || [
        'Mumbai, India',
        'Delhi, India',
        'Bangalore, India',
        'Pune, India',
        'Ahmedabad, India'
      ],
      q_organization_keyword_tags: ['Financial Services', 'Finance', 'Investment'],
      per_page: params.per_page || 50,
      page: params.page || 1
    });
  }

  async searchHNIs(params = {}) {
    return this.searchPeople({
      person_titles: [
        'CEO',
        'Founder',
        'Managing Director',
        'Chairman',
        'Co-Founder',
        'Chief Executive Officer',
        'Owner',
        'President'
      ],
      person_seniorities: ['c_suite', 'owner', 'founder'],
      person_locations: params.locations || [
        'Mumbai, India',
        'Delhi, India',
        'Bangalore, India'
      ],
      organization_num_employees_ranges: [
        '51,200',
        '201,500',
        '501,1000',
        '1001,5000'
      ],
      per_page: params.per_page || 50,
      page: params.page || 1
    });
  }

  // ============================================
  // REVERSE LOOKUP APIs
  // ============================================

  /**
   * Reverse lookup - find person by any available identifier
   * Requires at least one of: email, linkedin_url, or (name + company)
   *
   * @param {Object} identifiers - Lookup identifiers
   * @param {string} [identifiers.email] - Email address
   * @param {string} [identifiers.linkedin_url] - LinkedIn profile URL
   * @param {string} [identifiers.first_name] - First name
   * @param {string} [identifiers.last_name] - Last name
   * @param {string} [identifiers.organization_name] - Company name
   * @param {string} [identifiers.domain] - Company domain
   * @returns {Promise<Object>} Enriched person data
   */
  async reverseLookup(identifiers) {
    const hasEmail = !!identifiers.email;
    const hasLinkedIn = !!identifiers.linkedin_url;
    const hasNameAndCompany = identifiers.first_name &&
                              identifiers.last_name &&
                              (identifiers.organization_name || identifiers.domain);

    if (!hasEmail && !hasLinkedIn && !hasNameAndCompany) {
      throw new Error('Reverse lookup requires: email, linkedin_url, or (first_name + last_name + company)');
    }

    return this.enrichPerson({
      ...identifiers,
      reveal_personal_emails: true,
      reveal_phone_number: true
    });
  }

  /**
   * Bulk reverse lookup - find multiple people by identifiers
   *
   * @param {Array<Object>} identifiersList - Array of identifier objects
   * @returns {Promise<Array>} Array of enriched person data
   */
  async bulkReverseLookup(identifiersList) {
    if (!Array.isArray(identifiersList) || identifiersList.length === 0) {
      throw new Error('identifiersList must be a non-empty array');
    }

    // Process in batches of 10 (Apollo limit)
    const results = [];
    const batchSize = 10;

    for (let i = 0; i < identifiersList.length; i += batchSize) {
      const batch = identifiersList.slice(i, i + batchSize);

      try {
        const enriched = await this.bulkEnrichPeople(batch, true, true);
        results.push(...(enriched.matches || []));
      } catch (error) {
        console.error(`Bulk reverse lookup batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
        results.push(...batch.map(item => ({
          input: item,
          error: error.message,
          status: 'failed'
        })));
      }

      // Rate limiting between batches
      if (i + batchSize < identifiersList.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Find all people at a company by domain
   *
   * @param {string} domain - Company domain (e.g., 'company.com')
   * @param {Object} [options] - Search options
   * @param {Array<string>} [options.seniorities] - Filter by seniority levels
   * @param {Array<string>} [options.titles] - Filter by job titles
   * @param {number} [options.limit] - Max results per page (default: 50)
   * @param {number} [options.page] - Page number (default: 1)
   * @returns {Promise<Object>} Search results with people array
   */
  async findPeopleAtCompany(domain, options = {}) {
    const params = {
      q_organization_domains: [domain],
      per_page: options.limit || 50,
      page: options.page || 1
    };

    if (options.seniorities?.length) {
      params.person_seniorities = options.seniorities;
    }

    if (options.titles?.length) {
      params.person_titles = options.titles;
    }

    return this.searchPeople(params);
  }

  /**
   * Find decision makers at a company
   *
   * @param {string} domain - Company domain
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Search results with decision makers
   */
  async findDecisionMakers(domain, options = {}) {
    return this.findPeopleAtCompany(domain, {
      seniorities: ['c_suite', 'vp', 'director', 'owner', 'founder'],
      titles: options.titles || [],
      limit: options.limit || 50,
      page: options.page || 1
    });
  }

  /**
   * Lookup by LinkedIn URL only (convenience method)
   *
   * @param {string} linkedinUrl - LinkedIn profile URL
   * @returns {Promise<Object>} Enriched person data
   */
  async lookupByLinkedIn(linkedinUrl) {
    return this.reverseLookup({ linkedin_url: linkedinUrl });
  }

  /**
   * Lookup by email only (convenience method)
   *
   * @param {string} email - Email address
   * @returns {Promise<Object>} Enriched person data
   */
  async lookupByEmail(email) {
    return this.reverseLookup({ email });
  }

  /**
   * Lookup by name and company (convenience method)
   *
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @param {string} company - Company name or domain
   * @returns {Promise<Object>} Enriched person data
   */
  async lookupByNameAndCompany(firstName, lastName, company) {
    const isCompanyDomain = company.includes('.');
    return this.reverseLookup({
      first_name: firstName,
      last_name: lastName,
      [isCompanyDomain ? 'domain' : 'organization_name']: company
    });
  }

  /**
   * Get company info by domain (convenience method)
   *
   * @param {string} domain - Company domain
   * @returns {Promise<Object>} Company data
   */
  async lookupCompany(domain) {
    return this.enrichOrganization(domain);
  }
}

export default ApolloAPI;
