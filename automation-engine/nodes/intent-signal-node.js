/**
 * Intent Signal Node
 *
 * Fetches leads showing buying signals from Apollo.io based on:
 * - Intent topics (1,600+ topics tracked by Apollo)
 * - Intent strength (high/medium/low)
 * - Demographic filters (job title, seniority, location)
 * - Firmographic filters (company size, industry, revenue)
 * - Technographic data (tech stack)
 *
 * This node prioritizes leads who are ACTIVELY RESEARCHING topics
 * related to wealth management, investment advisory, etc.
 */

import WorkflowNode from './workflow-node.js';
import { ApolloAPI } from '../services/apollo-api.mjs';
import { getSignalForSegment, calculateSignalScore } from '../config/apollo-signals.js';

export default class IntentSignalNode extends WorkflowNode {
  async execute(input = []) {
    const isLive = this.context.executionMode === 'live';
    const segmentId = this.context.segment.id;

    this.log(`🎯 Intent Signal Node - ${segmentId}`);
    this.log(`   Mode: ${isLive ? 'LIVE' : 'SIMULATION'}`);

    // Get signal configuration for this segment
    const signalConfig = getSignalForSegment(segmentId);
    if (!signalConfig) {
      this.warn(`No signal configuration found for segment: ${segmentId}`);
      return input;
    }

    this.log(`   Signal: ${signalConfig.name}`);
    this.log(`   Intent Topics: ${signalConfig.intent.topics.slice(0, 3).join(', ')}...`);

    if (isLive) {
      return await this.executeLive(signalConfig);
    } else {
      return this.executeSimulation(signalConfig);
    }
  }

  /**
   * LIVE MODE: Fetch real leads from Apollo with intent signals
   */
  async executeLive(signalConfig) {
    const apiKey = process.env.APOLLO_API_KEY;
    if (!apiKey) {
      throw new Error('APOLLO_API_KEY not found in environment');
    }

    const apollo = new ApolloAPI(apiKey);
    const searchParams = signalConfig.apolloSearchParams;
    const maxResults = this.config.maxResults || 50;

    this.log(`   Searching Apollo with intent filters...`);
    this.log(`   Max results: ${maxResults}`);

    try {
      // Search people with intent signals
      const result = await apollo.searchPeople({
        ...searchParams,
        per_page: maxResults,
        page: 1
      });

      if (!result.people || result.people.length === 0) {
        this.warn('   No leads found matching intent criteria');
        return [];
      }

      const leads = result.people.map(person => this.transformApolloLead(person, signalConfig));

      // Calculate signal scores
      leads.forEach(lead => {
        lead.signal_score = calculateSignalScore(lead, this.context.segment.id);
      });

      // Sort by signal score (highest first)
      leads.sort((a, b) => b.signal_score - a.signal_score);

      this.log(`   ✅ Found ${leads.length} leads with intent signals`);
      this.log(`   Signal Score Range: ${leads[0]?.signal_score || 0} - ${leads[leads.length - 1]?.signal_score || 0}`);

      // Log signal distribution
      const highSignal = leads.filter(l => l.signal_score >= 70).length;
      const mediumSignal = leads.filter(l => l.signal_score >= 40 && l.signal_score < 70).length;
      const lowSignal = leads.filter(l => l.signal_score < 40).length;

      this.log(`   High Signal (≥70): ${highSignal}`);
      this.log(`   Medium Signal (40-69): ${mediumSignal}`);
      this.log(`   Low Signal (<40): ${lowSignal}`);

      // Store signal data in context
      this.context.signalData = {
        total_leads: leads.length,
        high_signal_count: highSignal,
        medium_signal_count: mediumSignal,
        low_signal_count: lowSignal,
        avg_signal_score: Math.round(leads.reduce((sum, l) => sum + l.signal_score, 0) / leads.length),
        intent_topics: signalConfig.intent.topics,
        timestamp: new Date().toISOString()
      };

      return leads;

    } catch (error) {
      this.error(`Apollo API error: ${error.message}`);
      throw error;
    }
  }

