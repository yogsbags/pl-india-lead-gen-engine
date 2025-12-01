/**
 * Signal Scoring Node
 *
 * Combines multiple signal types to create a composite "Signal Readiness Score":
 * - Intent signals (Apollo buying intent)
 * - Engagement signals (email opens, website visits)
 * - Timing signals (job changes, funding, hiring)
 * - Firmographic fit (ICP alignment)
 *
 * Output: Signal Score (0-100) + Priority Tier (Hot/Warm/Cold)
 */

import WorkflowNode from './workflow-node.js';
import { getSignalForSegment } from '../config/apollo-signals.js';

export default class SignalScoringNode extends WorkflowNode {
  async execute(input = []) {
    if (!input || input.length === 0) {
      this.warn('No leads to score');
      return [];
    }

    const segmentId = this.context.segment.id;
    const signalConfig = getSignalForSegment(segmentId);

    if (!signalConfig) {
      this.warn(`No signal configuration for segment: ${segmentId}`);
      return input;
    }

    this.log(`📊 Signal Scoring Node - ${segmentId}`);
    this.log(`   Leads to score: ${input.length}`);
    this.log(`   Scoring model: ${Object.keys(signalConfig.scoring).join(', ')}`);

    // Score each lead
    const scoredLeads = input.map(lead => {
      const signalScore = this.calculateCompositeSignalScore(lead, signalConfig);
      const tier = this.getSignalTier(signalScore);
      const priority = this.calculatePriority(signalScore, lead);

      return {
        ...lead,
        signal_score: signalScore,
        signal_tier: tier,
        signal_priority: priority,
        signal_breakdown: this.getScoreBreakdown(lead, signalConfig),
        signal_triggers: this.identifyTriggers(lead),
        outreach_recommendation: this.getOutreachRecommendation(tier, lead)
      };
    });

    // Sort by signal score (highest first)
    scoredLeads.sort((a, b) => b.signal_score - a.signal_score);

    // Log score distribution
    const hot = scoredLeads.filter(l => l.signal_tier === 'Hot Signal').length;
    const warm = scoredLeads.filter(l => l.signal_tier === 'Warm Signal').length;
    const cold = scoredLeads.filter(l => l.signal_tier === 'Cold Signal').length;

    this.log(`   ✅ Scored ${scoredLeads.length} leads`);
    this.log(`   🔥 Hot Signals (≥70): ${hot}`);
    this.log(`   🌤️  Warm Signals (40-69): ${warm}`);
    this.log(`   ❄️  Cold Signals (<40): ${cold}`);

    const avgScore = Math.round(
      scoredLeads.reduce((sum, l) => sum + l.signal_score, 0) / scoredLeads.length
    );
    this.log(`   Average Signal Score: ${avgScore}`);

    // Store scoring summary in context
    this.context.signalScoring = {
      total_scored: scoredLeads.length,
      hot_count: hot,
      warm_count: warm,
      cold_count: cold,
      avg_signal_score: avgScore,
      top_score: scoredLeads[0]?.signal_score || 0,
      bottom_score: scoredLeads[scoredLeads.length - 1]?.signal_score || 0
    };

    return scoredLeads;
  }

