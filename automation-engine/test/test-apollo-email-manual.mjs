#!/usr/bin/env node

/**
 * Test Apollo Email Outreach with Manual IDs
 *
 * Use this when you have sequence ID and emailer account ID from Apollo dashboard
 *
 * Usage:
 *   node test/test-apollo-email-manual.mjs \
 *     --sequence-id "your-sequence-id" \
 *     --emailer-account-id "your-emailer-id" \
 *     --contact-email "yogsbags@gmail.com" \
 *     --contact-name "Yogesh Bagle"
 *
 * How to get IDs from Apollo:
 *   1. Sequence ID:
 *      - Go to https://app.apollo.io/sequences
 *      - Click on your sequence
 *      - Copy ID from URL: /sequences/{sequence_id}
 *
 *   2. Emailer Account ID:
 *      - Go to https://app.apollo.io/settings/email-accounts
 *      - Inspect network tab when page loads
 *      - Look for emailer_accounts API call
 *      - Copy the ID for yogeshb@productverse.co.in
 */

import { config } from 'dotenv';
import { ApolloAPI } from '../services/apollo-api.mjs';

config();

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg.startsWith('--') && nextArg && !nextArg.startsWith('--')) {
      const key = arg.replace('--', '').replace(/-/g, '_');
      params[key] = nextArg;
      i++;
    }
  }

  return params;
}

async function testManualOutreach() {
  console.log('📧 Apollo Email Outreach (Manual Mode)\n');
  console.log('================================================\n');

  const params = parseArgs();

  console.log('📋 Parameters:\n');
  console.log(`   Sequence ID: ${params.sequence_id || '❌ Missing'}`);
  console.log(`   Emailer Account ID: ${params.emailer_account_id || '❌ Missing'}`);
  console.log(`   Contact Email: ${params.contact_email || '❌ Missing'}`);
  console.log(`   Contact Name: ${params.contact_name || 'Not specified'}`);
  console.log('');

  // Validate required params
  if (!params.sequence_id) {
    console.error('❌ Error: --sequence-id is required\n');
    console.log('💡 Get your sequence ID from Apollo:');
    console.log('   1. Go to: https://app.apollo.io/sequences');
    console.log('   2. Click on your sequence');
    console.log('   3. Copy ID from URL\n');
    process.exit(1);
  }

  if (!params.emailer_account_id) {
    console.error('❌ Error: --emailer-account-id is required\n');
    console.log('💡 Get your emailer account ID:');
    console.log('   1. Go to: https://app.apollo.io/settings/email-accounts');
    console.log('   2. Open browser DevTools (F12)');
    console.log('   3. Go to Network tab');
    console.log('   4. Refresh page');
    console.log('   5. Find "emailer_accounts" request');
    console.log('   6. Copy ID for yogeshb@productverse.co.in\n');
    process.exit(1);
  }

  if (!params.contact_email) {
    console.error('❌ Error: --contact-email is required\n');
    process.exit(1);
  }

  const apollo = new ApolloAPI(process.env.APOLLO_API_KEY);

  try {
    // Step 1: Find or create contact
    console.log('Step 1: Finding contact in Apollo...\n');

    let contactId = null;
    const searchResult = await apollo.searchContacts({
      q_keywords: params.contact_email
    });

    if (searchResult.contacts?.length > 0) {
      const contact = searchResult.contacts[0];
      contactId = contact.id;
      console.log(`✅ Found existing contact:`);
      console.log(`   ID: ${contact.id}`);
      console.log(`   Name: ${contact.name}`);
      console.log(`   Email: ${contact.email}`);
      console.log('');
    } else {
      console.log(`ℹ️  Contact not found, creating new one...\n`);

      // Parse name
      const nameParts = (params.contact_name || params.contact_email.split('@')[0]).split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      const newContact = await apollo.createContact({
        first_name: firstName,
        last_name: lastName,
        email: params.contact_email,
        organization_name: params.company,
        title: params.title
      });

      contactId = newContact.contact.id;
      console.log(`✅ Created new contact:`);
      console.log(`   ID: ${newContact.contact.id}`);
      console.log(`   Name: ${newContact.contact.name}`);
      console.log(`   Email: ${newContact.contact.email}`);
      console.log('');
    }

    // Step 2: Add contact to sequence
    console.log('Step 2: Adding contact to sequence...\n');

    const result = await apollo.addContactsToSequence({
      sequence_id: params.sequence_id,
      contact_ids: [contactId],
      emailer_account_id: params.emailer_account_id,
      sequence_active_in_other_campaigns: 'do_nothing',
      send_email_from_email_account_id: true
    });

    console.log('✅ Success! Contact added to sequence\n');
    console.log('📨 Email Details:\n');
    console.log(`   To: ${params.contact_email}`);
    console.log(`   Contact ID: ${contactId}`);
    console.log(`   Sequence ID: ${params.sequence_id}`);
    console.log(`   Emailer ID: ${params.emailer_account_id}`);
    console.log('');
    console.log('📊 API Response:\n');
    console.log(JSON.stringify(result, null, 2));
    console.log('');

    console.log('================================================\n');
    console.log('🎉 Email outreach initiated successfully!\n');
    console.log('🔗 Next Steps:\n');
    console.log('   1. Check sequence: https://app.apollo.io/sequences');
    console.log(`   2. Verify ${params.contact_email} appears in sequence`);
    console.log('   3. Monitor email sending status\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message, '\n');

    if (error.message.includes('404')) {
      console.log('💡 Troubleshooting 404 errors:\n');
      console.log('   - Verify sequence ID is correct (check URL in Apollo)');
      console.log('   - Verify emailer account ID is correct');
      console.log('   - Make sure sequence is active');
      console.log('   - Check email account is connected\n');
    } else if (error.message.includes('403')) {
      console.log('💡 Troubleshooting 403 errors:\n');
      console.log('   - Verify API key has sequence permissions');
      console.log('   - Check if this endpoint requires master API key\n');
    }

    process.exit(1);
  }
}

testManualOutreach().catch(console.error);
