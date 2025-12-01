const sharedSimulation = {
  sampleFirstNames: [
    'Amit',
    'Sneha',
    'Rahul',
    'Priya',
    'Karan',
    'Neha',
    'Ananya',
    'Vikram'
  ],
  sampleLocations: [
    'Mumbai',
    'Delhi NCR',
    'Bengaluru',
    'Hyderabad',
    'Pune',
    'Ahmedabad',
    'Chennai',
    'Kolkata'
  ],
  sampleCompanies: [
    'Prime Wealth Advisors',
    'Elevate Capital',
    'Centurion Finance',
    'NorthStar Investments',
    'Axis Growth Partners',
    'Aurora Family Office'
  ]
};

const segments = {
  partners: {
    id: 'partners',
    name: 'Partners',
    description: 'Independent Financial Advisors & Wealth Managers',
    sheetTab: 'Partners_Leads',
    target: { leads: 500, conversion: 25, projected_aum_cr: 100 },
    scraping: {
      actorId: 'unlimitedleadtestinbox/unlimited-leads-scraper---up-to-10k-with-emails',
      queries: ['partners'],
      maxResults: 500,
      batchSize: 100,
      apifyInput: {
        country: 'India',
        companySize: '',
        industry: 'Finance',
        city: '',
        jobTitle: 'Financial Advisor',
        maxLeads: 50
      }
    },
    scoring: {
      weights: {
        years_experience: 0.25,
        aum_band: 0.2,
        client_base: 0.2,
        digital_presence: 0.15,
        engagement: 0.1,
        location_tier: 0.1
      },
      tiers: {
        hot: 80,
        warm: 60,
        cold: 40
      },
      hotThreshold: 80,
      warmThreshold: 60
    },
    outreach: {
      emailTemplates: ['P-E-01', 'P-E-02', 'P-E-03', 'P-E-04', 'P-E-05'],
      linkedinTemplates: ['P-LI-01', 'P-LI-02'],
      slackSummary: true,
      initialEmail: {
        subject:
          "Partner with 80-Year Legacy: PL Capital's Quant PMS for Your HNI Clients",
        htmlBody: `Hi {{firstName}},<br/><br/>I'm reaching out from PL Capital because our quantitative PMS strategies (MADP & AQUA) are helping advisors like {{company}} differentiate, deliver superior returns, and improve retention.<br/><br/><strong>Why partners onboard us:</strong><ul><li>AQUA delivered 76% returns in its debut year (vs 38% benchmark).</li><li>Systematic, bias-free execution clients love.</li><li>Attractive commission structure and co-branding support.</li></ul><br/>I'd love to schedule a 15-minute chat to explore how we can help your HNI clients upgrade to PMS.<br/><br/>Warm regards,<br/>{{senderName}}<br/>Business Development Manager, PL Capital`
      }
    },
    compliance: [
      'Include SEBI disclaimer for all performance claims.',
      'Limit LinkedIn automation to <100 requests/week.',
      'Capture consent before enrolling in email nurture.'
    ],
    simulation: {
      ...sharedSimulation,
      jobTitles: [
        'Founder & Wealth Manager',
        'Director - PMS Solutions',
        'Principal Financial Advisor',
        'Managing Partner',
        'Co-Founder & CIO'
      ],
      minExperienceYears: 5,
      maxExperienceYears: 20
    }
  },
  hni: {
    id: 'hni',
    name: 'High Net Worth Individuals',
    description: 'Professionals and entrepreneurs with ₹5-25 Cr investable assets',
    sheetTab: 'HNI_Leads',
    target: { leads: 2000, conversion: 40, projected_aum_cr: 40 },
    scraping: {
      actorId: 'unlimitedleadtestinbox/unlimited-leads-scraper---up-to-10k-with-emails',
      queries: [
        '"CFO" "India" site:linkedin.com/in AND "investor"',
        '"VP Finance" "family office"',
        '"entrepreneur" "portfolio" "India"',
        '"angel investor" "Mumbai"',
        '"managing director" "wealth management"'
      ],
      maxResults: 2500,
      batchSize: 200,
      apifyInput: {
        query: '{{query}}',
        maxResults: 75,
        positionLimit: 150,
        includeEmails: true,
        enrichPdl: true,
        proxy: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL']
        }
      }
    },
    scoring: {
      weights: {
        net_worth_signal: 0.3,
        role_seniority: 0.2,
        education_pedigree: 0.15,
        investment_activity: 0.15,
        geography_score: 0.1,
        engagement: 0.1
      },
      tiers: {
        hot: 82,
        warm: 65,
        cold: 45
      },
      hotThreshold: 82,
      warmThreshold: 65
    },
    outreach: {
      emailTemplates: ['H-E-01', 'H-E-02', 'H-E-03', 'H-E-04', 'H-E-05'],
      newsletterTag: 'quant-edge',
      heygenVideo: true,
      slackSummary: true,
      initialEmail: {
        subject: 'For {{firstName}}: How Quant Investing Generated 37.5% Alpha in 2024',
        htmlBody: `Hi {{firstName}},<br/><br/>I'm Siddharth Vora, Fund Manager at PL Capital. Our AQUA quant PMS delivered <strong>76% returns</strong> in its first year—37.5% alpha over the benchmark—by eliminating emotional decision-making.<br/><br/>I prepared a short report on the 6S framework powering AQUA and how HNIs like you are using it for tax-efficient wealth creation.<br/><br/><a href="https://plcapital.in/quant-edge">Download The Quant Edge →</a><br/><br/>If it resonates, I'd be glad to discuss how we can optimise your portfolio.<br/><br/>Warm regards,<br/>Siddharth Vora` 
      }
    },
    compliance: [
      'Use opt-in list only; include unsubscribe in every email.',
      'No performance guarantees; include PMS risk disclaimer.',
      'Respect RBI/SEBI guidelines for solicitation.'
    ],
    simulation: {
      ...sharedSimulation,
      jobTitles: [
        'CFO',
        'Founder & CEO',
        'Executive Director',
        'Managing Director',
        'Angel Investor'
      ],
      education: ['IIT', 'IIM', 'ISB', 'Harvard', 'Wharton'],
      interests: ['Quant Investing', 'Wealth Preservation', 'Global Markets']
    }
  },
  uhni: {
    id: 'uhni',
    name: 'Ultra High Net Worth Individuals',
    description: 'Family offices and principals with ₹25 Cr+ investable assets',
    sheetTab: 'UHNI_Leads',
    target: { leads: 200, conversion: 10, projected_aum_cr: 150 },
    scraping: {
      actorId: 'unlimitedleadtestinbox/unlimited-leads-scraper---up-to-10k-with-emails',
      queries: [
        '"family office" "principal" India',
        '"chairman" "listed company" AND "India"',
        '"promoter" "wealth management"',
        '"multi family office" "managing partner"',
        '"serial entrepreneur" "investor" India'
      ],
      maxResults: 400,
      batchSize: 50,
      apifyInput: {
        query: '{{query}}',
        maxResults: 40,
        positionLimit: 80,
        includeEmails: true,
        enrichPdl: true,
        proxy: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL']
        }
      }
    },
    scoring: {
      weights: {
        ownership_stake: 0.3,
        liquidity_events: 0.25,
        family_office_structure: 0.2,
        philanthropic_activity: 0.1,
        international_presence: 0.1,
        engagement: 0.05
      },
      tiers: {
        hot: 85,
        warm: 70,
        cold: 50
      },
      hotThreshold: 85,
      warmThreshold: 70
    },
    outreach: {
      emailTemplates: ['U-EA-01', 'U-EA-02', 'U-LI-01'],
      requiresExecutiveAssistant: true,
      includePhysicalMailer: true,
      slackSummary: true,
      initialEmail: {
        subject: 'Meeting Request: Bespoke Quant PMS for {{company}}',
        htmlBody: `Dear {{firstName}},<br/><br/>I'm {{senderName}} from PL Capital (Prabhudas Lilladher Group). We'd like to arrange a 30-minute presentation for {{company}}'s principal on our bespoke quantitative PMS mandates that deliver 18-22% CAGR with robust downside protection.<br/><br/>We work directly with family offices to diversify concentrated holdings, provide tax-efficient structures, and offer direct access to our fund manager.<br/><br/>Could you please share a suitable time over the next fortnight? Happy to host the meeting at your office or virtually.<br/><br/>Warm regards,<br/>{{senderName}}<br/>VP - Business Development (UHNI), PL Capital`
      }
    },
    compliance: [
      'Personalize outreach, avoid bulk email blasts.',
      'Coordinate with compliance for bespoke proposals.',
      'Store sensitive data securely with access logs.'
    ],
    simulation: {
      ...sharedSimulation,
      jobTitles: [
        'Chairman',
        'Family Office Principal',
        'Group CEO',
        'Founder & Promoter',
        'Executive Vice Chairman'
      ],
      familyOffices: ['Aravind Family Office', 'Skyline Ventures FO', 'Oceanic Holdings']
    }
  },
  mass_affluent: {
    id: 'mass_affluent',
    name: 'Mass Affluent',
    description: 'Emerging affluent investors with ₹50 Lakh - ₹5 Cr assets',
    sheetTab: 'Mass_Affluent_Leads',
    target: { leads: 5000, conversion: 50, projected_aum_cr: 30 },
    scraping: {
      actorId: 'unlimitedleadtestinbox/unlimited-leads-scraper---up-to-10k-with-emails',
      queries: [
        '"Engineering Manager" "investor"',
        '"Product Manager" "personal finance"',
        '"Senior Consultant" "wealth creation"',
        '"Doctor" "clinic owner" "India"',
        '"SME Founder" "growth" "India"'
      ],
      maxResults: 6000,
      batchSize: 500,
      apifyInput: {
        query: '{{query}}',
        maxResults: 100,
        positionLimit: 200,
        includeEmails: true,
        enrichPdl: true,
        proxy: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL']
        }
      }
    },
    scoring: {
      weights: {
        income_band: 0.25,
        digital_behavior: 0.2,
        investment_history: 0.2,
        geography_score: 0.15,
        engagement: 0.1,
        intent_signal: 0.1
      },
      tiers: {
        hot: 78,
        warm: 58,
        cold: 38
      },
      hotThreshold: 78,
      warmThreshold: 58
    },
    outreach: {
      emailTemplates: ['M-E-01', 'M-E-02', 'M-E-03', 'M-E-04', 'M-E-05'],
      newsletterCampaign: 'The Quant Edge',
      whatsappOptIn: true,
      slackSummary: false,
      initialEmail: {
        subject: 'Are You Making These 5 Investing Mistakes?',
        htmlBody: `Hi {{firstName}},<br/><br/>Most investors aim for 15-18% returns but end up with 8-10% because cognitive biases creep in.<br/><br/>In <strong>The Quant Edge</strong>, our free bi-weekly newsletter, we share systematic frameworks to remove emotion, tax strategies for high earners, and case studies from professionals like you.<br/><br/><a href="https://plcapital.in/the-quant-edge">Subscribe to The Quant Edge →</a><br/><br/>You'll also receive our guide, <em>5 Quant Signals Every Investor Should Track in 2025</em>.<br/><br/>Warm regards,<br/>Siddharth Vora`
      }
    },
    compliance: [
      'Explicit opt-in required for WhatsApp messaging.',
      'Store unsubscribe preferences immediately.',
      'Ensure simplified PMS explanations with disclaimers.'
    ],
    simulation: {
      ...sharedSimulation,
      jobTitles: [
        'Engineering Manager',
        'Senior Product Manager',
        'Associate Director',
        'Consultant',
        'Founder'
      ],
      interests: ['Financial Independence', 'Tax Planning', 'Quant Investing 101']
    }
  },

  // Signal-Based Workflow Segments (virtual segments that use Apollo intent signals)
  'signals-hni': {
    id: 'signals-hni',
    name: 'HNI Signal-Based Prospecting',
    description: 'HNI leads showing active buying intent signals',
    baseSegment: 'hni',
    sheetTab: 'HNI_Signals',
    target: { leads: 200, conversion: 30, projected_aum_cr: 40 },
    scoring: {
      weights: {
        net_worth_signal: 0.3,
        role_seniority: 0.2,
        education_pedigree: 0.15,
        investment_activity: 0.15,
        geography_score: 0.1,
        engagement: 0.1
      },
      tiers: {
        hot: 82,
        warm: 65,
        cold: 45
      },
      hotThreshold: 82,
      warmThreshold: 65
    },
    simulation: {
      ...sharedSimulation,
      firstNames: sharedSimulation.sampleFirstNames,
      lastNames: ['Sharma', 'Mehta', 'Iyer', 'Reddy', 'Gupta', 'Patel', 'Kapoor'],
      companies: sharedSimulation.sampleCompanies,
      jobTitles: ['CFO', 'Founder & CEO', 'Executive Director', 'Managing Director', 'Angel Investor'],
      education: ['IIT', 'IIM', 'ISB', 'Harvard', 'Wharton'],
      interests: ['Quant Investing', 'Wealth Preservation', 'Global Markets']
    }
  },
  'signals-uhni': {
    id: 'signals-uhni',
    name: 'UHNI Signal-Based Prospecting',
    description: 'UHNI leads showing ultra-high intent signals',
    baseSegment: 'uhni',
    sheetTab: 'UHNI_Signals',
    target: { leads: 100, conversion: 20, projected_aum_cr: 150 },
    scoring: {
      weights: {
        ownership_stake: 0.3,
        liquidity_events: 0.25,
        family_office_structure: 0.2,
        philanthropic_activity: 0.1,
        international_presence: 0.1,
        engagement: 0.05
      },
      tiers: {
        hot: 85,
        warm: 70,
        cold: 50
      },
      hotThreshold: 85,
      warmThreshold: 70
    },
    simulation: {
      ...sharedSimulation,
      firstNames: sharedSimulation.sampleFirstNames,
      lastNames: ['Sharma', 'Mehta', 'Iyer', 'Reddy', 'Gupta', 'Patel', 'Kapoor'],
      companies: sharedSimulation.sampleCompanies,
      jobTitles: ['Chairman', 'Family Office Principal', 'Group CEO', 'Founder & Promoter', 'Executive Vice Chairman'],
      familyOffices: ['Aravind Family Office', 'Skyline Ventures FO', 'Oceanic Holdings']
    }
  },
  'signals-mass-affluent': {
    id: 'signals-mass-affluent',
    name: 'Mass Affluent Signal-Based Prospecting',
    description: 'Mass affluent professionals with retirement intent',
    baseSegment: 'mass_affluent',
    sheetTab: 'Mass_Affluent_Signals',
    target: { leads: 500, conversion: 50, projected_aum_cr: 30 },
    scoring: {
      weights: {
        income_band: 0.25,
        digital_behavior: 0.2,
        investment_history: 0.2,
        geography_score: 0.15,
        engagement: 0.1,
        intent_signal: 0.1
      },
      tiers: {
        hot: 78,
        warm: 58,
        cold: 38
      },
      hotThreshold: 78,
      warmThreshold: 58
    },
    simulation: {
      ...sharedSimulation,
      firstNames: sharedSimulation.sampleFirstNames,
      lastNames: ['Sharma', 'Mehta', 'Iyer', 'Reddy', 'Gupta', 'Patel', 'Kapoor'],
      companies: sharedSimulation.sampleCompanies,
      jobTitles: ['Engineering Manager', 'Senior Product Manager', 'Associate Director', 'Consultant', 'Founder'],
      interests: ['Financial Independence', 'Tax Planning', 'Quant Investing 101']
    }
  },
  'signals-partners': {
    id: 'signals-partners',
    name: 'Partners Signal-Based Prospecting',
    description: 'Strategic partners showing partnership intent',
    baseSegment: 'partners',
    sheetTab: 'Partners_Signals',
    target: { leads: 150, conversion: 25, projected_aum_cr: 100 },
    scoring: {
      weights: {
        years_experience: 0.25,
        aum_band: 0.2,
        client_base: 0.2,
        digital_presence: 0.15,
        engagement: 0.1,
        location_tier: 0.1
      },
      tiers: {
        hot: 80,
        warm: 60,
        cold: 40
      },
      hotThreshold: 80,
      warmThreshold: 60
    },
    simulation: {
      ...sharedSimulation,
      firstNames: sharedSimulation.sampleFirstNames,
      lastNames: ['Sharma', 'Mehta', 'Iyer', 'Reddy', 'Gupta', 'Patel', 'Kapoor'],
      companies: sharedSimulation.sampleCompanies,
      jobTitles: ['Founder & Wealth Manager', 'Director - PMS Solutions', 'Principal Financial Advisor', 'Managing Partner', 'Co-Founder & CIO'],
      minExperienceYears: 5,
      maxExperienceYears: 20
    }
  }
};

export const segmentList = Object.values(segments);
export const getSegmentById = (id) => segments[id];

export default segments;
