# Lead Generation Project

**Project Owner**: Marketing & Business Development
**Created**: 2025-10-03
**Status**: Strategy Complete, Ready for Execution

---

## 📁 Project Structure

```
/projects/lead-generation/
├── README.md (this file)
├── 00_MASTER_STRATEGY.md (Complete strategy overview)
├── 01_ICP_DEFINITIONS.md (Detailed ICPs for all segments)
├── 02_APIFY_SCRAPING_GUIDE.md (Step-by-step scraping instructions)
├── 03_OUTREACH_TEMPLATES.md (Ready-to-use email/LinkedIn templates)
├── /data/ (Lead databases - to be created)
├── /scripts/ (Automation scripts - to be created)
└── /results/ (Campaign performance tracking - to be created)
```

---

## 🎯 Project Objectives

Generate qualified leads across 4 target segments for PL Capital's PMS products (MADP & AQUA):

| Segment | Target Leads | Conversion Goal | Projected AUM |
|---------|--------------|-----------------|---------------|
| **Partners** | 500 | 25 (5%) | ₹100 Cr (indirect) |
| **HNIs** | 2,000 | 40 (2%) | ₹40 Cr |
| **UHNIs** | 200 | 10 (5%) | ₹150 Cr |
| **Mass Affluent** | 5,000 | 50 (1%) | ₹30 Cr |
| **TOTAL** | **7,700** | **125** | **₹320 Cr** |

**Projected Revenue** (at 2% management fee): ₹6.4 Cr in Year 1

---

## 📋 Quick Start Guide

