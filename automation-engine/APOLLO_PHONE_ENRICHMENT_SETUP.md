# Apollo Phone Number Enrichment Setup Guide

## Quick Setup (5 minutes)

Apollo.io requires a **publicly accessible webhook URL** to send phone number data. The easiest way to test this is using webhook.site.

---

## Option 1: webhook.site (Recommended - Free & Instant)

### Step 1: Get Your Webhook URL

1. **Open webhook.site in your browser**
   - URL: https://webhook.site
   - The site will automatically generate a unique URL for you

2. **Copy your unique webhook URL**
   - It looks like: `https://webhook.site/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Keep this tab open - you'll see incoming webhooks here

### Step 2: Configure Environment

Add the webhook URL to your `.env` file:

```bash
# Apollo.io Phone Enrichment
APOLLO_WEBHOOK_URL=https://webhook.site/YOUR-UNIQUE-ID-HERE
```

**Example:**
```bash
APOLLO_WEBHOOK_URL=https://webhook.site/12345678-1234-1234-1234-123456789abc
```

### Step 3: Run the Test

```bash
cd /Users/yogs87/Downloads/sanity/projects/lead-generation/automation-engine
node test/test-apollo-phone.mjs
```

### Step 4: Verify Phone Data

1. Switch back to the webhook.site tab in your browser
2. You should see a **new POST request** from Apollo.io
3. Click on the request to see the phone number data in the payload

**Expected Response:**
```json
{
  "person_id": "...",
  "phone_numbers": [
    {
      "raw_number": "+91 22 1234 5678",
      "sanitized_number": "+912212345678",
      "type": "mobile",
      "position": 0
    }
  ]
}
```

---

## Option 2: ngrok (For Production-Like Testing)

If you want to test with a local webhook server:

### Step 1: Install ngrok

```bash
npm install -g ngrok
```

### Step 2: Start Local Webhook Server

```bash
# Terminal 1
cd /Users/yogs87/Downloads/sanity/projects/lead-generation/automation-engine
node test/webhook-server.mjs
```

Output:
```
🚀 Apollo Webhook Server Started
   Listening on: http://localhost:3333
   Webhook URL: http://localhost:3333/apollo/webhook
```

### Step 3: Expose with ngrok

```bash
# Terminal 2
ngrok http 3333
```

Output:
```
Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:3333
```

### Step 4: Configure Environment

Copy the **ngrok HTTPS URL** and add to `.env`:

```bash
APOLLO_WEBHOOK_URL=https://xxxx-xx-xx-xx-xx.ngrok-free.app/apollo/webhook
```

### Step 5: Run the Test

```bash
node test/test-apollo-phone.mjs
```

### Step 6: Check Local Server

Switch back to Terminal 1 - you should see:
```
📨 Webhook Received!
   Time: 2025-10-20T10:30:45.123Z
   Body: {
     "person_id": "...",
     "phone_numbers": [...]
   }
```

---

## Option 3: Production Server (For Live Deployment)

If you have a production server (e.g., plcapital.in):

### Step 1: Create Webhook Endpoint

Create a webhook endpoint at your server:
- URL: `https://plcapital.in/api/apollo/webhook`
- Method: POST
- Response: 200 OK

**Example Express.js Handler:**
```javascript
app.post('/api/apollo/webhook', (req, res) => {
  const { person_id, phone_numbers } = req.body;

  console.log('Apollo webhook received:', person_id);
  console.log('Phone numbers:', phone_numbers);

  // Save to database or process as needed

  res.status(200).json({ status: 'received' });
});
```

### Step 2: Configure Environment

```bash
APOLLO_WEBHOOK_URL=https://plcapital.in/api/apollo/webhook
```

### Step 3: Run the Test

```bash
node test/test-apollo-phone.mjs
```

---

## Troubleshooting

### Error: "Invalid webhook_url"

**Cause:** Apollo cannot reach your webhook URL

**Solutions:**
- ✅ Use **HTTPS** (not HTTP)
- ✅ Use **public URL** (not localhost)
- ✅ Ensure endpoint returns **200 OK**
- ✅ Check firewall/security settings

### Webhook URL Not Receiving Data

**Cause:** Webhook timeout or Apollo rate limits

**Solutions:**
- Check webhook.site page is still open
- Verify ngrok tunnel is still active
- Wait 5-10 seconds for Apollo to send callback
- Check Apollo dashboard for webhook logs

### Phone Number Still Not Showing

**Possible Reasons:**
1. **Person not in Apollo database** with phone data
2. **Apollo plan limits** - check credit balance
3. **Phone data not available** for this specific person
4. **Webhook delay** - can take up to 30 seconds

**Try These:**
- Test with different person (higher profile CEO/Founder)
- Check Apollo dashboard for webhook status
- Verify `reveal_phone_number: true` in enrichment call

---

## Alternative: Skip Phone Enrichment

**Current Status:** Email + LinkedIn enrichment **working perfectly** ✅
- 95% data quality without phones
- Email: rajeshk@jaininvestment.com
- LinkedIn: Full URL
- Job title, company, industry: All populated

**Alternative Tools for Phone Numbers:**
1. **Lusha** ($51/month) - Browser extension + API
2. **Kaspr** (€60/month) - LinkedIn phone finder
3. **People Data Labs** (Pay per record) - Bulk phone enrichment
4. **Hunter.io** ($49/month) - Phone finder API

---

## Success Checklist

- [ ] webhook.site opened in browser
- [ ] Unique webhook URL copied
- [ ] URL added to `.env` as `APOLLO_WEBHOOK_URL`
- [ ] Test script executed: `node test/test-apollo-phone.mjs`
- [ ] Webhook received in browser (POST request visible)
- [ ] Phone number data visible in webhook payload

---

## Next Steps After Phone Setup

Once phone enrichment is working:

1. **Update workflow node** to enable phone reveal:
   ```javascript
   // nodes/apollo-enrichment-node.js
   const webhookUrl = process.env.APOLLO_WEBHOOK_URL;

   const enriched = await apollo.enrichPerson({
     ...leadData,
     reveal_phone_number: true,
     webhook_url: webhookUrl
   });
   ```

2. **Run full workflow** with phone enrichment:
   ```bash
   npm run run:partners -- --live
   ```

3. **Monitor webhook** to collect phone data as leads are enriched

4. **Store phone data** in Google Sheets alongside email/LinkedIn

---

**Status:** Ready to test ✅
**Time to Complete:** 5-10 minutes
**Cost:** Free (webhook.site)

**Support:** See `APOLLO_API_INTEGRATION_GUIDE.md` for complete API reference