  /**
   * SIMULATION MODE: Generate synthetic leads with intent signals
   */
  executeSimulation(signalConfig) {
    const sampleSize = this.config.maxResults || 50;
    const segment = this.context.segment;

    this.log(`   Generating ${sampleSize} simulated leads with intent signals...`);

    const leads = [];
    const intentTopics = signalConfig.intent.topics;
    const titles = signalConfig.demographic.person_titles;

    for (let i = 0; i < sampleSize; i++) {
      const firstName = this.getRandomElement(segment.simulation.firstNames);
      const lastName = this.getRandomElement(segment.simulation.lastNames);
      const company = this.getRandomElement(segment.simulation.companies);
      const title = this.getRandomElement(titles);
      const intentTopic = this.getRandomElement(intentTopics);
      const intentStrength = this.getRandomElement(['high', 'medium', 'low'], [0.3, 0.5, 0.2]); // Weighted

      const lead = {
        id: `sim_${this.context.segment.id}_${Date.now()}_${i}`,
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
        title: title,
        seniority: this.getSeniorityFromTitle(title),
        company: company,
        industry: this.getRandomElement(signalConfig.firmographic.q_organization_keyword_tags),
        location: this.getRandomElement(signalConfig.demographic.person_locations),

        // Signal-specific fields
        intent_topics: [intentTopic],
        intent_strength: intentStrength,
        intent_score: this.getIntentScoreValue(intentStrength),
        intent_signals_count: Math.floor(Math.random() * 8) + 1, // 1-8 signals
        intent_last_seen: this.getRandomRecentDate(intentStrength),

        // Engagement signals
        engagement_level: Math.floor(Math.random() * 100),
        website_visits: Math.floor(Math.random() * 10),
        email_opened: Math.random() > 0.5,
        email_clicked: Math.random() > 0.7,

        // Wealth signals (if applicable)
        estimated_net_worth: this.estimateNetWorth(this.context.segment.id),

        // Organization data
        organization: {
          name: company,
          employee_count: this.getRandomElement([50, 100, 200, 500, 1000, 2000]),
          revenue: Math.floor(Math.random() * 50000000) + 10000000, // $10M-$60M
          industry: this.getRandomElement(signalConfig.firmographic.q_organization_keyword_tags)
        },

        // Metadata
        source: 'apollo_intent_signal',
        enriched_at: new Date().toISOString(),
        signal_type: 'intent',
        signal_category: this.getSignalCategory(intentStrength)
      };

      // Calculate signal score
      lead.signal_score = calculateSignalScore(lead, this.context.segment.id);

      leads.push(lead);
    }

    // Sort by signal score
    leads.sort((a, b) => b.signal_score - a.signal_score);

    // Log signal distribution
    const highSignal = leads.filter(l => l.signal_score >= 70).length;
    const mediumSignal = leads.filter(l => l.signal_score >= 40 && l.signal_score < 70).length;
    const lowSignal = leads.filter(l => l.signal_score < 40).length;

    this.log(`   ✅ Generated ${leads.length} simulated leads`);
    this.log(`   High Signal (≥70): ${highSignal}`);
    this.log(`   Medium Signal (40-69): ${mediumSignal}`);
    this.log(`   Low Signal (<40): ${lowSignal}`);

    // Store signal data in context
    this.context.signalData = {
      total_leads: leads.length,
      high_signal_count: highSignal,
      medium_signal_count: mediumSignal,
      low_signal_count: lowSignal,
      avg_signal_score: Math.round(leads.reduce((sum, l) => sum + l.signal_score, 0) / leads.length),
      intent_topics: intentTopics,
      timestamp: new Date().toISOString(),
      mode: 'simulation'
    };

    return leads;
  }

