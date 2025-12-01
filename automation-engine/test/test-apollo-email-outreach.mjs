#!/usr/bin/env node

/**
 * Test Apollo Email Outreach with Command-Line Arguments
 *
 * Usage:
 *   node test/test-apollo-email-outreach.mjs --name "Yogesh Bagle" --email yogsbags@gmail.com
 *   node test/test-apollo-email-outreach.mjs --name "John Doe" --email john@example.com --sequence-id abc123
 *
 * This script:
 * 1. Searches for the contact in Apollo or creates them
 * 2. Gets available email accounts (sending mailboxes)
 * 3. Gets available sequences
 * 4. Adds contact to specified sequence with specified sending mailbox
 */

import { config } from 'dotenv';
import { ApolloAPI } from '../services/apollo-api.mjs';

config();

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    name: null,
    email: null,
    firstName: null,
    lastName: null,
    company: null,
    title: null,
    sequenceId: null,
    emailerAccountId: null,
    fromEmail: 'yogeshb@productverse.co.in', // Default sending email
    dryRun: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--name':
        params.name = nextArg;
        i++;
        break;
      case '--email':
        params.email = nextArg;
        i++;
        break;
      case '--first-name':
        params.firstName = nextArg;
        i++;
        break;
      case '--last-name':
        params.lastName = nextArg;
        i++;
        break;
      case '--company':
        params.company = nextArg;
        i++;
        break;
      case '--title':
        params.title = nextArg;
        i++;
        break;
      case '--sequence-id':
        params.sequenceId = nextArg;
        i++;
        break;
      case '--emailer-account-id':
        params.emailerAccountId = nextArg;
        i++;
        break;
      case '--from-email':
        params.fromEmail = nextArg;
        i++;
        break;
      case '--dry-run':
        params.dryRun = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
    }
  }

  // Parse name into first/last if provided
  if (params.name && !params.firstName) {
    const nameParts = params.name.split(' ');
    params.firstName = nameParts[0];
    params.lastName = nameParts.slice(1).join(' ') || nameParts[0];
  }

  return params;
}

function showHelp() {
  console.log(`
📧 Apollo Email Outreach Test

Usage:
  node test/test-apollo-email-outreach.mjs [options]

Options:
  --name "Full Name"              Contact's full name (will split into first/last)
  --email email@example.com       Contact's email address (REQUIRED)
  --first-name "First"            Contact's first name (optional if --name provided)
  --last-name "Last"              Contact's last name (optional if --name provided)
  --company "Company Name"        Contact's company
  --title "Job Title"             Contact's job title
  --sequence-id ID                Specific sequence ID to use (optional, will list if not provided)
  --emailer-account-id ID         Specific emailer account ID (optional, will list if not provided)
  --from-email email@domain.com   Sending email address (default: yogeshb@productverse.co.in)
  --dry-run                       Show what would happen without actually sending
  --help                          Show this help message

Examples:
  # Basic usage (interactive - will prompt for sequence)
  node test/test-apollo-email-outreach.mjs --name "Yogesh Bagle" --email yogsbags@gmail.com

  # With all details
  node test/test-apollo-email-outreach.mjs \\
    --name "Yogesh Bagle" \\
    --email yogsbags@gmail.com \\
    --company "ProductVerse" \\
    --title "Founder" \\
    --sequence-id seq_abc123

  # Dry run (test without sending)
  node test/test-apollo-email-outreach.mjs \\
    --name "Yogesh Bagle" \\
    --email yogsbags@gmail.com \\
    --dry-run

Configuration:
  Sending Email: ${process.env.APOLLO_SENDER_EMAIL || 'yogeshb@productverse.co.in'}
  Apollo API Key: ${process.env.APOLLO_API_KEY ? '✅ Configured' : '❌ Not configured'}
`);
}

