# n8n Workflows - PL Capital Lead Generation

**Purpose**: Automated workflows for lead scraping, enrichment, and outreach

---

## 📁 Workflows Overview

### 1. Partners Lead Scraping (`01_PARTNERS_LEAD_SCRAPING.json`)
**Purpose**: Scrape and qualify IFA/Wealth Manager leads
**Frequency**: Weekly or on-demand
**Target**: 500 partner leads

**Flow**:
1. Define LinkedIn search queries (5 variations)
2. Scrape via Apify `code_crafter/leads-finder`
3. Wait for scraping completion (3 minutes)
4. Retrieve scraped data
5. Score leads (0-100 point system)
6. Filter qualified leads (score ≥60)
7. Save to Google Sheets
8. Notify team on Slack for hot leads (score ≥80)
9. Send summary report

**Output**:
- Google Sheet: `Partners_Leads` (all qualified leads)
- Slack notifications for hot leads
- Summary metrics

---

### 2. HNI Lead Scraping (`02_HNI_LEAD_SCRAPING.json`)
**Purpose**: Scrape and engage HNI prospects
**Frequency**: Weekly or on-demand
**Target**: 2,000 HNI leads

**Flow**:
1. Define HNI LinkedIn queries (6 variations)
2. Scrape via Apify (350 leads per query)
3. Wait for scraping completion (4 minutes)
4. Retrieve and score leads
5. Filter qualified leads (score ≥60)
6. Save to Google Sheets
7. For hot leads (score ≥80):
   - Generate personalized HeyGen video
   - Send personalized email with video
8. Send summary to Slack

**Output**:
- Google Sheet: `HNI_Leads` (all qualified)
- Personalized videos for hot leads
- Email outreach initiated
- Summary metrics

---

### 3. Email Outreach Sequence (`03_EMAIL_OUTREACH_SEQUENCE.json`)
**Purpose**: 5-touch email nurture campaign for warm HNI leads
**Frequency**: Triggered for warm leads (score 60-79)
**Duration**: 19 days (5 emails)

**Sequence**:
1. **Email 1 (Day 0)**: Value proposition + AQUA case study CTA
2. **Email 2 (Day 3)**: Educational - 3 core principles
3. **Email 3 (Day 7)**: Social proof - Client success story
4. **Email 4 (Day 12)**: Objection handling - Fees ROI analysis
5. **Email 5 (Day 19)**: Final CTA - Personal invitation

**Flow**:
1. Get warm HNI leads from Google Sheets
2. Send Email 1 → Wait 3 days
3. Send Email 2 → Wait 4 days
4. Send Email 3 → Wait 5 days
5. Send Email 4 → Wait 7 days
6. Send Email 5
7. Update lead status in Google Sheets
8. Notify team on completion

**Output**:
- 5 emails sent per lead
- Lead status updated (sequence completed)
- Slack notification per completed sequence

---

## 🚀 Setup Instructions

### Prerequisites

**Required Accounts**:
- n8n (self-hosted or cloud)
- Apify (API key)
- Google Sheets (OAuth)
- Gmail/SMTP (for email sending)
- Slack (OAuth, optional)
- HeyGen (API key, for HNI workflow)

### Step 1: Import Workflows

1. Open n8n dashboard
2. Go to **Workflows** → **Import from File**
3. Upload each JSON file:
   - `01_PARTNERS_LEAD_SCRAPING.json`
   - `02_HNI_LEAD_SCRAPING.json`
   - `03_EMAIL_OUTREACH_SEQUENCE.json`

### Step 2: Configure Credentials

**Apify API Key**:
1. Go to Apify → Settings → API Token
2. Copy token
3. n8n → Credentials → Add Credential → HTTP Header Auth
4. Name: `Apify API Key`
5. Header Name: `Authorization`
6. Header Value: `Bearer YOUR_APIFY_TOKEN`

**Google Sheets OAuth**:
1. n8n → Credentials → Add → Google Sheets OAuth2
2. Follow OAuth flow
3. Grant permissions

**SMTP/Gmail**:
1. n8n → Credentials → Add → SMTP
2. Host: `smtp.gmail.com` (or your SMTP server)
3. Port: `587`
4. Username: Your email
5. Password: App password (not regular password)

**Slack OAuth** (Optional):
1. Create Slack app at api.slack.com
2. Add OAuth scopes: `chat:write`, `channels:read`
3. Install app to workspace
4. Copy OAuth token
5. n8n → Credentials → Add → Slack OAuth2
6. Paste token

**HeyGen API** (For HNI workflow):
1. Get API key from HeyGen dashboard
2. n8n → Credentials → Add → Generic Credential
3. Name: `HeyGen API`
4. Add header: `X-Api-Key: YOUR_HEYGEN_KEY`

