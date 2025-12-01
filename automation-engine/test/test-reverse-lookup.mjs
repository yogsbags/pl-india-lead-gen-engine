/**
 * Test Apollo Reverse Lookup APIs
 *
 * Usage:
 *   node test/test-reverse-lookup.mjs
 *
 * Required: APOLLO_API_KEY environment variable
 */

import { config } from 'dotenv';
import { ApolloAPI } from '../services/apollo-api.mjs';

config();

async function testReverseLookup() {
  console.log('='.repeat(60));
  console.log('Apollo Reverse Lookup Test Suite');
  console.log('='.repeat(60));

  if (!process.env.APOLLO_API_KEY) {
    console.error('\n❌ Error: APOLLO_API_KEY not set in environment');
    console.log('\nSet it in .env file or run:');
    console.log('  export APOLLO_API_KEY=your_api_key_here\n');
    process.exit(1);
  }

  const apollo = new ApolloAPI(process.env.APOLLO_API_KEY);

  // Test 1: Lookup by LinkedIn URL
  console.log('\n📋 Test 1: Lookup by LinkedIn URL');
  console.log('-'.repeat(40));
  try {
    const result = await apollo.lookupByLinkedIn('https://linkedin.com/in/satlohar');
    if (result.person) {
      console.log('✅ Found:', result.person.name);
      console.log('   Email:', result.person.email || 'N/A');
      console.log('   Title:', result.person.title || 'N/A');
      console.log('   Company:', result.person.organization?.name || 'N/A');
    } else {
      console.log('ℹ️  No match found');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: Lookup by Email
  console.log('\n📋 Test 2: Lookup by Email');
  console.log('-'.repeat(40));
  try {
    const result = await apollo.lookupByEmail('test@example.com');
    if (result.person) {
      console.log('✅ Found:', result.person.name);
      console.log('   LinkedIn:', result.person.linkedin_url || 'N/A');
      console.log('   Phone:', result.person.phone_numbers?.[0]?.sanitized_number || 'N/A');
    } else {
      console.log('ℹ️  No match found (expected for test email)');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Lookup by Name + Company
  console.log('\n📋 Test 3: Lookup by Name + Company');
  console.log('-'.repeat(40));
  try {
    const result = await apollo.lookupByNameAndCompany('Sundar', 'Pichai', 'google.com');
    if (result.person) {
      console.log('✅ Found:', result.person.name);
      console.log('   Email:', result.person.email || 'N/A');
      console.log('   Title:', result.person.title || 'N/A');
    } else {
      console.log('ℹ️  No match found');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Find People at Company
  console.log('\n📋 Test 4: Find People at Company (Domain)');
  console.log('-'.repeat(40));
  try {
    const result = await apollo.findPeopleAtCompany('zerodha.com', { limit: 5 });
    console.log(`✅ Found ${result.pagination?.total_entries || 0} people at Zerodha`);
    if (result.people?.length) {
      console.log('\n   Top 5 results:');
      result.people.slice(0, 5).forEach((person, idx) => {
        console.log(`   ${idx + 1}. ${person.name} - ${person.title || 'N/A'}`);
      });
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 5: Find Decision Makers
  console.log('\n📋 Test 5: Find Decision Makers at Company');
  console.log('-'.repeat(40));
  try {
    const result = await apollo.findDecisionMakers('groww.in', { limit: 5 });
    console.log(`✅ Found ${result.pagination?.total_entries || 0} decision makers at Groww`);
    if (result.people?.length) {
      console.log('\n   Decision makers:');
      result.people.slice(0, 5).forEach((person, idx) => {
        console.log(`   ${idx + 1}. ${person.name} - ${person.title || 'N/A'} (${person.seniority || 'N/A'})`);
      });
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 6: Lookup Company
  console.log('\n📋 Test 6: Lookup Company by Domain');
  console.log('-'.repeat(40));
  try {
    const result = await apollo.lookupCompany('reliance.com');
    if (result.organization) {
      const org = result.organization;
      console.log('✅ Found:', org.name);
      console.log('   Industry:', org.industry || 'N/A');
      console.log('   Employees:', org.estimated_num_employees || 'N/A');
      console.log('   Revenue:', org.estimated_annual_revenue || 'N/A');
      console.log('   Location:', `${org.city || ''}, ${org.country || ''}`.trim() || 'N/A');
    } else {
      console.log('ℹ️  No company found');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 7: Generic Reverse Lookup
  console.log('\n📋 Test 7: Generic Reverse Lookup (multiple identifiers)');
  console.log('-'.repeat(40));
  try {
    const result = await apollo.reverseLookup({
      first_name: 'Nithin',
      last_name: 'Kamath',
      organization_name: 'Zerodha'
    });
    if (result.person) {
      console.log('✅ Found:', result.person.name);
      console.log('   Email:', result.person.email || 'N/A');
      console.log('   LinkedIn:', result.person.linkedin_url || 'N/A');
      console.log('   Phone:', result.person.phone_numbers?.[0]?.sanitized_number || 'N/A');
    } else {
      console.log('ℹ️  No match found');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test Suite Complete');
  console.log('='.repeat(60) + '\n');
}

testReverseLookup().catch(console.error);
