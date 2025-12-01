import WorkflowNode from './workflow-node.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const scoreCalculators = {
  partners: {
    years_experience: (lead) => clamp((lead.years_experience || 0) * 5),
    aum_band: (lead) => {
      const match = /(\d+)\s*Cr/i.exec(lead.aum || '');
      if (!match) return 40;
      const value = Number.parseInt(match[1], 10);
      return clamp((value / 5) * 10, 20, 100);
    },
    client_base: (lead) => clamp(((lead.client_base || 0) / 5), 30, 100),
    digital_presence: (lead) => clamp(lead.digital_presence || 50),
    engagement: (lead) => clamp(lead.engagement || 60),
    location_tier: (lead) => {
      const metro = ['mumbai', 'delhi', 'bengaluru', 'bangalore'];
      const city = (lead.location || '').toLowerCase();
      return metro.some((item) => city.includes(item)) ? 100 : 70;
    }
  },
  hni: {
    net_worth_signal: (lead) => clamp(((lead.net_worth_signal || 0) / 1_00_00_000) * 4),
    role_seniority: (lead) => {
      const title = (lead.job_title || '').toLowerCase();
      if (title.includes('cfo') || title.includes('ceo') || title.includes('founder')) {
        return 100;
      }
      if (title.includes('vp') || title.includes('director')) {
        return 85;
      }
      return 70;
    },
    education_pedigree: (lead) => {
      const education = (lead.education || '').toLowerCase();
      if (!education) return 70;
      if (education.includes('iit') || education.includes('iim')) return 95;
      if (education.includes('isb')) return 90;
      if (education.includes('harvard') || education.includes('wharton')) return 98;
      return 80;
    },
    investment_activity: (lead) => clamp(lead.investment_activity || 60),
    geography_score: (lead) => {
      const metros = ['mumbai', 'delhi', 'bengaluru', 'bangalore', 'pune', 'hyderabad'];
      const location = (lead.location || '').toLowerCase();
      return metros.some((city) => location.includes(city)) ? 95 : 75;
    },
    engagement: (lead) => clamp(lead.engagement || 60)
  },
  uhni: {
    ownership_stake: (lead) => {
      const match = /(\d+)/.exec(lead.ownership_stake || '');
      if (!match) return 70;
      return clamp(Number.parseInt(match[1], 10) * 1.5, 50, 100);
    },
    liquidity_events: (lead) => clamp((lead.liquidity_events || 0) * 20, 40, 100),
    family_office_structure: (lead) => (lead.family_office ? 95 : 70),
    philanthropic_activity: (lead) => clamp(lead.philanthropy || 60),
    international_presence: (lead) => clamp(lead.international_presence || 60),
    engagement: (lead) =>
      clamp(lead.engagement || (lead.linkedin_url ? 70 : 50), 40, 100)
  },
  mass_affluent: {
    income_band: (lead) => clamp(((lead.income_band || 0) / 1_00_000) * 2, 40, 95),
    digital_behavior: (lead) => clamp(lead.digital_behavior || 60),
    investment_history: (lead) => clamp(lead.investment_history || 50),
    geography_score: (lead) => {
      const tier1 = ['mumbai', 'delhi', 'bengaluru', 'bangalore', 'pune', 'hyderabad'];
      const location = (lead.location || '').toLowerCase();
      if (tier1.some((city) => location.includes(city))) return 90;
      if ((lead.location || '').toLowerCase().includes('chennai')) return 85;
      return 70;
    },
    engagement: (lead) => clamp(lead.engagement || 55),
    intent_signal: (lead) => clamp(lead.intent_signal || 50)
  }
};

export default class LeadScoringNode extends WorkflowNode {
  async execute(input = []) {
    const segmentId = this.context.segment.id;
    const weights = this.context.segment.scoring?.weights || {};
    const calculator = scoreCalculators[segmentId] || {};

    const scored = input.map((lead) => {
      let score = 0;
      Object.entries(weights).forEach(([key, weight]) => {
        const fn = calculator[key];
        if (typeof fn === 'function') {
          const value = fn(lead);
          score += value * weight;
        }
      });
      score = clamp(score, 0, 100);
      const tier = this.getTier(score);
      return {
        ...lead,
        lead_score: Number(score.toFixed(2)),
        lead_tier: tier
      };
    });

    const counts = scored.reduce(
      (acc, lead) => {
        acc[lead.lead_tier] += 1;
        return acc;
      },
      { Hot: 0, Warm: 0, Cold: 0 }
    );

    this.context.metrics.scored = scored.length;
    this.context.metrics.hot = counts.Hot;
    this.context.metrics.warm = counts.Warm;
    this.context.metrics.cold = counts.Cold;

    this.log('Lead scoring completed', counts);
    return scored;
  }

  getTier(score) {
    const { hotThreshold, warmThreshold } = this.context.segment.scoring;
    if (score >= hotThreshold) return 'Hot';
    if (score >= warmThreshold) return 'Warm';
    return 'Cold';
  }
}