### Step 3: Configure Google Sheets

**Create Lead Database**:
1. Create new Google Sheet: "PL Capital Leads"
2. Create sheets:
   - `Partners_Leads`
   - `HNI_Leads`
   - `UHNI_Leads`
   - `Mass_Affluent_Leads`

**Column Headers** (for each sheet):
```
name | title | company | email | phone | linkedinUrl | website | location |
education | leadScore | leadTier | scrapedDate | emailSequenceStarted |
emailSequenceCompleted | lastEmailSent | notes
```

3. Get Sheet ID from URL:
   `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

4. Replace `YOUR_GOOGLE_SHEET_ID` in workflows with actual ID

### Step 4: Configure Slack Channel (Optional)

1. Create channel: `#lead-gen-notifications`
2. Get channel ID (right-click channel → View channel details)
3. Replace `YOUR_SLACK_CHANNEL_ID` in workflows

### Step 5: Test Workflows

**Test Partners Workflow**:
1. Open `01_PARTNERS_LEAD_SCRAPING`
2. Click **Execute Workflow**
3. Monitor each node execution
4. Verify leads appear in Google Sheets
5. Check Slack notification

**Test HNI Workflow**:
1. Open `02_HNI_LEAD_SCRAPING`
2. Reduce `maxResults` to 10 (for testing)
3. Execute workflow
4. Verify video generation (hot leads)
5. Check email sent

**Test Email Sequence**:
1. Add test lead to Google Sheets (leadTier: Warm)
2. Open `03_EMAIL_OUTREACH_SEQUENCE`
3. Execute workflow
4. Verify Email 1 sent
5. (Optional) Reduce wait times for testing

---

## 📊 Workflow Triggers

### Manual Trigger
- Execute on-demand from n8n dashboard
- Use for testing or ad-hoc scraping

### Scheduled Trigger (Recommended)

**Add to each workflow**:
1. Click **Add Node** → **Trigger** → **Schedule Trigger**
2. Configure schedule:

**Partners Workflow**:
- Frequency: Weekly
- Day: Monday
- Time: 9:00 AM

**HNI Workflow**:
- Frequency: Weekly
- Day: Tuesday
- Time: 9:00 AM

**Email Sequence**:
- Frequency: Daily
- Time: 10:00 AM (checks for new warm leads)

### Webhook Trigger (Advanced)

**Add webhook for external triggers**:
1. Add Node → Trigger → Webhook
2. Method: POST
3. Path: `/trigger-lead-scraping`
4. Use webhook URL to trigger from external systems

---

## 🎯 Customization Guide

### Modify Scoring Logic

**Location**: Code node "Score [Segment] Leads"

**Example - Add industry bonus**:
```javascript
// Add 10 points for preferred industries
if (lead.industry?.match(/Technology|Healthcare|FMCG/i)) {
  score += 10;
}
```

### Modify Email Content

**Location**: Email nodes (Email 1, Email 2, etc.)

**Personalization tokens**:
- `{{ $json.name }}` - Full name
- `{{ $json.name.split(' ')[0] }}` - First name
- `{{ $json.title }}` - Job title
- `{{ $json.company }}` - Company name
- `{{ $json.location }}` - Location

### Add Custom Fields

**In Google Sheets**:
1. Add column (e.g., "Industry")
2. Update "Save to Google Sheets" node mapping
3. Add to scoring logic if needed

### Change Lead Tiers

**Current tiers**:
- Hot: 80-100
- Warm: 60-79
- Cold: 40-59

**To change**:
```javascript
// Modify in scoring node
leadTier: score >= 85 ? 'Hot' : score >= 65 ? 'Warm' : 'Cold'
```

---

## 🔍 Monitoring & Analytics

### Workflow Execution History

**View executions**:
1. n8n → Executions
2. Filter by workflow
3. Review success/failure
4. Debug failed executions

### Google Sheets Dashboard

**Create summary sheet**:
```
=QUERY(Partners_Leads!A:K, "SELECT COUNT(A), AVG(I), COUNTIF(J, 'Hot'), COUNTIF(J, 'Warm') WHERE A IS NOT NULL")
```

**Metrics to track**:
- Total leads scraped
- Average lead score
- Hot/Warm/Cold distribution
- Email open rates (if tracking pixels added)
- Consultation bookings

### Slack Reports

**Daily summary** (add to workflows):
```javascript
// Calculate daily metrics
const today = new Date().toDateString();
const leadsToday = items.filter(item =>
  new Date(item.json.scrapedDate).toDateString() === today
).length;

// Send to Slack
```

---

## 💰 Cost Optimization

### Apify Credits

**Per workflow run**:
- Partners (500 leads): ~$0.75
- HNI (2000 leads): ~$3.00
- Total weekly: ~$3.75

**Monthly total**: ~$15