  /**
   * Calculate composite signal score (0-100)
   */
  calculateCompositeSignalScore(lead, signalConfig) {
    let score = 0;
    const weights = signalConfig.scoring;

    // 1. Intent Signal Score (0-25 or 0-30 depending on segment)
    if (weights.intent_strength || weights.intent) {
      const intentWeight = weights.intent_strength || weights.intent || 0;
      const intentScore = this.scoreIntentSignal(lead);
      score += (intentScore / 100) * intentWeight;
    }

    // 2. Job Title / Seniority Score
    if (weights.job_title || weights.role_seniority) {
      const titleWeight = weights.job_title || weights.role_seniority || 0;
      const titleScore = this.scoreTitleSeniority(lead, signalConfig);
      score += (titleScore / 100) * titleWeight;
    }

    // 3. Net Worth / Wealth Signal Score
    if (weights.net_worth_signal) {
      const wealthScore = this.scoreWealthSignal(lead, signalConfig);
      score += (wealthScore / 100) * weights.net_worth_signal;
    }

    // 4. Company Metrics / Firmographic Score
    if (weights.company_metrics || weights.firmographic_fit) {
      const companyWeight = weights.company_metrics || weights.firmographic_fit || 0;
      const companyScore = this.scoreCompanyMetrics(lead, signalConfig);
      score += (companyScore / 100) * companyWeight;
    }

    // 5. Engagement Score
    if (weights.engagement) {
      const engagementScore = this.scoreEngagement(lead);
      score += (engagementScore / 100) * weights.engagement;
    }

    // 6. Geography Score
    if (weights.geography_score || weights.location_tier) {
      const geoWeight = weights.geography_score || weights.location_tier || 0;
      const geoScore = this.scoreGeography(lead, signalConfig);
      score += (geoScore / 100) * geoWeight;
    }

    // 7. Timing / Recency Bonus
    const recencyBonus = this.getRecencyBonus(lead);
    score += recencyBonus;

    // 8. Trigger Event Bonus
    const triggerBonus = this.getTriggerBonus(lead);
    score += triggerBonus;

    // Cap at 100
    return Math.min(Math.round(score), 100);
  }

  /**
   * Score intent signals (0-100)
   */
  scoreIntentSignal(lead) {
    if (!lead.intent_strength) return 0;

    const baseScores = {
      high: 90,
      medium: 60,
      low: 30,
      unknown: 0
    };

    let score = baseScores[lead.intent_strength] || 0;

    // Bonus for multiple intent signals
    if (lead.intent_signals_count) {
      const countBonus = Math.min(lead.intent_signals_count * 2, 10);
      score += countBonus;
    }

    // Bonus for relevant topics
    if (lead.intent_topics && lead.intent_topics.length > 0) {
      score += Math.min(lead.intent_topics.length * 3, 10);
    }

    return Math.min(score, 100);
  }