async function testEmailOutreach() {
  console.log('📧 Apollo Email Outreach Test\n');
  console.log('================================================\n');

  const params = parseArgs();

  // Validate required parameters
  if (!params.email) {
    console.error('❌ Error: --email is required\n');
    showHelp();
    process.exit(1);
  }

  if (!params.firstName) {
    console.error('❌ Error: --name or --first-name is required\n');
    showHelp();
    process.exit(1);
  }

  console.log('📋 Test Configuration:\n');
  console.log(`   Contact Name: ${params.firstName} ${params.lastName}`);
  console.log(`   Contact Email: ${params.email}`);
  console.log(`   Company: ${params.company || 'Not specified'}`);
  console.log(`   Title: ${params.title || 'Not specified'}`);
  console.log(`   From Email: ${params.fromEmail}`);
  console.log(`   Dry Run: ${params.dryRun ? 'YES' : 'NO'}`);
  console.log('');

  if (params.dryRun) {
    console.log('⚠️  DRY RUN MODE - No actual emails will be sent\n');
  }

  const apollo = new ApolloAPI(process.env.APOLLO_API_KEY);

  try {
    // Step 1: Get email accounts (sending mailboxes)
    console.log('Step 1: Fetching email accounts (sending mailboxes)...\n');

    let emailAccounts;
    try {
      emailAccounts = await apollo.getEmailAccounts();
      console.log(`✅ Found ${emailAccounts.emailer_accounts?.length || 0} email accounts:\n`);

      emailAccounts.emailer_accounts?.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.email}`);
        console.log(`      ID: ${account.id}`);
        console.log(`      Status: ${account.active ? '✅ Active' : '⚠️ Inactive'}`);
        console.log('');
      });

      // Find matching email account
      const matchingAccount = emailAccounts.emailer_accounts?.find(
        acc => acc.email === params.fromEmail
      );

      if (matchingAccount) {
        params.emailerAccountId = matchingAccount.id;
        console.log(`✅ Found matching emailer account: ${matchingAccount.email} (ID: ${matchingAccount.id})\n`);
      } else {
        console.log(`⚠️  Warning: Sending email ${params.fromEmail} not found in accounts\n`);
        if (emailAccounts.emailer_accounts?.length > 0) {
          console.log(`💡 Using first available account: ${emailAccounts.emailer_accounts[0].email}\n`);
          params.emailerAccountId = emailAccounts.emailer_accounts[0].id;
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not fetch email accounts: ${error.message}`);
      console.log(`   This might require a master API key\n`);
    }

    // Step 2: Search for or create contact
    console.log('Step 2: Searching for contact in Apollo...\n');

    let contactId = null;
    try {
      // First try to find existing contact
      const searchResult = await apollo.searchContacts({
        q_keywords: params.email
      });

      if (searchResult.contacts?.length > 0) {
        const contact = searchResult.contacts[0];
        contactId = contact.id;
        console.log(`✅ Found existing contact:\n`);
        console.log(`   Name: ${contact.name}`);
        console.log(`   Email: ${contact.email}`);
        console.log(`   Contact ID: ${contact.id}`);
        console.log('');
      } else {
        console.log(`ℹ️  Contact not found, creating new contact...\n`);

        if (params.dryRun) {
          console.log(`   [DRY RUN] Would create contact:`);
          console.log(`   Name: ${params.firstName} ${params.lastName}`);
          console.log(`   Email: ${params.email}`);
          console.log('');
          contactId = 'dry_run_contact_id';
        } else {
          // Create new contact
          const newContact = await apollo.createContact({
            first_name: params.firstName,
            last_name: params.lastName,
            email: params.email,
            organization_name: params.company,
            title: params.title
          });

          contactId = newContact.contact.id;
          console.log(`✅ Created new contact:\n`);
          console.log(`   Name: ${newContact.contact.name}`);
          console.log(`   Email: ${newContact.contact.email}`);
          console.log(`   Contact ID: ${newContact.contact.id}`);
          console.log('');
        }
      }
    } catch (error) {
      console.error(`❌ Error with contact: ${error.message}\n`);
      throw error;
    }

    // Step 3: Get sequences
    console.log('Step 3: Fetching available sequences...\n');

    let sequences;
    try {
      sequences = await apollo.getSequences();
      console.log(`✅ Found ${sequences.email_sequences?.length || 0} sequences:\n`);

      sequences.email_sequences?.forEach((seq, index) => {
        console.log(`   ${index + 1}. ${seq.name}`);
        console.log(`      ID: ${seq.id}`);
        console.log(`      Active: ${seq.active ? 'Yes' : 'No'}`);
        console.log(`      Steps: ${seq.num_steps || 0}`);
        console.log('');
      });

      // Use first active sequence if not specified
      if (!params.sequenceId && sequences.email_sequences?.length > 0) {
        const activeSeq = sequences.email_sequences.find(s => s.active) || sequences.email_sequences[0];
        params.sequenceId = activeSeq.id;
        console.log(`💡 Using sequence: "${activeSeq.name}" (ID: ${activeSeq.id})\n`);
      }
    } catch (error) {
      console.log(`⚠️  Could not fetch sequences: ${error.message}\n`);
    }

    // Step 4: Add contact to sequence
    if (!params.sequenceId) {
      console.log('❌ No sequence ID specified and no active sequences found\n');
      console.log('💡 Create a sequence in Apollo first, or specify --sequence-id\n');
      return;
    }

    if (!params.emailerAccountId) {
      console.log('❌ No emailer account ID found\n');
      console.log('💡 Make sure your sending email is connected in Apollo\n');
      return;
    }

    console.log('Step 4: Adding contact to sequence...\n');

    if (params.dryRun) {
      console.log('[DRY RUN] Would add contact to sequence:');
      console.log(`   Contact ID: ${contactId}`);
      console.log(`   Sequence ID: ${params.sequenceId}`);
      console.log(`   Emailer Account ID: ${params.emailerAccountId}`);
      console.log(`   From Email: ${params.fromEmail}`);
      console.log('');
      console.log('✅ Dry run successful - no emails sent\n');
    } else {
      try {
        const result = await apollo.addContactsToSequence({
          sequence_id: params.sequenceId,
          contact_ids: [contactId],
          emailer_account_id: params.emailerAccountId,
          sequence_active_in_other_campaigns: 'do_nothing',
          send_email_from_email_account_id: true
        });

        console.log('✅ Contact added to sequence successfully!\n');
        console.log('📨 Email Details:\n');
        console.log(`   From: ${params.fromEmail}`);
        console.log(`   To: ${params.email} (${params.firstName} ${params.lastName})`);
        console.log(`   Sequence: ${params.sequenceId}`);
        console.log('');
        console.log('📊 Result:', JSON.stringify(result, null, 2));
        console.log('');
        console.log('🎉 Email outreach initiated! Check Apollo dashboard for status.\n');
      } catch (error) {
        console.error(`❌ Failed to add contact to sequence: ${error.message}\n`);
        throw error;
      }
    }

    console.log('================================================\n');
    console.log('✅ Test complete!\n');
    console.log('📋 Summary:\n');
    console.log(`   Contact: ${params.firstName} ${params.lastName} (${params.email})`);
    console.log(`   Status: ${params.dryRun ? 'Dry run - no emails sent' : 'Added to sequence'}`);
    console.log('');
    console.log('🔗 Next steps:\n');
    console.log('   1. Check Apollo dashboard: https://app.apollo.io/sequences');
    console.log(`   2. Verify contact appears in sequence`);
    console.log(`   3. Monitor email delivery in ${params.fromEmail} sent folder`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   - Check Apollo API key is valid');
    console.error('   - Verify sending email is connected in Apollo');
    console.error('   - Ensure at least one active sequence exists');
    console.error('   - Check Apollo credit balance');
    console.error('');
    process.exit(1);
  }
}

// Run the test
testEmailOutreach().catch(console.error);
