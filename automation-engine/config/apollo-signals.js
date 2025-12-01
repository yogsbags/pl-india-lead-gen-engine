/**
 * Apollo.io Signal Definitions
 *
 * Defines custom signals for each ICP segment based on Apollo's signal categories:
 * - Demographic/Firmographic
 * - Technographic
 * - Buying Intent
 * - Engagement/Activity
 * - Wealth-Related Enrichment
 * - Company-Level Signals
 * - Custom Signals (combined)
 * - Score-Based Signals
 */

export const apolloSignals = {
  // ============================================
  // HNI (High-Net-Worth Individuals) Signals
  // ============================================
  hni: {
    name: 'HNI-Wealth-Management-Intent',
    description: 'High-net-worth individuals actively researching wealth management',

    // Demographic filters
    demographic: {
      person_titles: [
        'Founder',
        'Owner',
        'CEO',
        'Managing Partner',
        'Chief Executive Officer',
        'Co-Founder',
        'President',
        'Chairman'
      ],
      person_seniorities: ['c_suite', 'owner', 'founder'],
      person_locations: [
        'Mumbai, India',
        'Delhi, India',
        'Bangalore, India',
        'Pune, India',
        'Hyderabad, India',
        'Chennai, India',
        'Ahmedabad, India',
        'Kolkata, India'
      ]
    },

    // Firmographic filters
    firmographic: {
      organization_num_employees_ranges: [
        '51,200',
        '201,500',
        '501,1000',
        '1001,5000',
        '5001,10000'
      ],
      q_organization_keyword_tags: [
        'Finance',
        'Real Estate',
        'Private Equity',
        'Venture Capital',
        'Investment',
        'Financial Services'
      ],
      // Revenue range: $10M+
      revenue_range: {
        min: 10000000, // $10M
        max: null // No upper limit
      }
    },

    // Intent signals (Apollo's buying intent topics)
    intent: {
      topics: [
        'wealth management',
        'private banking',
        'investment advisory',
        'portfolio management',
        'tax planning',
        'estate planning',
        'financial planning',
        'asset management'
      ],
      intent_strength: ['high', 'medium'] // Only high/medium intent
    },

    // Engagement filters
    engagement: {
      // Website visits (requires website tracking integration)
      page_visits: {
        pages: ['private-banking', 'wealth-management', 'services'],
        min_visits: 2,
        days: 30
      },
      // Email engagement (if prior outreach exists)
      email_engagement: {
        opened: true,
        clicked: true,
        days: 14
      }
    },

    // Wealth enrichment (custom fields)
    wealthEnrichment: {
      estimated_net_worth: {
        min: 1000000, // $1M
        max: 30000000 // $30M (below UHNI threshold)
      },
      income_bracket: {
        min: 500000, // ₹50 lakh/year
        max: 50000000 // ₹5 Cr/year
      }
    },

    // Company-level signals
    companySignals: {
      funding_stage: ['series_a', 'series_b', 'series_c', 'series_d'],
      funding_amount: {
        min: 5000000 // $5M+
      },
      growth_indicators: {
        revenue_growth_yoy: 20, // 20%+ growth
        employee_growth: 15 // 15%+ headcount growth
      }
    },

    // Technographic signals
    technographic: {
      technologies: [
        'Bloomberg Terminal',
        'FactSet',
        'Morningstar',
        'Salesforce',
        'Microsoft Dynamics',
        'SAP',
        'Oracle Financials'
      ]
    },

    // Apollo API search parameters (combined)
    apolloSearchParams: {
      person_titles: [
        'Founder', 'Owner', 'CEO', 'Managing Partner',
        'Chief Executive Officer', 'Co-Founder', 'President'
      ],
      person_seniorities: ['c_suite', 'owner', 'founder'],
      person_locations: [
        'Mumbai, India', 'Delhi, India', 'Bangalore, India',
        'Pune, India', 'Hyderabad, India'
      ],
      organization_num_employees_ranges: [
        '51,200', '201,500', '501,1000', '1001,5000'
      ],
      q_organization_keyword_tags: [
        'Finance', 'Real Estate', 'Private Equity', 'Investment'
      ],
      // Intent topics
      intent_topics: [
        'wealth management', 'private banking', 'investment advisory',
        'portfolio management', 'tax planning'
      ],
      intent_strength: ['high', 'medium'],
      per_page: 50
    },

    // Scoring weights (for composite signal score)
    scoring: {
      job_title: 25, // 25%
      net_worth_signal: 30, // 30%
      intent_strength: 25, // 25%
      engagement: 10, // 10%
      company_metrics: 10 // 10%
    }
  },

  // ============================================
  // UHNI (Ultra-High-Net-Worth Individuals) Signals
  // ============================================
  uhni: {
    name: 'UHNI-Family-Office-Signal',
    description: 'Ultra-high-net-worth individuals with family office needs',

    // Demographic filters
    demographic: {
      person_titles: [
        'Founder',
        'Owner',
        'CEO',
        'Managing Partner',
        'Chief Executive Officer',
        'Co-Founder',
        'Chairman',
        'Board Member',
        'Family Office Principal'
      ],
      person_seniorities: ['c_suite', 'owner', 'founder'],
      person_locations: [
        'Mumbai, India',
        'Delhi, India',
        'Bangalore, India',
        'Pune, India'
      ]
    },

    // Firmographic filters
    firmographic: {
      organization_num_employees_ranges: [
        '501,1000',
        '1001,5000',
        '5001,10000',
        '10001,' // 10,000+
      ],
      q_organization_keyword_tags: [
        'Private Equity',
        'Venture Capital',
        'Investment Banking',
        'Family Office',
        'Asset Management',
        'Hedge Fund'
      ],
      revenue_range: {
        min: 100000000, // $100M+
        max: null
      }
    },

    // Intent signals
    intent: {
      topics: [
        'family office services',
        'private equity investment',
        'philanthropy strategy',
        'offshore structures',
        'wealth preservation',
        'succession planning',
        'alternative investments',
        'art investment',
        'real estate investment'
      ],
      intent_strength: ['high', 'medium']
    },

    // Engagement filters
    engagement: {
      content_downloads: [
        'UHNI Investment Guide',
        'Family Office Whitepaper',
        'Private Equity Report'
      ],
      event_attendance: [
        'UHNI Summit',
        'Family Office Conference',
        'Private Wealth Forum'
      ],
      page_visits: {
        pages: ['family-office', 'private-wealth', 'uhni-services'],
        min_visits: 3,
        days: 30
      }
    },

    // Wealth enrichment
    wealthEnrichment: {
      estimated_net_worth: {
        min: 30000000, // $30M+
        max: null // No upper limit
      },
      aum: {
        min: 500000000 // $500M+ AUM
      },
      income_bracket: {
        min: 50000000 // ₹5 Cr+/year
      }
    },

    // Company-level signals
    companySignals: {
      funding_stage: ['series_c', 'series_d', 'series_e', 'ipo'],
      funding_amount: {
        min: 50000000 // $50M+
      },
      recent_ma_activity: true, // M&A in last 12 months
      ipo_plans: true,
      growth_indicators: {
        revenue_growth_yoy: 30, // 30%+ growth
        employee_growth: 25
      }
    },

    // Technographic signals
    technographic: {
      technologies: [
        'Bloomberg Terminal',
        'FactSet',
        'Refinitiv',
        'Addepar',
        'Black Diamond',
        'Salesforce Financial Services Cloud',
        'Private Bank Systems'
      ]
    },

    // Apollo API search parameters
    apolloSearchParams: {
      person_titles: [
        'Founder', 'Owner', 'CEO', 'Chairman',
        'Board Member', 'Managing Partner'
      ],
      person_seniorities: ['c_suite', 'owner', 'founder'],
      person_locations: [
        'Mumbai, India', 'Delhi, India', 'Bangalore, India'
      ],
      organization_num_employees_ranges: [
        '501,1000', '1001,5000', '5001,10000', '10001,'
      ],
      q_organization_keyword_tags: [
        'Private Equity', 'Family Office', 'Investment Banking'
      ],
      intent_topics: [
        'family office services', 'private equity investment',
        'wealth preservation', 'succession planning'
      ],
      intent_strength: ['high', 'medium'],
      per_page: 25 // Smaller sample for UHNI
    },

    // Scoring weights
    scoring: {
      ownership_stake: 30,
      net_worth_signal: 30,
      intent_strength: 20,
      company_metrics: 15,
      engagement: 5
    }
  },

  // ============================================
  // Mass Affluent Signals
  // ============================================
  mass_affluent: {
    name: 'MassAffluent-Retirement-Intent',
    description: 'Mass affluent professionals researching investment & retirement planning',

    // Demographic filters
    demographic: {
      person_titles: [
        'Director',
        'VP',
        'Vice President',
        'Senior Manager',
        'General Manager',
        'Head of',
        'Senior Director'
      ],
      person_seniorities: ['director', 'vp', 'manager'],
      person_locations: [
        'Mumbai, India',
        'Delhi, India',
        'Bangalore, India',
        'Pune, India',
        'Hyderabad, India',
        'Chennai, India',
        'Ahmedabad, India',
        'Kolkata, India',
        'Gurgaon, India',
        'Noida, India'
      ]
    },

    // Firmographic filters
    firmographic: {
      organization_num_employees_ranges: [
        '11,50',
        '51,200',
        '201,500',
        '501,1000'
      ],
      q_organization_keyword_tags: [
        'Technology',
        'Software',
        'Healthcare',
        'Professional Services',
        'Consulting',
        'Manufacturing',
        'E-commerce'
      ],
      revenue_range: {
        min: 5000000, // $5M
        max: 50000000 // $50M
      }
    },

    // Intent signals
    intent: {
      topics: [
        'retirement planning',
        'investment apps',
        'robo advisor',
        'mutual funds',
        'SIP investment',
        'tax saving',
        'insurance planning',
        'college savings',
        'home loan',
        'personal finance'
      ],
      intent_strength: ['high', 'medium', 'low'] // Accept low intent for mass market
    },

    // Engagement filters
    engagement: {
      email_engagement: {
        email_campaigns: [
          '5-step investment plan',
          'Retirement calculator',
          'SIP guide',
          'Tax saving tips'
        ],
        opened: true,
        days: 14
      },
      page_visits: {
        pages: [
          'robo-advisor',
          'retirement-planning',
          'sip-calculator',
          'investment-plans'
        ],
        min_visits: 1,
        days: 30
      }
    },

    // Wealth enrichment
    wealthEnrichment: {
      estimated_net_worth: {
        min: 100000, // $100k / ₹83 lakh
        max: 1000000 // $1M / ₹8.3 Cr
      },
      income_bracket: {
        min: 100000, // ₹10 lakh/year
        max: 5000000 // ₹50 lakh/year
      },
      age_range: {
        min: 30,
        max: 55 // Prime accumulation years
      }
    },

    // Company-level signals
    companySignals: {
      company_stage: ['growth', 'mature'],
      stable_employment: true, // No recent layoffs
      employee_benefits: ['ESOP', 'bonus', 'health insurance']
    },

    // Technographic signals
    technographic: {
      technologies: [
        'Zerodha',
        'Groww',
        'ETMoney',
        'Google Workspace',
        'Microsoft 365',
        'Slack'
      ]
    },

    // Apollo API search parameters
    apolloSearchParams: {
      person_titles: [
        'Director', 'VP', 'Vice President', 'Senior Manager',
        'General Manager', 'Head of'
      ],
      person_seniorities: ['director', 'vp', 'manager'],
      person_locations: [
        'Mumbai, India', 'Delhi, India', 'Bangalore, India',
        'Pune, India', 'Hyderabad, India', 'Chennai, India'
      ],
      organization_num_employees_ranges: [
        '11,50', '51,200', '201,500'
      ],
      q_organization_keyword_tags: [
        'Technology', 'Software', 'Healthcare', 'Consulting'
      ],
      intent_topics: [
        'retirement planning', 'investment apps', 'mutual funds',
        'SIP investment', 'tax saving'
      ],
      intent_strength: ['high', 'medium', 'low'],
      per_page: 100 // Larger volume for mass market
    },

    // Scoring weights
    scoring: {
      income_band: 25,
      intent_strength: 20,
      engagement: 20,
      digital_behavior: 20,
      geography_score: 15
    }
  },

  // ============================================
  // Partners Signals
  // ============================================
  partners: {
    name: 'Partner-FinTech-Co-Sell',
    description: 'Strategic partners (IFAs, FinTech, Wealth-Tech) for co-selling',

    // Company-level filters (focus on organizations, not individuals)
    firmographic: {
      q_organization_keyword_tags: [
        'FinTech',
        'Wealth Tech',
        'SaaS',
        'Financial Services',
        'Investment Advisory',
        'Wealth Management',
        'Financial Planning',
        'Robo Advisory'
      ],
      organization_num_employees_ranges: [
        '1,10',
        '11,50',
        '51,200',
        '201,500'
      ],
      revenue_range: {
        min: 1000000, // $1M
        max: 50000000 // $50M
      }
    },

    // Demographic (decision makers for partnerships)
    demographic: {
      person_titles: [
        'Founder',
        'CEO',
        'Co-Founder',
        'Chief Business Officer',
        'VP Business Development',
        'Head of Partnerships',
        'Director of Partnerships',
        'VP Strategic Alliances'
      ],
      person_seniorities: ['c_suite', 'owner', 'founder', 'vp', 'director']
    },

    // Intent signals
    intent: {
      topics: [
        'partner program',
        'co-sell',
        'white-label solution',
        'integration guide',
        'API partnership',
        'strategic alliance',
        'channel partnership',
        'referral program',
        'joint go-to-market'
      ],
      intent_strength: ['high', 'medium']
    },

    // Company signals
    companySignals: {
      funding_stage: ['seed', 'series_a', 'series_b', 'series_c'],
      funding_amount: {
        min: 5000000 // $5M+
      },
      recent_funding_months: 12, // Funded in last 12 months
      partnership_announcements: true,
      expansion_plans: true
    },

    // Engagement filters
    engagement: {
      event_attendance: [
        'Partner Enablement Webinar',
        'Co-Selling Workshop',
        'Integration Summit'
      ],
      content_downloads: [
        'Partner Playbook',
        'Integration Guide',
        'Co-Marketing Toolkit'
      ],
      website_sections: [
        'partners',
        'integrations',
        'api-docs'
      ]
    },

    // Technographic signals
    technographic: {
      technologies: [
        'REST API',
        'GraphQL',
        'Stripe',
        'Plaid',
        'Salesforce',
        'HubSpot',
        'Zapier',
        'Segment',
        'AWS',
        'Azure'
      ],
      has_public_api: true,
      has_partner_program: true
    },

    // Apollo API search parameters
    apolloSearchParams: {
      person_titles: [
        'Founder', 'CEO', 'Co-Founder', 'VP Business Development',
        'Head of Partnerships', 'Director of Partnerships'
      ],
      person_seniorities: ['c_suite', 'owner', 'founder', 'vp', 'director'],
      q_organization_keyword_tags: [
        'FinTech', 'Wealth Tech', 'SaaS', 'Financial Services'
      ],
      organization_num_employees_ranges: [
        '1,10', '11,50', '51,200', '201,500'
      ],
      intent_topics: [
        'partner program', 'co-sell', 'white-label solution',
        'API partnership', 'strategic alliance'
      ],
      intent_strength: ['high', 'medium'],
      per_page: 50
    },

    // Scoring weights
    scoring: {
      partnership_fit: 30,
      funding_recency: 25,
      intent_strength: 20,
      tech_compatibility: 15,
      engagement: 10
    }
  }
};

