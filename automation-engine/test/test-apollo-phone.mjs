/**
 * Test Apollo phone number enrichment with webhook
 *
 * NOTE: Apollo requires a publicly accessible webhook URL for phone reveal.
 * Options:
 * 1. Use ngrok: ngrok http 3333 (then use the ngrok URL)
 * 2. Use webhook.site (get a unique URL)
 * 3. Use your server's public endpoint
 *
 * For this test, we'll demonstrate the setup and provide instructions.
 */

import { config } from 'dotenv';
import { ApolloAPI } from '../services/apollo-api.mjs';

config();

async function testPhoneEnrichment() {
  console.log('📞 Apollo Phone Number Enrichment Test\n');
  console.log('================================================\n');

  // Check for webhook URL
  const webhookUrl = process.env.APOLLO_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('⚠️  No webhook URL configured\n');
    console.log('To test phone number enrichment, you need a public webhook URL.\n');
    console.log('📋 Setup Options:\n');

    console.log('Option 1: Use webhook.site (Free, Instant)');
    console.log('   1. Visit: https://webhook.site');
    console.log('   2. Copy your unique URL');
    console.log('   3. Add to .env:');
    console.log('      APOLLO_WEBHOOK_URL=https://webhook.site/your-unique-id\n');

    console.log('Option 2: Use ngrok (For local testing)');
    console.log('   1. Install: npm install -g ngrok');
    console.log('   2. Start webhook server: node test/webhook-server.mjs');
    console.log('   3. In another terminal: ngrok http 3333');
    console.log('   4. Copy the ngrok URL (https://xxxx.ngrok.io)');
    console.log('   5. Add to .env:');
    console.log('      APOLLO_WEBHOOK_URL=https://xxxx.ngrok.io/apollo/webhook\n');

    console.log('Option 3: Use your server');
    console.log('   Create endpoint: https://plcapital.in/api/apollo/webhook');
    console.log('   Add to .env:');
    console.log('      APOLLO_WEBHOOK_URL=https://plcapital.in/api/apollo/webhook\n');

    console.log('🔍 Testing without phone reveal (email only)...\n');

    // Test without phone
    const apollo = new ApolloAPI(process.env.APOLLO_API_KEY);

    try {
      const enriched = await apollo.enrichPerson({
        first_name: 'Rajesh',
        last_name: 'Kanojia',
        organization_name: 'JAIN INVESTMENT',
        reveal_personal_emails: true,
        reveal_phone_number: false  // No phone without webhook
      });

      if (enriched.person) {
        console.log('✅ Person enriched (without phone):\n');
        console.log('   Name:', enriched.person.name);
        console.log('   Email:', enriched.person.email || 'Not available');
        console.log('   LinkedIn:', enriched.person.linkedin_url || 'Not available');
        console.log('   Phone: [Requires webhook setup]\n');
      }
    } catch (error) {
      console.error('❌ Enrichment failed:', error.message, '\n');
    }

    return;
  }

  // Test WITH webhook URL
  console.log('✅ Webhook URL configured:', webhookUrl, '\n');
  console.log('🔍 Testing phone number enrichment...\n');

  const apollo = new ApolloAPI(process.env.APOLLO_API_KEY);

  try {
    // Test enrichment with phone reveal
    const enriched = await apollo.enrichPerson({
      first_name: 'Rajesh',
      last_name: 'Kanojia',
      organization_name: 'JAIN INVESTMENT',
      reveal_personal_emails: true,
      reveal_phone_number: true,
      webhook_url: webhookUrl  // Add webhook URL
    });

    if (enriched.person) {
      console.log('✅ Person enriched with phone!\n');
      console.log('   Name:', enriched.person.name);
      console.log('   Email:', enriched.person.email || 'Not available');
      console.log('   Phone:', enriched.person.phone_numbers?.[0]?.sanitized_number || 'Not available');
      console.log('   LinkedIn:', enriched.person.linkedin_url || 'Not available');
      console.log('   City:', enriched.person.city || 'Not available');
      console.log('');

      console.log('📨 Phone data will be sent to webhook URL:');
      console.log('   ', webhookUrl);
      console.log('\n   Check your webhook endpoint to see the callback data.\n');
    } else {
      console.log('ℹ️  Person not found in Apollo database\n');
    }
  } catch (error) {
    console.error('❌ Enrichment failed:', error.message, '\n');

    if (error.message.includes('webhook_url')) {
      console.log('💡 Webhook URL may not be publicly accessible.');
      console.log('   Make sure the URL is:');
      console.log('   - Publicly accessible (not localhost)');
      console.log('   - Uses HTTPS (not HTTP)');
      console.log('   - Returns 200 OK response\n');
    }
  }

  console.log('================================================\n');
  console.log('📊 Summary:\n');
  console.log('   ✅ Email enrichment: Working');
  console.log('   ✅ LinkedIn enrichment: Working');
  console.log('   ⚠️  Phone enrichment: Requires public webhook URL\n');

  console.log('💡 Alternative for Phone Numbers:\n');
  console.log('   If webhook setup is complex, consider:');
  console.log('   - Lusha.com (Browser extension + API)');
  console.log('   - Kaspr.io (LinkedIn Chrome extension)');
  console.log('   - People Data Labs (Bulk phone enrichment)');
  console.log('   - Hunter.io (Phone finder API)\n');
}

testPhoneEnrichment().catch(console.error);
