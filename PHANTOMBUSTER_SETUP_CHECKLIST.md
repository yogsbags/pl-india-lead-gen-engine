# PhantomBuster Setup Checklist

**Integration Status**: ✅ Code Complete - Ready for Configuration
**Estimated Setup Time**: 2-3 hours
**Recommended Plan**: PhantomBuster Pro ($149/month)

---

## 📋 Pre-Setup Checklist

### Account Requirements
- [ ] Credit card for PhantomBuster subscription
- [ ] Dedicated LinkedIn account (NOT your personal account)
- [ ] Google account (for spreadsheet integration)
- [ ] Email for support notifications

### Technical Requirements
- [ ] Node.js 18+ installed
- [ ] Access to lead-generation project repository
- [ ] Terminal/command line access
- [ ] Text editor for configuration

---

## 🚀 Setup Steps

### Step 1: PhantomBuster Account Setup (15 minutes)

- [ ] **1.1** Go to https://phantombuster.com
- [ ] **1.2** Click "Start Free Trial"
- [ ] **1.3** Create account with email/password
- [ ] **1.4** Verify email address
- [ ] **1.5** Choose **Pro Plan** ($149/month, 80 hours)
- [ ] **1.6** Add payment method
- [ ] **1.7** Set budget alerts:
  - [ ] 50% of execution time (40 hours)
  - [ ] 75% of execution time (60 hours)
  - [ ] 90% of execution time (72 hours)

**API Key:**
- [ ] **1.8** Go to Settings → API
- [ ] **1.9** Click "Create New API Key"
- [ ] **1.10** Copy API key (save securely)

---

### Step 2: LinkedIn Account Setup (30 minutes + 2 weeks aging)

⚠️ **CRITICAL: Never use your personal LinkedIn account for automation!**

#### Option A: Create New Dedicated Account
- [ ] **2.1** Create new email address (e.g., automation@plcapital.com)
- [ ] **2.2** Sign up for LinkedIn with new email
- [ ] **2.3** Use real name (can be company name or generic)
- [ ] **2.4** Complete profile:
  - [ ] Professional photo
  - [ ] Compelling headline (e.g., "Business Development at PL Capital")
  - [ ] Detailed summary (about PL Capital)
  - [ ] Work experience (PL Capital)
  - [ ] Education
- [ ] **2.5** Add 50-100 connections manually (team members, partners)
- [ ] **2.6** Join 5-10 relevant LinkedIn groups
- [ ] **2.7** Post 2-3 times per week for 2 weeks
- [ ] **2.8** **WAIT 2 WEEKS before starting automation** (account aging)

#### Option B: Use Sales Navigator Account (Recommended for HNI/UHNI)
- [ ] **2.1** Sign up for LinkedIn Sales Navigator ($99/month)
- [ ] **2.2** Complete setup wizard
- [ ] **2.3** Set up lead lists
- [ ] **2.4** Age account for 2 weeks with manual activity

**Account Safety:**
- [ ] **2.9** Enable two-factor authentication
- [ ] **2.10** Use strong password
- [ ] **2.11** Save login credentials securely

---

### Step 3: PhantomBuster Chrome Extension (5 minutes)

- [ ] **3.1** Go to Chrome Web Store
- [ ] **3.2** Search "PhantomBuster"
- [ ] **3.3** Click "Add to Chrome"
- [ ] **3.4** Pin extension to toolbar
- [ ] **3.5** Click extension → Login with PhantomBuster account
- [ ] **3.6** Grant necessary permissions

---

### Step 4: Create Core Phantoms (30 minutes)

#### Phantom 1: LinkedIn Profile Scraper
- [ ] **4.1** In PhantomBuster dashboard, click "New Phantom"
- [ ] **4.2** Search "LinkedIn Profile Scraper"
- [ ] **4.3** Click "Use this Phantom"
- [ ] **4.4** Name it: "Partners Profile Scraper"
- [ ] **4.5** Configure:
  ```
  Input: Spreadsheet URL or Profile URLs
  Number of profiles per launch: 50
  CSV name: partners_profiles
  ```
- [ ] **4.6** Click "Save"
- [ ] **4.7** Copy Agent ID (e.g., 1234567890abcdef)
- [ ] **4.8** Repeat for HNI, UHNI, Mass Affluent (create 4 total)