/**
 * Get signal configuration for a specific segment
 * Supports both base segment IDs (hni, uhni, mass_affluent, partners)
 * and signal-specific IDs (signals-hni, signals-uhni, etc.)
 */
export function getSignalForSegment(segmentId) {
  // Map signal-specific IDs to base segment IDs
  const segmentMapping = {
    'signals-hni': 'hni',
    'signals-uhni': 'uhni',
    'signals-mass-affluent': 'mass_affluent',
    'signals-partners': 'partners'
  };

  const baseSegmentId = segmentMapping[segmentId] || segmentId;
  return apolloSignals[baseSegmentId] || null;
}

/**
 * Get Apollo search parameters for a segment
 */
export function getApolloSearchParams(segmentId) {
  const signal = apolloSignals[segmentId];
  return signal ? signal.apolloSearchParams : null;
}

/**
 * Calculate composite signal score based on weights
 */
export function calculateSignalScore(lead, segmentId) {
  const signal = apolloSignals[segmentId];
  if (!signal || !signal.scoring) return 0;

  let score = 0;
  const weights = signal.scoring;

  // Example scoring logic (customize based on available data)
  // This would be enhanced with actual lead data fields

  // Job title score
  if (weights.job_title && lead.title) {
    const targetTitles = signal.demographic.person_titles || [];
    const hasTargetTitle = targetTitles.some(title =>
      lead.title.toLowerCase().includes(title.toLowerCase())
    );
    if (hasTargetTitle) score += weights.job_title;
  }

  // Intent strength score
  if (weights.intent_strength && lead.intent_score) {
    const intentMultiplier = {
      high: 1.0,
      medium: 0.6,
      low: 0.3
    };
    score += weights.intent_strength * (intentMultiplier[lead.intent_score] || 0);
  }

  // Engagement score
  if (weights.engagement && lead.engagement_level) {
    score += weights.engagement * (lead.engagement_level / 100);
  }

  // Net worth signal
  if (weights.net_worth_signal && lead.estimated_net_worth) {
    const netWorth = lead.estimated_net_worth;
    const minNetWorth = signal.wealthEnrichment?.estimated_net_worth?.min || 0;
    if (netWorth >= minNetWorth) {
      score += weights.net_worth_signal;
    }
  }

  // Company metrics
  if (weights.company_metrics && lead.organization) {
    const org = lead.organization;
    if (org.employee_count && org.employee_count >= 50) {
      score += weights.company_metrics * 0.5;
    }
    if (org.revenue && org.revenue >= 10000000) {
      score += weights.company_metrics * 0.5;
    }
  }

  return Math.round(score);
}

export default apolloSignals;