**Optimization tips**:
1. Use tiered pricing (GOLD tier if >50K results/month)
2. Batch requests (run weekly, not daily)
3. Filter early (reduce unnecessary enrichment)

### HeyGen Credits

**Per video**: ~1 credit (~$3.33)
**Hot HNI leads/week**: ~10-20 videos
**Monthly cost**: $100-200

**Optimization**:
- Generate videos only for score ≥85 (very hot)
- Reuse template videos for warm leads

### Email Sending

**Free tier limits**:
- Gmail: 500 emails/day
- SMTP: Varies by provider

**If exceeding**:
- Use Lemlist ($50/month, unlimited)
- Or SendGrid (pay-as-you-go)

---

## 🚨 Troubleshooting

### Common Issues

**Issue**: Apify scraping fails
**Solution**:
- Check API key validity
- Verify Apify credits available
- Reduce `maxResults` if timeout

**Issue**: Google Sheets update fails
**Solution**:
- Re-authenticate OAuth
- Check sheet ID is correct
- Verify column names match exactly

**Issue**: Email not sending
**Solution**:
- Check SMTP credentials
- Enable "Less secure apps" (Gmail)
- Verify email address format

**Issue**: HeyGen video generation fails
**Solution**:
- Check API key
- Verify avatar_id and voice_id
- Reduce script length (<5000 chars)

**Issue**: Wait nodes not working
**Solution**:
- Check n8n queue mode enabled
- Verify workflow execution hasn't timed out
- Use webhook trigger for long sequences

---

## 🔄 Maintenance Schedule

### Weekly
- [ ] Review execution logs
- [ ] Check lead quality (sample 10 leads)
- [ ] Monitor Apify credit usage
- [ ] Verify email deliverability

### Monthly
- [ ] Audit scoring model (adjust thresholds)
- [ ] A/B test email templates
- [ ] Update LinkedIn search queries
- [ ] Review conversion rates

### Quarterly
- [ ] Refine ICP based on closed deals
- [ ] Update email sequences
- [ ] Optimize workflow performance
- [ ] Add new data sources

---

## 📈 Success Metrics

### Lead Generation KPIs
- Total leads scraped: 7,700/month (target)
- Qualified leads (score >60): 5,000/month
- Hot leads (score >80): 500/month
- Email deliverability: >95%
- Data completeness: >90%

### Outreach Performance KPIs
- Email open rate: 35-45%
- Click-through rate: 10-20%
- Reply rate: 8-15%
- Consultation bookings: 5-10%

### Conversion KPIs
- Partners: 25 partnerships (Year 1)
- HNIs: 40 clients (Year 1)
- Total AUM: ₹320 Cr (Year 1)

---

## 🎯 Next Steps

### Immediate (This Week)
1. [ ] Import all 3 workflows
2. [ ] Configure credentials
3. [ ] Set up Google Sheets
4. [ ] Run test executions
5. [ ] Schedule weekly runs

### Short-term (Next 2 Weeks)
6. [ ] Add UHNI scraping workflow
7. [ ] Add Mass Affluent workflow
8. [ ] Integrate with CRM (HubSpot/Zoho)
9. [ ] Set up email tracking (open/click rates)
10. [ ] Create analytics dashboard

### Long-term (Next Month)
11. [ ] A/B test email variations
12. [ ] Add LinkedIn connection automation
13. [ ] Build lead scoring ML model
14. [ ] Integrate with WhatsApp (for hot leads)
15. [ ] Add phone call automation (Twilio)

---

## 📞 Support

**n8n Documentation**: https://docs.n8n.io
**Apify Docs**: https://docs.apify.com
**Community Forum**: https://community.n8n.io

**For PL Capital Team**:
- Technical Issues: Marketing Ops Lead
- Strategy Questions: Marketing Manager
- Workflow Customization: Request via Slack

---

## 🔒 Security & Compliance

### Data Privacy
- All lead data encrypted in transit
- Google Sheets access restricted to team
- Regular data cleanup (delete after 2 years if no engagement)
- GDPR/privacy compliance (opt-out mechanism in emails)

### Email Compliance
- Include unsubscribe link in all emails
- Honor opt-out requests within 48 hours
- Include physical address (SEBI requirement)
- Add disclaimer to all emails

### LinkedIn ToS
- Stay within rate limits (<100 profiles/day per workflow)
- Use residential proxies (Apify default)
- Don't scrape from personal accounts
- Follow Apify best practices

---

## Document Control

**Version**: 1.0
**Created**: 2025-10-03
**Owner**: Marketing Ops Team
**Last Updated**: 2025-10-03

---

*These workflows automate the entire lead generation funnel - from scraping to qualification to personalized outreach - enabling PL Capital to reach 7,700 prospects with minimal manual effort.*