  /**
   * Transform Apollo API response to standard lead format
   */
  transformApolloLead(person, signalConfig) {
    return {
      id: person.id,
      first_name: person.first_name,
      last_name: person.last_name,
      name: person.name || `${person.first_name} ${person.last_name}`,
      email: person.email,
      phone: person.phone_numbers?.[0]?.sanitized_number || null,
      title: person.title,
      seniority: person.seniority,
      company: person.organization_name,
      industry: person.organization?.industry,
      location: `${person.city || ''}, ${person.state || ''}, ${person.country || ''}`.trim(),
      city: person.city,
      state: person.state,
      country: person.country,
      linkedin_url: person.linkedin_url,

      // Intent signals from Apollo
      intent_topics: person.intent_topics || [],
      intent_strength: person.intent_strength || 'unknown',
      intent_score: this.getIntentScoreValue(person.intent_strength),
      intent_signals_count: person.intent_signals_count || 0,
      intent_last_seen: person.intent_last_seen || null,

      // Organization data
      organization: {
        name: person.organization_name,
        domain: person.organization?.primary_domain,
        employee_count: person.organization?.estimated_num_employees,
        revenue: person.organization?.estimated_annual_revenue,
        industry: person.organization?.industry,
        founded_year: person.organization?.founded_year,
        technologies: person.organization?.technologies || []
      },

      // Metadata
      source: 'apollo_intent_signal',
      enriched_at: new Date().toISOString(),
      signal_type: 'intent',
      signal_category: this.getSignalCategory(person.intent_strength)
    };
  }

  /**
   * Helper: Get intent score numeric value
   */
  getIntentScoreValue(intentStrength) {
    const scores = {
      high: 90,
      medium: 60,
      low: 30,
      unknown: 0
    };
    return scores[intentStrength] || 0;
  }

  /**
   * Helper: Get signal category for prioritization
   */
  getSignalCategory(intentStrength) {
    const categories = {
      high: 'Hot Signal',
      medium: 'Warm Signal',
      low: 'Cold Signal',
      unknown: 'No Signal'
    };
    return categories[intentStrength] || 'Unknown';
  }

  /**
   * Helper: Get seniority from job title
   */
  getSeniorityFromTitle(title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('ceo') || titleLower.includes('founder') || titleLower.includes('owner')) {
      return 'c_suite';
    }
    if (titleLower.includes('vp') || titleLower.includes('vice president')) {
      return 'vp';
    }
    if (titleLower.includes('director')) {
      return 'director';
    }
    if (titleLower.includes('manager')) {
      return 'manager';
    }
    return 'individual_contributor';
  }

  /**
   * Helper: Estimate net worth based on segment
   */
  estimateNetWorth(segmentId) {
    const ranges = {
      hni: { min: 1000000, max: 30000000 },
      uhni: { min: 30000000, max: 500000000 },
      mass_affluent: { min: 100000, max: 1000000 },
      partners: null // N/A for organizations
    };

    const range = ranges[segmentId];
    if (!range) return null;

    return Math.floor(Math.random() * (range.max - range.min)) + range.min;
  }

  /**
   * Helper: Get random recent date based on intent strength
   */
  getRandomRecentDate(intentStrength) {
    const daysAgo = {
      high: Math.floor(Math.random() * 7), // 0-7 days ago
      medium: Math.floor(Math.random() * 30) + 7, // 7-37 days ago
      low: Math.floor(Math.random() * 60) + 30 // 30-90 days ago
    };

    const days = daysAgo[intentStrength] || 30;
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }

  /**
   * Helper: Get random element from array (with optional weights)
   */
  getRandomElement(array, weights = null) {
    if (!array || array.length === 0) return null;

    if (!weights) {
      return array[Math.floor(Math.random() * array.length)];
    }

    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < array.length; i++) {
      random -= weights[i];
      if (random <= 0) return array[i];
    }

    return array[0];
  }
}