#### Phantom 2: LinkedIn Profile Email Extractor
- [ ] **4.9** Click "New Phantom" → Search "LinkedIn Profile Email Extractor"
- [ ] **4.10** Name it: "Partners Email Extractor"
- [ ] **4.11** Configure:
  ```
  Input: Spreadsheet URL or Profile URLs
  Number of profiles per launch: 100
  CSV name: partners_emails
  ```
- [ ] **4.12** Save and copy Agent ID
- [ ] **4.13** Repeat for other segments (4 total)

#### Phantom 3: LinkedIn Network Booster
- [ ] **4.14** Click "New Phantom" → Search "LinkedIn Network Booster"
- [ ] **4.15** Name it: "Partners Network Booster"
- [ ] **4.16** Configure:
  ```
  Input: Spreadsheet URL or Profile URLs
  Number of connections per launch: 20
  Message: Hi {firstName}, noticed you run {companyName} in the financial advisory space...
  Only second circle: Yes
  ```
- [ ] **4.17** Save and copy Agent ID
- [ ] **4.18** Repeat for HNI and Mass Affluent (3 total, skip UHNI)

#### Phantom 4: LinkedIn Profile Visitor
- [ ] **4.19** Click "New Phantom" → Search "LinkedIn Profile Visitor"
- [ ] **4.20** Name it: "HNI Profile Visitor"
- [ ] **4.21** Configure:
  ```
  Input: Spreadsheet URL or Profile URLs
  Number of visits per launch: 100
  ```
- [ ] **4.22** Save and copy Agent ID
- [ ] **4.23** Create for UHNI and Mass Affluent (3 total)

#### Phantom 5: LinkedIn Message Sender (Optional)
- [ ] **4.24** Click "New Phantom" → Search "LinkedIn Message Sender"
- [ ] **4.25** Name it: "Partners Message Sender"
- [ ] **4.26** Configure:
  ```
  Input: Spreadsheet URL or Profile URLs
  Number of messages per launch: 30
  Message column: Custom Message
  ```
- [ ] **4.27** Save and copy Agent ID

**Agent IDs Summary:**
```
Partners Profile Scraper: _______________
Partners Email Extractor: _______________
Partners Network Booster: _______________

HNI Profile Scraper: _______________
HNI Email Extractor: _______________
HNI Profile Visitor: _______________
HNI Network Booster: _______________

UHNI Profile Scraper: _______________
UHNI Profile Visitor: _______________

Mass Affluent Email Extractor: _______________
Mass Affluent Profile Visitor: _______________
Mass Affluent Network Booster: _______________
```

---

### Step 5: Configure Automation Engine (15 minutes)

#### Environment Variables
- [ ] **5.1** Navigate to automation engine:
  ```bash
  cd /Users/yogs87/Downloads/sanity/projects/lead-generation/automation-engine
  ```