  /**
   * Score job title and seniority (0-100)
   */
  scoreTitleSeniority(lead, signalConfig) {
    if (!lead.title && !lead.seniority) return 0;

    const seniorityScores = {
      c_suite: 100,
      owner: 100,
      founder: 100,
      vp: 80,
      director: 60,
      manager: 40,
      individual_contributor: 20
    };

    let score = seniorityScores[lead.seniority] || 20;

    // Check if title matches target titles
    const targetTitles = signalConfig.demographic.person_titles || [];
    if (lead.title) {
      const hasMatchingTitle = targetTitles.some(title =>
        lead.title.toLowerCase().includes(title.toLowerCase())
      );
      if (hasMatchingTitle) {
        score += 20; // Bonus for exact title match
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Score wealth signals (0-100)
   */
  scoreWealthSignal(lead, signalConfig) {
    if (!lead.estimated_net_worth) return 0;

    const netWorth = lead.estimated_net_worth;
    const wealthConfig = signalConfig.wealthEnrichment?.estimated_net_worth;

    if (!wealthConfig) return 0;

    const minThreshold = wealthConfig.min || 0;
    const maxThreshold = wealthConfig.max || Number.MAX_SAFE_INTEGER;

    // Within target range
    if (netWorth >= minThreshold && netWorth <= maxThreshold) {
      // Score based on percentile within range
      const range = maxThreshold - minThreshold;
      const percentile = (netWorth - minThreshold) / range;
      return Math.round(70 + (percentile * 30)); // 70-100 for in-range
    }

    // Below threshold
    if (netWorth < minThreshold) {
      const percentOfMin = netWorth / minThreshold;
      return Math.round(percentOfMin * 50); // 0-50 for below threshold
    }

    // Above threshold (only applies if max is set)
    return 100;
  }

  /**
   * Score company metrics (0-100)
   */
  scoreCompanyMetrics(lead, signalConfig) {
    if (!lead.organization) return 0;

    let score = 0;
    const org = lead.organization;

    // Employee count score (0-40)
    if (org.employee_count) {
      const employeeRanges = signalConfig.firmographic.organization_num_employees_ranges || [];
      const matchesRange = employeeRanges.some(range => {
        const [min, max] = range.split(',').map(Number);
        return org.employee_count >= min && (max ? org.employee_count <= max : true);
      });
      score += matchesRange ? 40 : 20;
    }

    // Revenue score (0-30)
    if (org.revenue) {
      const revenueMin = signalConfig.firmographic.revenue_range?.min || 0;
      const revenueMax = signalConfig.firmographic.revenue_range?.max || Number.MAX_SAFE_INTEGER;
      if (org.revenue >= revenueMin && org.revenue <= revenueMax) {
        score += 30;
      } else {
        score += 10;
      }
    }

    // Industry match score (0-30)
    if (org.industry) {
      const targetIndustries = signalConfig.firmographic.q_organization_keyword_tags || [];
      const matchesIndustry = targetIndustries.some(industry =>
        org.industry.toLowerCase().includes(industry.toLowerCase())
      );
      score += matchesIndustry ? 30 : 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Score engagement (0-100)
   */
  scoreEngagement(lead) {
    let score = 0;

    // Email engagement (0-40)
    if (lead.email_opened) score += 20;
    if (lead.email_clicked) score += 20;

    // Website visits (0-30)
    if (lead.website_visits) {
      score += Math.min(lead.website_visits * 5, 30);
    }

    // Content downloads (0-20)
    if (lead.content_downloads && lead.content_downloads.length > 0) {
      score += Math.min(lead.content_downloads.length * 10, 20);
    }

    // LinkedIn engagement (0-10)
    if (lead.linkedin_profile_views) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Score geography (0-100)
   */
  scoreGeography(lead, signalConfig) {
    if (!lead.location && !lead.city) return 50; // Neutral if unknown

    const targetLocations = signalConfig.demographic.person_locations || [];
    const leadLocation = lead.location || `${lead.city}, ${lead.country}`;

    // Check for exact match
    const exactMatch = targetLocations.some(loc =>
      leadLocation.toLowerCase().includes(loc.toLowerCase())
    );

    if (exactMatch) return 100;

    // Check for country match (India)
    if (leadLocation.toLowerCase().includes('india')) return 70;

    // Other locations
    return 30;
  }

  /**
   * Recency bonus: Recent signals get higher scores
   */
  getRecencyBonus(lead) {
    if (!lead.intent_last_seen) return 0;

    const lastSeen = new Date(lead.intent_last_seen);
    const now = new Date();
    const daysAgo = Math.floor((now - lastSeen) / (1000 * 60 * 60 * 24));

    if (daysAgo <= 7) return 10; // Last week
    if (daysAgo <= 30) return 5; // Last month
    if (daysAgo <= 90) return 2; // Last quarter

    return 0;
  }

  /**
   * Trigger event bonus: Job change, funding, etc.
   */
  getTriggerBonus(lead) {
    let bonus = 0;

    // Job change trigger
    if (lead.job_change_date) {
      const changeDate = new Date(lead.job_change_date);
      const daysAgo = Math.floor((new Date() - changeDate) / (1000 * 60 * 60 * 24));
      if (daysAgo <= 30) bonus += 15; // Recent job change
      else if (daysAgo <= 90) bonus += 10;
    }

    // Funding trigger
    if (lead.organization?.recent_funding) {
      bonus += 10;
    }

    // Hiring spike trigger
    if (lead.organization?.hiring_spike) {
      bonus += 5;
    }

    return bonus;
  }

  /**
   * Get signal tier based on score
   */
  getSignalTier(score) {
    if (score >= 70) return 'Hot Signal';
    if (score >= 40) return 'Warm Signal';
    return 'Cold Signal';
  }

  /**
   * Calculate priority (1 = highest)
   */
  calculatePriority(signalScore, lead) {
    // Priority = Signal Score + ICP Score (if available)
    const icpScore = lead.lead_score || lead.icp_score || 0;
    const combinedScore = signalScore * 0.6 + icpScore * 0.4;

    if (combinedScore >= 85) return 1; // Top priority
    if (combinedScore >= 70) return 2;
    if (combinedScore >= 55) return 3;
    return 4; // Low priority
  }

  /**
   * Get detailed score breakdown for transparency
   */
  getScoreBreakdown(lead, signalConfig) {
    const weights = signalConfig.scoring;

    return {
      intent_score: this.scoreIntentSignal(lead),
      intent_weight: weights.intent_strength || weights.intent || 0,
      title_score: this.scoreTitleSeniority(lead, signalConfig),
      title_weight: weights.job_title || weights.role_seniority || 0,
      wealth_score: this.scoreWealthSignal(lead, signalConfig),
      wealth_weight: weights.net_worth_signal || 0,
      company_score: this.scoreCompanyMetrics(lead, signalConfig),
      company_weight: weights.company_metrics || weights.firmographic_fit || 0,
      engagement_score: this.scoreEngagement(lead),
      engagement_weight: weights.engagement || 0,
      geography_score: this.scoreGeography(lead, signalConfig),
      geography_weight: weights.geography_score || weights.location_tier || 0,
      recency_bonus: this.getRecencyBonus(lead),
      trigger_bonus: this.getTriggerBonus(lead)
    };
  }

  /**
   * Identify active triggers for this lead
   */
  identifyTriggers(lead) {
    const triggers = [];

    if (lead.intent_strength === 'high') {
      triggers.push({ type: 'high_intent', description: 'High buying intent detected', priority: 'high' });
    }

    if (lead.job_change_date) {
      const daysAgo = Math.floor((new Date() - new Date(lead.job_change_date)) / (1000 * 60 * 60 * 24));
      if (daysAgo <= 90) {
        triggers.push({ type: 'job_change', description: `Changed jobs ${daysAgo} days ago`, priority: 'high' });
      }
    }

    if (lead.organization?.recent_funding) {
      triggers.push({ type: 'funding', description: 'Company recently raised funding', priority: 'medium' });
    }

    if (lead.website_visits && lead.website_visits >= 3) {
      triggers.push({ type: 'engagement', description: `${lead.website_visits} website visits`, priority: 'medium' });
    }

    if (lead.email_clicked) {
      triggers.push({ type: 'email_engagement', description: 'Clicked email link', priority: 'medium' });
    }

    return triggers;
  }

  /**
   * Get personalized outreach recommendation
   */
  getOutreachRecommendation(tier, lead) {
    const triggers = this.identifyTriggers(lead);

    if (tier === 'Hot Signal') {
      if (triggers.some(t => t.type === 'job_change')) {
        return {
          channel: 'linkedin',
          timing: 'immediate',
          message_type: 'job_change_congratulations',
          personalization: `Congrats on the ${lead.title} role at ${lead.company}!`
        };
      }
      return {
        channel: 'email',
        timing: 'within_24h',
        message_type: 'high_intent_personalized',
        personalization: `I noticed you've been researching ${lead.intent_topics?.[0] || 'wealth management'}...`
      };
    }

    if (tier === 'Warm Signal') {
      return {
        channel: 'email',
        timing: 'within_3_days',
        message_type: 'intent_based_nurture',
        personalization: `Based on your interest in ${lead.intent_topics?.[0] || 'investment advisory'}...`
      };
    }

    // Cold Signal
    return {
      channel: 'email',
      timing: 'weekly_nurture',
      message_type: 'educational_content',
      personalization: null
    };
  }
}
