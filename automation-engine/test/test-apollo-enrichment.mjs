/**
 * Test Apollo enrichment with sample leads
 */

import { config } from 'dotenv';
import { ApolloAPI } from '../services/apollo-api.mjs';

config();

async function testEnrichment() {
  console.log('🔍 Testing Apollo Lead Enrichment\n');
  console.log('================================================\n');

  const apollo = new ApolloAPI(process.env.APOLLO_API_KEY);

  // Test with one of the leads found in previous scraping
  console.log('📋 Test Lead: Rajesh Kanojia from JAIN INVESTMENT\n');

  console.log('Step 1: Enriching lead...');
  try {
    const enriched = await apollo.enrichPerson({
      first_name: 'Rajesh',
      last_name: 'Kanojia',
      organization_name: 'JAIN INVESTMENT',
      reveal_personal_emails: true,
      reveal_phone_number: true
    });

    if (enriched.person) {
      console.log('✅ Person found and enriched!\n');
      console.log('   Name:', enriched.person.name);
      console.log('   Email:', enriched.person.email || 'Not available');
      console.log('   Phone:', enriched.person.phone_numbers?.[0]?.sanitized_number || 'Not available');
      console.log('   Title:', enriched.person.title || 'Not available');
      console.log('   LinkedIn:', enriched.person.linkedin_url || 'Not available');
      console.log('   City:', enriched.person.city || 'Not available');
      console.log('   Company:', enriched.person.organization?.name || 'Not available');
      console.log('');
    } else {
      console.log('ℹ️  Person not found in Apollo database\n');
    }
  } catch (error) {
    console.error('❌ Enrichment failed:', error.message, '\n');
  }

  // Test bulk enrichment with multiple leads
  console.log('Step 2: Testing bulk enrichment (3 leads)...');
  const testLeads = [
    { first_name: 'Rajesh', last_name: 'Kanojia', organization_name: 'JAIN INVESTMENT' },
    { first_name: 'Salma', last_name: 'Sony', organization_name: 'Spearhead FinServe' },
    { first_name: 'John', last_name: 'Doe', organization_name: 'Example Corp' }
  ];

  try {
    const results = await apollo.bulkEnrichPeople(testLeads, true, true);

    console.log(`✅ Bulk enrichment complete: ${results.matches?.length || 0} results\n`);

    results.matches?.forEach((match, index) => {
      if (match.person) {
        console.log(`   ${index + 1}. ${match.person.name || 'Unknown'}`);
        console.log(`      Email: ${match.person.email || 'N/A'}`);
        console.log(`      Phone: ${match.person.phone_numbers?.[0]?.sanitized_number || 'N/A'}`);
        console.log('');
      } else {
        console.log(`   ${index + 1}. Not found`);
        console.log('');
      }
    });
  } catch (error) {
    console.error('❌ Bulk enrichment failed:', error.message, '\n');
  }

  console.log('================================================\n');
  console.log('🎉 Enrichment tests complete!\n');
  console.log('💡 Note: Credits were consumed for enrichment.\n');
  console.log('   Check your usage: https://app.apollo.io/#/settings/credits\n');
}

testEnrichment().catch(console.error);
