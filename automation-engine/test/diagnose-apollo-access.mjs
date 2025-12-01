#!/usr/bin/env node

/**
 * Diagnose Apollo API Access
 *
 * Tests what endpoints are accessible with current API key
 */

import { config } from 'dotenv';
import { ApolloAPI } from '../services/apollo-api.mjs';

config();

async function diagnose() {
  console.log('🔍 Apollo API Access Diagnosis\n');
  console.log('================================================\n');

  const apiKey = process.env.APOLLO_API_KEY;
  console.log(`API Key: ${apiKey ? '✅ Found' : '❌ Missing'}`);
  console.log(`API Key: ${apiKey?.substring(0, 10)}...${apiKey?.substring(apiKey.length - 4)}\n`);

  const apollo = new ApolloAPI(apiKey);

  const tests = [
    {
      name: 'Health Check',
      test: async () => await apollo.getUsageStats()
    },
    {
      name: 'Search Contacts',
      test: async () => await apollo.searchContacts({ per_page: 1 })
    },
    {
      name: 'Email Accounts (GET /emailer_accounts)',
      test: async () => await apollo.getEmailAccounts()
    },
    {
      name: 'Email Sequences (GET /email_sequences)',
      test: async () => await apollo.getSequences()
    }
  ];

  console.log('Running API tests...\n');

  for (const { name, test } of tests) {
    console.log(`Testing: ${name}`);
    try {
      const result = await test();
      console.log(`   ✅ SUCCESS`);

      // Show useful info based on endpoint
      if (name.includes('Email Accounts')) {
        const accounts = result.emailer_accounts || [];
        console.log(`   Found ${accounts.length} email account(s):`);
        accounts.forEach(acc => {
          console.log(`      - ${acc.email} (ID: ${acc.id}, Active: ${acc.active})`);
        });
      } else if (name.includes('Email Sequences')) {
        const sequences = result.email_sequences || [];
        console.log(`   Found ${sequences.length} sequence(s):`);
        sequences.forEach(seq => {
          console.log(`      - ${seq.name} (ID: ${seq.id}, Active: ${seq.active})`);
        });
      } else if (name.includes('Health')) {
        console.log(`   Credits: ${result.credits_remaining || 'N/A'}`);
      } else if (name.includes('Contacts')) {
        console.log(`   Total contacts: ${result.pagination?.total_entries || 0}`);
      }

      console.log('');
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      console.log('');
    }
  }

  console.log('================================================\n');
  console.log('💡 Recommendations:\n');
  console.log('If Email Accounts/Sequences failed:');
  console.log('   1. Verify this is a master API key (not regular API key)');
  console.log('   2. Check Apollo dashboard has email accounts connected');
  console.log('   3. Create at least one sequence in Apollo UI');
  console.log('   4. Verify API key has permissions for sequences\n');
  console.log('Apollo Dashboard Links:');
  console.log('   - Email Accounts: https://app.apollo.io/settings/email-accounts');
  console.log('   - Sequences: https://app.apollo.io/sequences');
  console.log('   - API Settings: https://app.apollo.io/settings/integrations\n');
}

diagnose().catch(console.error);
