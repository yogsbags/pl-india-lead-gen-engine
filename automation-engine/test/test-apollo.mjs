/**
 * Apollo API Integration Tests (ES Module)
 */

import { config } from 'dotenv';
import { ApolloAPI } from '../services/apollo-api.mjs';

config();

async function runTests() {
  console.log('🧪 Apollo.io API Integration Tests\n');
  console.log('================================================\n');

  // Initialize Apollo API
  let apollo;
  try {
    apollo = new ApolloAPI(process.env.APOLLO_API_KEY);
    console.log('✅ Apollo API client initialized\n');
  } catch (error) {
    console.error('❌ Failed to initialize:', error.message);
    console.error('   Make sure APOLLO_API_KEY is set in .env\n');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  // Test 1: Usage Stats
  console.log('📊 Test 1: Get Usage Stats');
  try {
    const stats = await apollo.getUsageStats();
    console.log('   Credits remaining:', stats.credits_remaining || 'N/A');
    console.log('   Monthly limit:', stats.credits_monthly_limit || 'N/A');
    console.log('   ✅ PASS\n');
    passed++;
  } catch (error) {
    console.log('   ❌ FAIL:', error.message, '\n');
    failed++;
  }

  // Test 2: People Search
  console.log('🔍 Test 2: People Search');
  try {
    const results = await apollo.searchPeople({
      person_titles: ['CEO', 'Founder'],
      person_locations: ['Mumbai, India'],
      per_page: 10
    });
    console.log('   Total found:', results.pagination?.total_entries || 0);
    console.log('   Returned:', results.people?.length || 0, 'people');
    if (results.people?.length > 0) {
      console.log('   First:', results.people[0].name || 'Unknown');
    }
    console.log('   ✅ PASS\n');
    passed++;
  } catch (error) {
    console.log('   ❌ FAIL:', error.message, '\n');
    failed++;
  }

  // Test 3: Organization Search
  console.log('🏢 Test 3: Organization Search');
  try {
    const results = await apollo.searchOrganizations({
      q_organization_keyword_tags: ['Financial Services'],
      organization_locations: ['Mumbai, India'],
      per_page: 10
    });
    console.log('   Total found:', results.pagination?.total_entries || 0);
    console.log('   Returned:', results.organizations?.length || 0, 'companies');
    if (results.organizations?.length > 0) {
      console.log('   First:', results.organizations[0].name || 'Unknown');
    }
    console.log('   ✅ PASS\n');
    passed++;
  } catch (error) {
    console.log('   ❌ FAIL:', error.message, '\n');
    failed++;
  }

  // Test 4: Search IFAs (Helper)
  console.log('💼 Test 4: Search IFAs');
  try {
    const results = await apollo.searchIFAs({
      locations: ['Mumbai, India'],
      per_page: 10
    });
    console.log('   Total IFAs:', results.pagination?.total_entries || 0);
    console.log('   Returned:', results.people?.length || 0);
    console.log('   ✅ PASS\n');
    passed++;
  } catch (error) {
    console.log('   ❌ FAIL:', error.message, '\n');
    failed++;
  }

  // Test 5: Search HNIs (Helper)
  console.log('💎 Test 5: Search HNIs');
  try {
    const results = await apollo.searchHNIs({
      locations: ['Mumbai, India'],
      per_page: 10
    });
    console.log('   Total HNIs:', results.pagination?.total_entries || 0);
    console.log('   Returned:', results.people?.length || 0);
    console.log('   ✅ PASS\n');
    passed++;
  } catch (error) {
    console.log('   ❌ FAIL:', error.message, '\n');
    failed++;
  }

  // Summary
  console.log('================================================\n');
  console.log('📊 Test Summary\n');
  console.log(`   Total: ${passed + failed}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('❌ Some tests failed\n');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('💥 Test runner crashed:', error);
  process.exit(1);
});
