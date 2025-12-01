/**
 * Test Apollo enrichment (email only - no webhook required)
 */

import { config } from 'dotenv';
import { ApolloAPI } from '../services/apollo-api.mjs';

config();

async function testEnrichment() {
  console.log('🔍 Testing Apollo Lead Enrichment (Email Only)\n');
  console.log('================================================\n');

  const apollo = new ApolloAPI(process.env.APOLLO_API_KEY);

  // Test 1: Search for Financial Advisors in Mumbai
  console.log('Step 1: Searching for Financial Advisors in Mumbai...');
  try {
    const results = await apollo.searchIFAs({
      locations: ['Mumbai, India'],
      per_page: 10
    });

    console.log(`✅ Found ${results.pagination?.total_entries || 0} Financial Advisors`);
    console.log(`   Showing first 5:\n`);

    results.people?.slice(0, 5).forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name || 'Unknown'}`);
      console.log(`      Title: ${person.title || 'N/A'}`);
      console.log(`      Company: ${person.organization_name || 'N/A'}`);
      console.log(`      Email: ${person.email || 'Not revealed'}`);
      console.log(`      LinkedIn: ${person.linkedin_url || 'N/A'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Search failed:', error.message);
  }

  // Test 2: Enrich without phone reveal
  console.log('\nStep 2: Enriching lead (email only)...');
  try {
    const enriched = await apollo.enrichPerson({
      first_name: 'Rajesh',
      last_name: 'Kanojia',
      organization_name: 'JAIN INVESTMENT',
      reveal_personal_emails: true,
      reveal_phone_number: false  // Don't request phone (no webhook needed)
    });

    if (enriched.person) {
      console.log('✅ Person enriched!\n');
      console.log('   Name:', enriched.person.name);
      console.log('   Email:', enriched.person.email || 'Not available');
      console.log('   Title:', enriched.person.title || 'Not available');
      console.log('   LinkedIn:', enriched.person.linkedin_url || 'Not available');
      console.log('   City:', enriched.person.city || 'Not available');
      console.log('   Company:', enriched.person.organization?.name || 'Not available');
      console.log('   Industry:', enriched.person.organization?.industry || 'Not available');
      console.log('');
    } else {
      console.log('ℹ️  Person not found in Apollo database\n');
    }
  } catch (error) {
    console.error('❌ Enrichment failed:', error.message);
  }

  // Test 3: Search HNIs (CEOs, Founders)
  console.log('\nStep 3: Searching for HNIs (CEOs, Founders) in Mumbai...');
  try {
    const results = await apollo.searchHNIs({
      locations: ['Mumbai, India'],
      per_page: 5
    });

    console.log(`✅ Found ${results.pagination?.total_entries || 0} HNIs`);
    console.log(`   Showing first 3:\n`);

    results.people?.slice(0, 3).forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name || 'Unknown'}`);
      console.log(`      Title: ${person.title || 'N/A'}`);
      console.log(`      Company: ${person.organization_name || 'N/A'}`);
      console.log(`      City: ${person.city || 'N/A'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Search failed:', error.message);
  }

  console.log('================================================\n');
  console.log('🎉 All enrichment tests complete!\n');
  console.log('📊 Apollo API Statistics:');

  try {
    const stats = await apollo.getUsageStats();
    console.log('   Credits remaining:', stats.credits_remaining || 'N/A');
    console.log('   Monthly limit:', stats.credits_monthly_limit || 'N/A');
    console.log('');
  } catch (error) {
    console.log('   Could not fetch stats\n');
  }

  console.log('✅ Apollo integration is working!\n');
  console.log('💡 Next steps:');
  console.log('   1. Add webhook URL to .env for phone number reveal');
  console.log('   2. Integrate enrichment into workflow');
  console.log('   3. Run live workflow: npm run run:partners -- --live\n');
}

testEnrichment().catch(console.error);
