/**
 * Enrich phone numbers using Apollo API
 *
 * Note: Apollo typically doesn't support reverse phone lookup directly.
 * This script attempts enrichment and provides alternative approaches.
 */

import { config } from 'dotenv';
import { ApolloAPI } from '../services/apollo-api.mjs';

config();

const phoneNumbers = [
  '9664140840',
  '9892405520',
  '9867676224',
  '9987558069',
  '9833355585',
  '8879771257',
  '9930998698',
  '8884568885',
  '9967952793'
];

// Format Indian phone numbers
function formatIndianPhone(phone) {
  // Remove any non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Add +91 prefix if not present
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }

  return `+91${cleaned}`;
}

async function enrichPhoneNumbers() {
  console.log('📞 Phone Number Enrichment Tool\n');
  console.log('================================================\n');
  console.log(`Total numbers to enrich: ${phoneNumbers.length}\n`);

  if (!process.env.APOLLO_API_KEY) {
    console.log('❌ Error: APOLLO_API_KEY not found in .env file\n');
    console.log('Please add your Apollo API key to the .env file:\n');
    console.log('APOLLO_API_KEY=your_apollo_api_key_here\n');
    return;
  }

  const apollo = new ApolloAPI(process.env.APOLLO_API_KEY);
  const results = [];

  console.log('🔍 Attempting to enrich phone numbers...\n');
  console.log('Note: Apollo API primarily supports forward enrichment (email/name → phone)');
  console.log('Reverse lookup (phone → person) has limited support.\n');

  for (const phone of phoneNumbers) {
    const formattedPhone = formatIndianPhone(phone);
    console.log(`\n📱 Processing: ${phone} (${formattedPhone})`);

    try {
      // Attempt 1: Try direct phone enrichment (may not be supported)
      const result = await apollo.enrichPerson({
        phone_number: formattedPhone,
        reveal_personal_emails: true,
        reveal_phone_number: true
      });

      if (result.person) {
        console.log('✅ Found person!');
        console.log(`   Name: ${result.person.name || 'N/A'}`);
        console.log(`   Email: ${result.person.email || 'N/A'}`);
        console.log(`   Title: ${result.person.title || 'N/A'}`);
        console.log(`   Company: ${result.person.organization?.name || 'N/A'}`);
        console.log(`   LinkedIn: ${result.person.linkedin_url || 'N/A'}`);

        results.push({
          phone: formattedPhone,
          status: 'success',
          data: result.person
        });
      } else {
        console.log('ℹ️  No data found');
        results.push({
          phone: formattedPhone,
          status: 'not_found',
          data: null
        });
      }
    } catch (error) {
      console.log(`⚠️  Error: ${error.message}`);

      if (error.message.includes('phone_number') || error.message.includes('not supported')) {
        console.log('   → Apollo may not support phone-based lookup');
      }

      results.push({
        phone: formattedPhone,
        status: 'error',
        error: error.message
      });
    }

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  // Summary
  console.log('\n\n================================================');
  console.log('📊 ENRICHMENT SUMMARY\n');

  const successful = results.filter(r => r.status === 'success');
  const notFound = results.filter(r => r.status === 'not_found');
  const errors = results.filter(r => r.status === 'error');

  console.log(`✅ Successfully enriched: ${successful.length}`);
  console.log(`ℹ️  Not found: ${notFound.length}`);
  console.log(`❌ Errors: ${errors.length}`);

  if (successful.length > 0) {
    console.log('\n✅ ENRICHED CONTACTS:\n');
    successful.forEach(({ phone, data }) => {
      console.log(`📱 ${phone}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Company: ${data.organization?.name || 'N/A'}`);
      console.log('');
    });
  }

  // Alternative suggestions
  if (notFound.length > 0 || errors.length > 0) {
    console.log('\n💡 ALTERNATIVE APPROACHES FOR PHONE ENRICHMENT:\n');

    console.log('1. Truecaller API (Best for Indian numbers)');
    console.log('   - Website: https://www.truecaller.com/business');
    console.log('   - Pricing: Pay per lookup');
    console.log('   - Data: Name, location, spam score\n');

    console.log('2. People Data Labs');
    console.log('   - Website: https://www.peopledatalabs.com');
    console.log('   - API: Phone → Person enrichment');
    console.log('   - Pricing: $0.01-0.05 per record\n');

    console.log('3. RocketReach');
    console.log('   - Website: https://rocketreach.co');
    console.log('   - API: Reverse phone lookup');
    console.log('   - Pricing: Credits-based\n');

    console.log('4. Clearbit Enrichment');
    console.log('   - Website: https://clearbit.com');
    console.log('   - API: Phone enrichment');
    console.log('   - Pricing: Enterprise\n');

    console.log('5. Manual LinkedIn Search');
    console.log('   - Search phone number on LinkedIn');
    console.log('   - Use Google: "9664140840 site:linkedin.com"');
    console.log('   - Then enrich with Apollo using LinkedIn URL\n');

    console.log('6. Use Apollo with Other Data');
    console.log('   - If you have email/name/company for these contacts');
    console.log('   - Use Apollo to validate the phone numbers');
    console.log('   - Forward enrichment works better\n');
  }

  // Export results
  console.log('================================================\n');
  console.log('💾 Saving results to phone-enrichment-results.json...\n');

  const fs = await import('fs');
  fs.writeFileSync(
    'phone-enrichment-results.json',
    JSON.stringify(results, null, 2)
  );

  console.log('✅ Results saved!\n');
}

enrichPhoneNumbers().catch(console.error);