### Phase 1: Setup (Week 1-2)
1. ✅ Review strategy documents (all 4 files)
2. ⬜ Set up Apify account (https://apify.com)
3. ⬜ Create Google Sheets lead database
4. ⬜ Set up email platform (n8n or Lemlist)
5. ⬜ Configure CRM (HubSpot/Zoho/Airtable)
6. ⬜ Customize outreach templates

### Phase 2: Lead Scraping (Week 3-4)
7. ⬜ Test scraping with 100 leads (Partners segment)
8. ⬜ Validate data quality and enrichment
9. ⬜ Full-scale scraping (all 4 segments)
10. ⬜ Clean, deduplicate, and score leads

### Phase 3: Outreach Launch (Week 5-8)
11. ⬜ Launch Partner outreach (500 leads)
12. ⬜ Launch HNI outreach (2,000 leads)
13. ⬜ Launch UHNI warm introductions (200 leads)
14. ⬜ Launch Mass Affluent newsletter campaign (5,000 leads)

### Phase 4: Optimize & Scale (Week 9-12)
15. ⬜ A/B test email subject lines
16. ⬜ Analyze conversion funnel
17. ⬜ Refine lead scoring model
18. ⬜ Scale winning campaigns

---

## 💰 Budget Summary

### Lead Acquisition Costs
- **Total Apify scraping**: ~$2,073
- **Monthly outreach tools**: $400-950
- **Annual software stack**: $7,900

### ROI Projection
- **Total Investment**: ~$20,000 (Year 1)
- **Projected Revenue**: ₹6.4 Cr (Year 1)
- **ROI**: 320x (assuming 2% conversion across segments)

---

## 🔑 Key Documents Overview

### 1. Master Strategy (00_MASTER_STRATEGY.md)
**Read this first!**

Comprehensive strategy including:
- ICP summaries for all 4 segments
- Lead scraping strategy
- Outreach sequences
- Technology stack
- Budget estimates
- Success metrics
- Timeline & milestones
- Risk mitigation

**Length**: ~18,000 words
**Reading Time**: 45 minutes

---

### 2. ICP Definitions (01_ICP_DEFINITIONS.md)
**Detailed buyer personas**

Deep dive into each segment:
- Demographic & firmographic profiles
- Pain points & challenges
- Goals & aspirations
- Decision-making process
- Objections & how to handle them
- Preferred communication style
- Lead scoring matrix
- Lookalike audience characteristics

**Length**: ~12,000 words
**Reading Time**: 30 minutes

---

### 3. Apify Scraping Guide (02_APIFY_SCRAPING_GUIDE.md)
**Technical implementation**

Step-by-step instructions:
- Apify account setup
- Actor selection & configuration
- Scraping workflows for each segment
- Cost optimization tips
- Compliance & best practices
- Troubleshooting
- Data processing pipeline

**Length**: ~8,000 words
**Reading Time**: 20 minutes

---

### 4. Outreach Templates (03_OUTREACH_TEMPLATES.md)
**Ready-to-use templates**

50+ templates including:
- LinkedIn connection requests
- Email sequences (5 emails per segment)
- WhatsApp messages
- Phone scripts
- Physical mailer content
- Newsletter templates
- Meeting confirmations
- Follow-ups

**Length**: ~15,000 words
**Reference Material**: Copy-paste as needed

---

## 🎯 Target Segment Quick Reference

### Partners (IFAs, Wealth Managers)
- **Profile**: 3-20 year old advisory firms, ₹10-500 Cr AUM
- **Pain Point**: Product differentiation, client retention
- **Value Prop**: 80-year legacy, quant edge, high commission
- **Outreach**: LinkedIn + Email (B2B style)
- **Conversion Goal**: 5% (25 partners)

### HNIs (₹5-25 Cr Net Worth)
- **Profile**: Business owners, CXOs, senior professionals
- **Pain Point**: Portfolio underperformance, lack of personalization
- **Value Prop**: AQUA's 76% returns, systematic approach
- **Outreach**: Email + LinkedIn (educational, thought leadership)
- **Conversion Goal**: 2% (40 clients)

### UHNIs (₹25 Cr+ Net Worth)
- **Profile**: Promoters, family offices, serial entrepreneurs
- **Pain Point**: Alpha generation, wealth preservation
- **Value Prop**: Direct access to fund manager, customization
- **Outreach**: Personal introductions, executive packages
- **Conversion Goal**: 5% (10 clients, but high AUM)

### Mass Affluent (₹50 Lakh - ₹5 Cr)
- **Profile**: Mid-senior professionals, small business owners
- **Pain Point**: Knowledge gap, time constraints, guidance shortage
- **Value Prop**: Entry-level PMS (₹50 lakh), digital-first, educational
- **Outreach**: Newsletter + automated sequences
- **Conversion Goal**: 1% (50 clients)

---

## 🛠️ Technology Stack

### Lead Generation
- **Apify**: Primary scraping platform
  - Actors: anchor/linkedin-profile-enrichment, code_crafter/leads-finder
- **Google Sheets**: Lead database & scoring
- **LinkedIn Sales Navigator** (optional): Manual research for UHNIs

### Outreach & Automation
- **Email**: n8n (self-hosted) or Lemlist ($50-100/month)
- **LinkedIn**: Expandi or Waalaxy ($50-100/month)
- **CRM**: HubSpot, Zoho, or Airtable ($100-500/month)
- **Video**: HeyGen (already set up - $100/month)

### Analytics
- **Google Analytics 4**: Website tracking
- **Mixpanel**: User behavior
- **Google Data Studio**: Dashboards

---

## 📊 Success Metrics

### Lead Generation KPIs
- Total leads scraped: 7,700
- Qualified leads (score >60): 5,000
- Hot leads (score >80): 500
- Email deliverability: >95%
- Data completeness: >90%

### Outreach Performance KPIs
- Email open rate: 35-45%
- Click-through rate: 10-20%
- Reply rate: 8-15%
- LinkedIn connection acceptance: 30-50%
- Discovery call booking: 5-10%

### Conversion KPIs
- Partners: 5% (25 partnerships)
- HNIs: 2% (40 clients)
- UHNIs: 5% (10 clients)
- Mass Affluent: 1% (50 clients)
- **Total**: 125 conversions, ₹320 Cr AUM

---

## ⚠️ Critical Success Factors

### 1. Data Quality
- ✅ Use multiple enrichment sources
- ✅ Manual verification for UHNIs
- ✅ Regular data hygiene
- ✅ Email verification before sending

### 2. Personalization
- ✅ Segment-specific messaging
- ✅ Reference specific details (company, role, achievements)
- ✅ Avoid generic templates
- ✅ Use video for hot leads

### 3. Consistency
- ✅ Follow outreach sequences diligently
- ✅ Don't skip steps
- ✅ Track all interactions in CRM
- ✅ Regular follow-ups

### 4. Compliance
- ✅ LinkedIn ToS compliance (rate limiting)
- ✅ Email marketing laws (unsubscribe links)
- ✅ Data privacy (consent, opt-out)
- ✅ SEBI regulations (disclaimers, risk disclosures)

---

## 🚨 Common Pitfalls to Avoid

1. **Skipping the research phase** → Low conversion rates
2. **Using generic templates** → Low engagement
3. **Not testing before scaling** → Wasted budget
4. **Ignoring data quality** → High bounce rates
5. **Over-automation on LinkedIn** → Account restrictions
6. **No follow-up system** → Lost opportunities
7. **Weak value proposition** → Low reply rates
8. **Missing compliance requirements** → Legal issues

---

## 📞 Team Roles & Responsibilities

### Marketing Manager
- Own overall strategy
- Approve templates and messaging
- Monitor KPIs weekly
- Report to leadership monthly

### Marketing Ops
- Set up technical stack (Apify, n8n, CRM)
- Execute scraping workflows
- Clean and score leads
- Configure automation

### Business Development (Partners)
- Own Partner segment outreach
- Conduct discovery calls
- Close partnerships
- Relationship management

### Business Development (HNI/UHNI)
- Own HNI & UHNI outreach
- Personal introductions for UHNIs
- Portfolio review consultations
- Client onboarding

### Content Creator
- Customize outreach templates
- Create newsletter content
- Write blog posts for lead magnets
- Produce webinar presentations

---

## 📅 12-Week Implementation Timeline

### Weeks 1-2: Setup
- Review all strategy documents
- Set up Apify and configure actors
- Create lead database (Google Sheets)
- Set up email platform and CRM
- Customize outreach templates
- **Deliverable**: Fully configured tech stack

### Weeks 3-4: Scraping
- Run test scraping (100 leads)
- Validate and refine
- Execute full-scale scraping (7,700 leads)
- Clean, deduplicate, enrich data
- Apply scoring model
- **Deliverable**: 5,000 qualified leads ready for outreach

### Weeks 5-6: Pilot Outreach
- Launch Partner pilot (50 leads)
- Launch HNI pilot (100 leads)
- Launch UHNI warm intros (10 leads)
- Launch Mass Affluent newsletter (500 leads)
- **Deliverable**: Validated outreach performance

### Weeks 7-8: Scale Outreach
- Scale Partner outreach (450 remaining)
- Scale HNI outreach (1,900 remaining)
- Continue UHNI personal outreach (190 remaining)
- Scale Mass Affluent newsletter (4,500 remaining)
- **Deliverable**: All segments in active outreach

### Weeks 9-10: Optimize
- A/B test email subject lines
- Refine LinkedIn messaging
- Analyze conversion funnel
- Adjust lead scoring
- **Deliverable**: Optimized campaigns

### Weeks 11-12: Report & Plan
- Comprehensive performance report
- ROI analysis
- Learnings and insights
- Q2 strategy recommendations
- **Deliverable**: Performance report + Q2 plan

---

## 🎓 Additional Resources

### Recommended Reading
1. **"Predictable Revenue"** by Aaron Ross - B2B lead gen
2. **"$100M Leads"** by Alex Hormozi - Lead generation strategies
3. **"The Sales Acceleration Formula"** by Mark Roberge - Data-driven sales

### Online Courses
1. **LinkedIn Lead Generation** - Skillshare
2. **Cold Email Mastery** - Udemy
3. **Apify Academy** - https://academy.apify.com

### Tools & Websites
1. **Apify Store** - https://apify.com/store
2. **Lemlist Academy** - https://www.lemlist.com/academy
3. **HubSpot Academy** - https://academy.hubspot.com

---

## 📝 Next Immediate Actions

**This Week:**
1. ⬜ Get leadership approval on strategy
2. ⬜ Allocate budget ($20,000 for Year 1)
3. ⬜ Assign team roles
4. ⬜ Set up Apify account
5. ⬜ Schedule kick-off meeting

**Next Week:**
6. ⬜ Configure technical stack
7. ⬜ Customize first set of templates
8. ⬜ Run test scraping (100 leads)
9. ⬜ Send test emails internally
10. ⬜ Refine based on feedback

---

## 📧 Contact & Questions

For questions about this project:
- **Strategy**: Marketing Manager
- **Technical**: Marketing Ops Lead
- **Execution**: BD Managers
- **Compliance**: Legal/Compliance Team

---

## 🔄 Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-03 | Initial strategy created | AI Assistant |
| - | - | - | - |

---

## ⚖️ Legal & Compliance Notes

**Data Privacy**: All lead data must be stored securely, with explicit consent obtained before email marketing. Provide clear opt-out mechanisms.

**SEBI Regulations**: All performance claims must include standard disclaimers. "Past performance does not guarantee future returns. Investments in PMS are subject to market risks."

**LinkedIn ToS**: Stay within automation limits (<100 connection requests/week). Use residential proxies. No fake profiles.

**Email Marketing**: Include sender identification, physical address, and one-click unsubscribe in all marketing emails.

---

**Ready to Generate Leads?**

Start with `00_MASTER_STRATEGY.md` for the complete overview, then dive into specific documents as needed.

Good luck with the campaign! 🚀

---

*This project is designed for PL Capital's lead generation needs. Customize and adapt based on actual performance data and market feedback.*
