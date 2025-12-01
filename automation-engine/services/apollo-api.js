/**
 * Apollo.io API Service
 *
 * Complete integration with Apollo.io for:
 * - People enrichment (single & bulk)
 * - Organization enrichment
 * - People & organization search
 * - Contacts, accounts, deals, sequences management
 * - Tasks and calls tracking
 *
 * API Documentation: https://docs.apollo.io/
 *
 * Usage:
 *   const apollo = new ApolloAPI(process.env.APOLLO_API_KEY);
 *   const enriched = await apollo.enrichPerson({ email: 'john@example.com' });
 */

const axios = require('axios');

class ApolloAPI {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Apollo API key is required');
    }

    this.apiKey = apiKey;
    this.baseURL = 'https://api.apollo.io/v1';

    // Rate limiting (Apollo: 10,000 requests/hour = ~167/min = ~2.8/sec)
    this.requestQueue = [];
    this.requestsPerSecond = 2; // Safe limit (below 2.8/sec max)
    this.lastRequestTime = 0;

    // Initialize axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    // Request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      await this.throttle();
      config.headers['X-Api-Key'] = this.apiKey;
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
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
   * Error handler
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          throw new Error('Apollo API: Invalid API key');
        case 403:
          throw new Error('Apollo API: Access forbidden - check permissions');
        case 429:
          throw new Error('Apollo API: Rate limit exceeded - please retry later');
        case 500:
          throw new Error('Apollo API: Server error - please retry');
        default:
          throw new Error(`Apollo API Error (${status}): ${JSON.stringify(data)}`);
      }
    } else if (error.request) {
      throw new Error('Apollo API: No response received - check network connection');
    } else {
      throw new Error(`Apollo API: ${error.message}`);
    }
  }

  // ============================================
  // 1️⃣ ENRICHMENT APIs
  // ============================================

  /**
   * People Enrichment - Enrich a person with email or LinkedIn URL
   *
   * @param {Object} params
   * @param {string} params.email - Email address (optional if linkedin_url provided)
   * @param {string} params.linkedin_url - LinkedIn profile URL (optional if email provided)
   * @param {string} params.first_name - First name (helps improve match)
   * @param {string} params.last_name - Last name (helps improve match)
   * @param {string} params.organization_name - Company name (helps improve match)
   * @param {boolean} params.reveal_personal_emails - Reveal personal emails (default: false)
   * @param {boolean} params.reveal_phone_number - Reveal phone numbers (default: false)
   *
   * @returns {Promise<Object>} Enriched person data
   *
   * @example
   * const enriched = await apollo.enrichPerson({
   *   email: 'rajesh@jaininvestment.com',
   *   reveal_personal_emails: true,
   *   reveal_phone_number: true
   * });
   */
  async enrichPerson(params) {
    const response = await this.client.post('/people/match', params);
    return response.data;
  }

  /**
   * Bulk People Enrichment - Enrich multiple people at once (up to 10)
   *
   * @param {Array<Object>} people - Array of person objects (max 10)
   * @param {boolean} reveal_personal_emails - Reveal personal emails
   * @param {boolean} reveal_phone_number - Reveal phone numbers
   *
   * @returns {Promise<Object>} Array of enriched people
   *
   * @example
   * const enriched = await apollo.bulkEnrichPeople([
   *   { email: 'person1@company.com' },
   *   { linkedin_url: 'linkedin.com/in/person2' }
   * ], true, true);
   */
  async bulkEnrichPeople(people, reveal_personal_emails = false, reveal_phone_number = false) {
    if (people.length > 10) {
      throw new Error('Bulk enrichment limited to 10 people per request');
    }

    const response = await this.client.post('/people/bulk_match', {
      details: people,
      reveal_personal_emails,
      reveal_phone_number
    });

    return response.data;
  }

  /**
   * Organization Enrichment - Enrich a company/organization
   *
   * @param {string} domain - Company domain (e.g., 'jaininvestment.com')
   *
   * @returns {Promise<Object>} Enriched organization data
   *
   * @example
   * const org = await apollo.enrichOrganization('jaininvestment.com');
   */
  async enrichOrganization(domain) {
    const response = await this.client.get('/organizations/enrich', {
      params: { domain }
    });
    return response.data;
  }

  // ============================================
  // 2️⃣ SEARCH APIs
  // ============================================

  /**
   * People Search - Search for people with filters
   *
   * @param {Object} params
   * @param {string} params.q_keywords - Keywords (job titles, names, etc.)
   * @param {Array<string>} params.person_titles - Job titles (e.g., ['CEO', 'Founder'])
   * @param {Array<string>} params.person_locations - Locations (e.g., ['Mumbai, India'])
   * @param {Array<string>} params.organization_locations - Company locations
   * @param {Array<string>} params.person_seniorities - Seniority levels (e.g., ['c_suite', 'owner'])
   * @param {Array<string>} params.organization_ids - Specific organization IDs
   * @param {Array<string>} params.organization_num_employees_ranges - Company sizes
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.per_page - Results per page (default: 25, max: 100)
   *
   * @returns {Promise<Object>} Search results with people
   *
   * @example
   * const results = await apollo.searchPeople({
   *   person_titles: ['CEO', 'Founder', 'Managing Director'],
   *   person_locations: ['Mumbai, India'],
   *   organization_num_employees_ranges: ['51,200', '201,500'],
   *   per_page: 50
   * });
   */
  async searchPeople(params) {
    const response = await this.client.post('/mixed_people/search', params);
    return response.data;
  }

  /**
   * Organization Search - Search for companies with filters
   *
   * @param {Object} params
   * @param {string} params.q_organization_keyword_tags - Industry/category keywords
   * @param {Array<string>} params.organization_locations - Locations
   * @param {Array<string>} params.organization_num_employees_ranges - Employee count ranges
   * @param {Array<string>} params.revenue_range - Revenue ranges
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.per_page - Results per page (default: 25, max: 100)
   *
   * @returns {Promise<Object>} Search results with organizations
   *
   * @example
   * const results = await apollo.searchOrganizations({
   *   q_organization_keyword_tags: ['Financial Services', 'Wealth Management'],
   *   organization_locations: ['Mumbai, India', 'Bangalore, India'],
   *   organization_num_employees_ranges: ['11,50', '51,200'],
   *   per_page: 50
   * });
   */
  async searchOrganizations(params) {
    const response = await this.client.post('/mixed_companies/search', params);
    return response.data;
  }

  /**
   * Organization Job Postings - Get job postings for an organization
   *
   * @param {string} organizationId - Apollo organization ID
   *
   * @returns {Promise<Object>} Job postings data
   *
   * @example
   * const jobs = await apollo.getOrganizationJobPostings('5f5e2b4c8d3c4a0017b4c3d2');
   */
  async getOrganizationJobPostings(organizationId) {
    const response = await this.client.get(`/organizations/${organizationId}/job_postings`);
    return response.data;
  }

  // ============================================
  // 3️⃣ ACCOUNTS APIs
  // ============================================

  /**
   * Create an Account - Add a new account to Apollo CRM
   *
   * @param {Object} params
   * @param {string} params.name - Account name (required)
   * @param {string} params.domain - Company domain
   * @param {string} params.phone_number - Phone number
   * @param {Object} params.owner_id - Owner user ID
   *
   * @returns {Promise<Object>} Created account data
   *
   * @example
   * const account = await apollo.createAccount({
   *   name: 'Jain Investment',
   *   domain: 'jaininvestment.com',
   *   phone_number: '+91-22-1234-5678'
   * });
   */
  async createAccount(params) {
    const response = await this.client.post('/accounts', params);
    return response.data;
  }

  /**
   * Update an Account - Update existing account
   *
   * @param {string} accountId - Account ID
   * @param {Object} updates - Fields to update
   *
   * @returns {Promise<Object>} Updated account data
   *
   * @example
   * const updated = await apollo.updateAccount('abc123', {
   *   phone_number: '+91-22-9876-5432'
   * });
   */
  async updateAccount(accountId, updates) {
    const response = await this.client.patch(`/accounts/${accountId}`, updates);
    return response.data;
  }

  /**
   * Search for Accounts - Find accounts in Apollo CRM
   *
   * @param {Object} params - Search filters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Results per page
   *
   * @returns {Promise<Object>} Account search results
   *
   * @example
   * const accounts = await apollo.searchAccounts({ per_page: 50 });
   */
  async searchAccounts(params = {}) {
    const response = await this.client.post('/accounts/search', params);
    return response.data;
  }

  // ============================================
  // 4️⃣ CONTACTS APIs
  // ============================================

  /**
   * Create a Contact - Add a new contact to Apollo CRM
   *
   * @param {Object} params
   * @param {string} params.first_name - First name (required)
   * @param {string} params.last_name - Last name (required)
   * @param {string} params.email - Email address
   * @param {string} params.title - Job title
   * @param {string} params.organization_name - Company name
   *
   * @returns {Promise<Object>} Created contact data
   *
   * @example
   * const contact = await apollo.createContact({
   *   first_name: 'Rajesh',
   *   last_name: 'Kanojia',
   *   email: 'rajesh@jaininvestment.com',
   *   title: 'Financial Advisor',
   *   organization_name: 'Jain Investment'
   * });
   */
  async createContact(params) {
    const response = await this.client.post('/contacts', params);
    return response.data;
  }

  /**
   * Update a Contact - Update existing contact
   *
   * @param {string} contactId - Contact ID
   * @param {Object} updates - Fields to update
   *
   * @returns {Promise<Object>} Updated contact data
   *
   * @example
   * const updated = await apollo.updateContact('abc123', {
   *   title: 'Senior Financial Advisor'
   * });
   */
  async updateContact(contactId, updates) {
    const response = await this.client.put(`/contacts/${contactId}`, updates);
    return response.data;
  }

  /**
   * Search for Contacts - Find contacts in Apollo CRM
   *
   * @param {Object} params - Search filters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Results per page
   *
   * @returns {Promise<Object>} Contact search results
   *
   * @example
   * const contacts = await apollo.searchContacts({
   *   q_keywords: 'Financial Advisor',
   *   per_page: 50
   * });
   */
  async searchContacts(params = {}) {
    const response = await this.client.post('/contacts/search', params);
    return response.data;
  }

  // ============================================
  // 5️⃣ DEALS APIs
  // ============================================

  /**
   * Create Deal - Create a new deal
   *
   * @param {Object} params
   * @param {string} params.name - Deal name (required)
   * @param {number} params.amount - Deal value
   * @param {string} params.owner_id - Owner user ID
   * @param {string} params.account_id - Associated account ID
   *
   * @returns {Promise<Object>} Created deal data
   *
   * @example
   * const deal = await apollo.createDeal({
   *   name: 'PMS Partnership - Jain Investment',
   *   amount: 500000,
   *   account_id: 'abc123'
   * });
   */
  async createDeal(params) {
    const response = await this.client.post('/opportunities', params);
    return response.data;
  }

  /**
   * List All Deals - Get all deals
   *
   * @param {Object} params - Filter parameters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Results per page
   *
   * @returns {Promise<Object>} List of deals
   *
   * @example
   * const deals = await apollo.listDeals({ per_page: 50 });
   */
  async listDeals(params = {}) {
    const response = await this.client.get('/opportunities', { params });
    return response.data;
  }

  /**
   * View Deal - Get specific deal details
   *
   * @param {string} dealId - Deal ID
   *
   * @returns {Promise<Object>} Deal details
   *
   * @example
   * const deal = await apollo.getDeal('deal123');
   */
  async getDeal(dealId) {
    const response = await this.client.get(`/opportunities/${dealId}`);
    return response.data;
  }

  // ============================================
  // 6️⃣ SEQUENCES APIs
  // ============================================

  /**
   * Search for Sequences - Find email sequences
   *
   * @param {Object} params - Search filters
   *
   * @returns {Promise<Object>} Sequences list
   *
   * @example
   * const sequences = await apollo.searchSequences();
   */
  async searchSequences(params = {}) {
    const response = await this.client.post('/emailer_campaigns/search', params);
    return response.data;
  }

  /**
   * Add Contacts to a Sequence - Enroll contacts in sequence
   *
   * @param {string} sequenceId - Sequence ID
   * @param {Array<string>} contactIds - Array of contact IDs
   * @param {string} mailboxId - Mailbox to send from (optional)
   *
   * @returns {Promise<Object>} Enrollment results
   *
   * @example
   * const result = await apollo.addContactsToSequence('seq123', ['contact1', 'contact2']);
   */
  async addContactsToSequence(sequenceId, contactIds, mailboxId = null) {
    const response = await this.client.post('/emailer_campaigns/add_contact_ids', {
      emailer_campaign_id: sequenceId,
      contact_ids: contactIds,
      mailbox_id: mailboxId
    });
    return response.data;
  }

  /**
   * Update Contact Status in a Sequence - Change contact status
   *
   * @param {string} contactId - Contact ID
   * @param {string} sequenceId - Sequence ID
   * @param {string} status - New status ('active', 'paused', 'finished')
   *
   * @returns {Promise<Object>} Update result
   *
   * @example
   * const result = await apollo.updateContactSequenceStatus('contact123', 'seq123', 'paused');
   */
  async updateContactSequenceStatus(contactId, sequenceId, status) {
    const response = await this.client.post('/emailer_touches/contact_status', {
      contact_id: contactId,
      emailer_campaign_id: sequenceId,
      status
    });
    return response.data;
  }

  // ============================================
  // 7️⃣ TASKS APIs
  // ============================================

  /**
   * Create a Task - Add a new task
   *
   * @param {Object} params
   * @param {string} params.note - Task description (required)
   * @param {string} params.contact_id - Associated contact ID
   * @param {string} params.due_at - Due date (ISO 8601)
   * @param {string} params.type - Task type
   *
   * @returns {Promise<Object>} Created task data
   *
   * @example
   * const task = await apollo.createTask({
   *   note: 'Follow up on PMS partnership proposal',
   *   contact_id: 'contact123',
   *   due_at: '2025-10-25T10:00:00Z'
   * });
   */
  async createTask(params) {
    const response = await this.client.post('/tasks', params);
    return response.data;
  }

  /**
   * Search for Tasks - Find tasks
   *
   * @param {Object} params - Search filters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Results per page
   *
   * @returns {Promise<Object>} Tasks list
   *
   * @example
   * const tasks = await apollo.searchTasks({ per_page: 50 });
   */
  async searchTasks(params = {}) {
    const response = await this.client.post('/tasks/search', params);
    return response.data;
  }

  // ============================================
  // 8️⃣ CALLS APIs
  // ============================================

  /**
   * Create Call Records - Log a call
   *
   * @param {Object} params
   * @param {string} params.contact_id - Contact ID (required)
   * @param {string} params.note - Call notes
   * @param {string} params.disposition - Call outcome
   * @param {number} params.duration - Duration in seconds
   * @param {string} params.recorded_at - Call timestamp (ISO 8601)
   *
   * @returns {Promise<Object>} Created call record
   *
   * @example
   * const call = await apollo.createCallRecord({
   *   contact_id: 'contact123',
   *   note: 'Discussed PMS features and commission structure',
   *   disposition: 'Interested',
   *   duration: 1200,
   *   recorded_at: '2025-10-17T14:30:00Z'
   * });
   */
  async createCallRecord(params) {
    const response = await this.client.post('/calls', params);
    return response.data;
  }

  /**
   * Search for Calls - Find call records
   *
   * @param {Object} params - Search filters
   *
   * @returns {Promise<Object>} Call records list
   *
   * @example
   * const calls = await apollo.searchCalls({ contact_id: 'contact123' });
   */
  async searchCalls(params = {}) {
    const response = await this.client.get('/calls', { params });
    return response.data;
  }

  /**
   * Update Call Records - Update existing call record
   *
   * @param {string} callId - Call ID
   * @param {Object} updates - Fields to update
   *
   * @returns {Promise<Object>} Updated call record
   *
   * @example
   * const updated = await apollo.updateCallRecord('call123', {
   *   note: 'Updated: Ready to move forward with partnership'
   * });
   */
  async updateCallRecord(callId, updates) {
    const response = await this.client.put(`/calls/${callId}`, updates);
    return response.data;
  }

  // ============================================
  // 9️⃣ MISCELLANEOUS APIs
  // ============================================

  /**
   * View API Usage Stats and Rate Limits - Get current usage
   *
   * @returns {Promise<Object>} Usage statistics
   *
   * @example
   * const stats = await apollo.getUsageStats();
   * console.log(`Credits remaining: ${stats.credits_remaining}`);
   */
  async getUsageStats() {
    const response = await this.client.get('/auth/health');
    return response.data;
  }

  /**
   * Get a List of Users - Get all users in account
   *
   * @returns {Promise<Object>} Users list
   *
   * @example
   * const users = await apollo.getUsers();
   */
  async getUsers() {
    const response = await this.client.get('/users');
    return response.data;
  }

  /**
   * Get a List of Email Accounts - Get connected email accounts
   *
   * @returns {Promise<Object>} Email accounts list
   *
   * @example
   * const mailboxes = await apollo.getEmailAccounts();
   */
  async getEmailAccounts() {
    const response = await this.client.get('/email_accounts');
    return response.data;
  }

  // ============================================
  // HELPER METHODS (Custom Workflows)
  // ============================================

  /**
   * Full Lead Enrichment Workflow
   *
   * Enriches a lead with all available data from Apollo
   *
   * @param {Object} lead - Basic lead info
   * @param {string} lead.email - Email (optional)
   * @param {string} lead.linkedin_url - LinkedIn URL (optional)
   * @param {string} lead.first_name - First name (optional)
   * @param {string} lead.last_name - Last name (optional)
   * @param {string} lead.company - Company name (optional)
   *
   * @returns {Promise<Object>} Fully enriched lead
   *
   * @example
   * const enriched = await apollo.fullLeadEnrichment({
   *   email: 'rajesh@jaininvestment.com',
   *   first_name: 'Rajesh',
   *   last_name: 'Kanojia',
   *   company: 'Jain Investment'
   * });
   */
  async fullLeadEnrichment(lead) {
    try {
      // Step 1: Enrich person
      const personData = await this.enrichPerson({
        email: lead.email,
        linkedin_url: lead.linkedin_url,
        first_name: lead.first_name,
        last_name: lead.last_name,
        organization_name: lead.company,
        reveal_personal_emails: true,
        reveal_phone_number: true
      });

      // Step 2: Enrich organization (if domain available)
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

      // Step 3: Combine data
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

  /**
   * Batch Lead Enrichment
   *
   * Enriches multiple leads with pagination support (10 per batch)
   *
   * @param {Array<Object>} leads - Array of leads
   * @param {boolean} reveal_personal_emails - Reveal personal emails
   * @param {boolean} reveal_phone_number - Reveal phone numbers
   *
   * @returns {Promise<Array>} Array of enriched leads
   *
   * @example
   * const enriched = await apollo.batchLeadEnrichment([
   *   { email: 'person1@company.com' },
   *   { email: 'person2@company.com' },
   *   // ... up to 100 leads
   * ], true, true);
   */
  async batchLeadEnrichment(leads, reveal_personal_emails = true, reveal_phone_number = true) {
    const results = [];
    const batchSize = 10; // Apollo limit

    // Process in batches of 10
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
        // Add failed leads with error
        results.push(...batch.map(lead => ({ ...lead, error: error.message })));
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Search IFAs/Financial Advisors in India
   *
   * Pre-configured search for Partners segment
   *
   * @param {Object} params
   * @param {Array<string>} params.locations - Cities (default: Mumbai, Delhi, Bangalore)
   * @param {number} params.per_page - Results per page (max: 100)
   * @param {number} params.page - Page number
   *
   * @returns {Promise<Object>} Search results
   *
   * @example
   * const ifas = await apollo.searchIFAs({
   *   locations: ['Mumbai, India', 'Pune, India'],
   *   per_page: 50
   * });
   */
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

  /**
   * Search HNI Prospects (CEOs, Founders, CXOs)
   *
   * Pre-configured search for HNI segment
   *
   * @param {Object} params
   * @param {Array<string>} params.locations - Cities
   * @param {number} params.per_page - Results per page
   * @param {number} params.page - Page number
   *
   * @returns {Promise<Object>} Search results
   *
   * @example
   * const hnis = await apollo.searchHNIs({
   *   locations: ['Mumbai, India'],
   *   per_page: 50
   * });
   */
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
        '51,200',    // 51-200 employees
        '201,500',   // 201-500 employees
        '501,1000',  // 501-1000 employees
        '1001,5000'  // 1001-5000 employees
      ],
      per_page: params.per_page || 50,
      page: params.page || 1
    });
  }
}

module.exports = ApolloAPI;