- [ ] **5.2** Open `.env` file (or create if doesn't exist)

- [ ] **5.3** Add PhantomBuster API key:
  ```bash
  # PhantomBuster Configuration
  PHANTOMBUSTER_API_KEY=your_api_key_here
  ```

- [ ] **5.4** Verify other required variables are set:
  ```bash
  # Existing
  APIFY_API_TOKEN=...
  GOOGLE_SHEETS_CREDENTIALS=...

  # Optional
  HEYGEN_API_KEY=...
  SLACK_WEBHOOK_URL=...
  ```

#### Configuration File
- [ ] **5.5** Copy configuration template:
  ```bash
  cp config/phantombuster-config.example.js config/phantombuster-config.js
  ```

- [ ] **5.6** Open `config/phantombuster-config.js` in text editor

- [ ] **5.7** Replace placeholder agent IDs with your actual agent IDs:
  ```javascript
  // Example:
  profileScraper: {
    agentId: '1234567890abcdef', // <-- Replace with your actual ID
    // ...
  }
  ```

- [ ] **5.8** Update LinkedIn account info:
  ```javascript
  linkedinAccount: {
    type: 'DEDICATED', // or 'SALES_NAVIGATOR'
    email: 'your-automation-email@domain.com',
    warmedUp: false, // Set to true after 2 weeks
    createdDate: '2025-10-23'
  }
  ```

- [ ] **5.9** Customize connection request messages (optional)

- [ ] **5.10** Save file

---

### Step 6: Test Installation (20 minutes)

#### Simulation Mode Test
- [ ] **6.1** Install dependencies (if not already):
  ```bash
  npm install
  ```

- [ ] **6.2** Initialize data directories:
  ```bash
  npm run init
  ```

- [ ] **6.3** Run Partners workflow in simulation mode:
  ```bash
  npm run run:partners
  ```

- [ ] **6.4** Check output for errors

- [ ] **6.5** Verify simulated results:
  ```bash
  npm run status
  cat data/leads/partners_leads.json | head -20
  ```

#### Live Mode Test (Small Batch)
- [ ] **6.6** Edit `config/phantombuster-config.js`:
  ```javascript
  // Temporarily set small batch size for testing
  profileScraper: {
    // ...
    argument: {
      numberOfProfilesPerLaunch: 5, // Small test batch
      // ...
    }
  }
  ```

- [ ] **6.7** Create test spreadsheet in Google Sheets with 5 LinkedIn URLs

- [ ] **6.8** Run in live mode:
  ```bash
  npm run run:partners -- --live
  ```

- [ ] **6.9** Monitor PhantomBuster dashboard for agent execution

- [ ] **6.10** Verify results:
  - [ ] Check execution time used
  - [ ] Verify data quality
  - [ ] Check email discovery rate

- [ ] **6.11** If successful, restore normal batch sizes in config

---

### Step 7: LinkedIn Account Warmup (2 weeks)

⚠️ **DO NOT skip this step! Account bans are permanent.**

#### Week 1: Manual Activity Only
- [ ] **7.1** Day 1-2: Visit 20 profiles manually
- [ ] **7.2** Day 3-4: Send 5 connection requests manually
- [ ] **7.3** Day 5-7: Post 1-2 updates, comment on 3-5 posts

#### Week 2: Gradual Automation
- [ ] **7.4** Day 8-9: Run Profile Visitor phantom (20 visits/day)
- [ ] **7.5** Day 10-11: Add 10 connection requests via Network Booster
- [ ] **7.6** Day 12-14: Increase to 15 connections/day, 50 visits/day

#### Post-Warmup
- [ ] **7.7** Day 15+: Full automation at safe limits
- [ ] **7.8** Update config: `warmedUp: true`

**Monitor for:**
- [ ] LinkedIn warning emails
- [ ] Reduced connection acceptance rate
- [ ] Login challenges (CAPTCHAs)
- [ ] Account restrictions

**If warnings occur:**
- [ ] Immediately pause all automation
- [ ] Switch to manual activity only for 1 week
- [ ] Reduce daily limits by 50%
- [ ] Resume gradually

---

### Step 8: Production Launch (Week 3-4)

#### Week 3: Pilot Campaign
- [ ] **8.1** Partners segment: 50 leads
  - [ ] Profile scraping
  - [ ] Email discovery
  - [ ] 20 connection requests

- [ ] **8.2** Monitor metrics:
  - [ ] Email discovery rate (target: 60%)
  - [ ] Connection acceptance (target: 40-50%)
  - [ ] Execution time usage
  - [ ] No LinkedIn warnings

- [ ] **8.3** Optimize based on results:
  - [ ] A/B test connection messages
  - [ ] Adjust daily limits
  - [ ] Refine lead scoring

#### Week 4: Full Scale
- [ ] **8.4** Launch all segments:
  - [ ] Partners: 500 leads
  - [ ] HNI: 2,000 leads
  - [ ] UHNI: 200 leads (manual + soft automation)
  - [ ] Mass Affluent: 5,000 leads

- [ ] **8.5** Set up monitoring:
  - [ ] Weekly execution time reports
  - [ ] Connection acceptance tracking
  - [ ] Email deliverability monitoring
  - [ ] ROI dashboard

---

## ✅ Post-Setup Verification

### Technical Verification
- [ ] PhantomBuster API key works (test in simulation mode)
- [ ] All agent IDs are correct
- [ ] Configuration file has no syntax errors
- [ ] Environment variables loaded correctly
- [ ] Workflow executes without errors

### Account Verification
- [ ] LinkedIn account aged for 2 weeks
- [ ] 50+ connections established
- [ ] Profile appears professional
- [ ] No restrictions or warnings
- [ ] Sales Navigator configured (if applicable)

### PhantomBuster Verification
- [ ] All phantoms created (10-12 total)
- [ ] Agent IDs copied to config
- [ ] Test runs successful (5 profiles)
- [ ] Results appear in dashboard
- [ ] Execution time tracked correctly

### Integration Verification
- [ ] PhantomBuster node registered in orchestrator
- [ ] Workflow includes PhantomBuster nodes
- [ ] Simulation mode generates realistic data
- [ ] Live mode calls PhantomBuster API
- [ ] Results saved to data directory

---

## 📊 Success Metrics

### Week 1 Targets
- [ ] 50 profiles scraped
- [ ] 30+ emails discovered (60% rate)
- [ ] 20 connection requests sent
- [ ] 8-10 connections accepted (40-50% rate)
- [ ] <2 hours execution time used

### Month 1 Targets
- [ ] 1,000 profiles scraped (all segments)
- [ ] 600+ emails discovered
- [ ] 200 connection requests sent
- [ ] 80-100 connections accepted
- [ ] <10 hours execution time used
- [ ] No LinkedIn warnings

---

## 🆘 Troubleshooting

### PhantomBuster Issues
- **Error: "Invalid API key"**
  - [ ] Verify API key in .env file
  - [ ] Check for extra spaces/newlines
  - [ ] Regenerate API key in PhantomBuster dashboard

- **Error: "Agent not found"**
  - [ ] Verify agent ID is correct
  - [ ] Check agent exists in dashboard
  - [ ] Ensure agent is not deleted

- **Low execution success rate**
  - [ ] Check LinkedIn account is logged in
  - [ ] Verify input data format
  - [ ] Reduce batch sizes
  - [ ] Enable residential proxies

### LinkedIn Issues
- **Connection requests not accepted**
  - [ ] Improve personalization
  - [ ] Target more relevant leads
  - [ ] Check profile completeness
  - [ ] Reduce daily limits

- **Account warnings/restrictions**
  - [ ] Stop all automation immediately
  - [ ] Switch to manual activity
  - [ ] Wait 1-2 weeks
  - [ ] Resume at 50% limits

- **CAPTCHA challenges**
  - [ ] Normal during warmup
  - [ ] Complete manually
  - [ ] Reduce automation frequency
  - [ ] Space out launches

---

## 📚 Documentation Reference

- **Comprehensive Guide**: `04_PHANTOMBUSTER_INTEGRATION_GUIDE.md`
- **Quick Start**: `README_PHANTOMBUSTER.md`
- **Integration Summary**: `PHANTOMBUSTER_INTEGRATION_SUMMARY.md`
- **This Checklist**: `PHANTOMBUSTER_SETUP_CHECKLIST.md`

---

## 💰 Cost Tracking

### Monthly Budget
- [ ] PhantomBuster Pro: $149/month
- [ ] Apify Pro: $49/month (existing)
- [ ] Sales Navigator: $99/month (optional)
- [ ] **Total**: $198-297/month

### Execution Time Tracking
- [ ] Week 1: _____ hours used
- [ ] Week 2: _____ hours used
- [ ] Week 3: _____ hours used
- [ ] Week 4: _____ hours used
- [ ] **Month Total**: _____ / 80 hours (Pro plan limit)

### ROI Tracking
- [ ] Leads generated: _____
- [ ] Emails discovered: _____
- [ ] Connections made: _____
- [ ] Discovery calls booked: _____
- [ ] Deals closed: _____
- [ ] Revenue generated: ₹_____ Cr

---

## 🎯 Final Checklist

Before going live, ensure:
- [ ] PhantomBuster Pro account active
- [ ] Dedicated LinkedIn account created and aged (2+ weeks)
- [ ] All 10-12 phantoms configured
- [ ] Agent IDs saved in config file
- [ ] API key set in environment variables
- [ ] Test run successful (5 profiles)
- [ ] Daily limits configured (20-30 connections max)
- [ ] Personalized messages written
- [ ] Monitoring dashboard set up
- [ ] Team trained on usage and safety

**Estimated Total Setup Time**: 2-3 hours + 2 weeks aging

**Status**: ___ / ___ items complete

**Ready for Production?** Yes / No

**Launch Date**: ______________

---

**Good luck with your PhantomBuster integration!** 🚀

For support, refer to the documentation or contact the automation team.
