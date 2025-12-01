/**
 * Email Enrichment Script using Apollo API
 *
 * Enriches email addresses with:
 * - Full name (first + last)
 * - Job title
 * - Company name
 * - LinkedIn URL
 * - Phone number (if available)
 * - Location
 * - Company details (industry, size, revenue)
 */

import ApolloAPI from './services/apollo-api.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email addresses to enrich
const emails = [
  'subendu22@gmail.com',
  'vineetnair33@gmail.com',
  'haritgautam56@gmail.com',
  'parulgautam56@gmail.com'
];

async function enrichEmails() {
  console.log('🚀 Starting Email Enrichment...\n');

  // Check for API key
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: APOLLO_API_KEY environment variable not set');
    console.log('Please set your Apollo API key:');
    console.log('export APOLLO_API_KEY="your_api_key_here"');
    process.exit(1);
  }

  // Initialize Apollo API
  const apollo = new ApolloAPI(apiKey);

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  console.log(`📧 Enriching ${emails.length} email addresses...\n`);

  // Process each email
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    console.log(`[${i + 1}/${emails.length}] Processing: ${email}`);

    try {
      // Enrich the email (without phone reveal which requires webhook)
      const enriched = await apollo.enrichPerson({
        email: email,
        reveal_personal_emails: false
        // Note: reveal_phone_number requires webhook_url parameter
      });

      if (enriched.person) {
        const person = enriched.person;
        const org = person.organization || {};

        const result = {
          // Input
          input_email: email,
          status: 'success',

          // Person details
          first_name: person.first_name,
          last_name: person.last_name,
          full_name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
          title: person.title,

          // Contact info
          email_status: person.email_status,
          work_email: person.email,
          personal_emails: person.personal_emails || [],
          phone_numbers: person.phone_numbers || [],

          // Social & Web
          linkedin_url: person.linkedin_url,
          twitter_url: person.twitter_url,
          facebook_url: person.facebook_url,

          // Location
          city: person.city,
          state: person.state,
          country: person.country,

          // Company details
          company_name: org.name,
          company_website: org.website_url,
          company_domain: org.primary_domain,
          company_linkedin: org.linkedin_url,
          company_industry: org.industry,
          company_keywords: org.keywords || [],
          company_size: org.estimated_num_employees,
          company_revenue: org.annual_revenue,
          company_founded_year: org.founded_year,

          // Apollo IDs
          apollo_person_id: person.id,
          apollo_org_id: org.id,

          // Metadata
          enriched_at: new Date().toISOString()
        };

        results.push(result);
        successCount++;

        console.log(`  ✅ Success: ${result.full_name} - ${result.title} @ ${result.company_name}`);
        if (result.phone_numbers.length > 0) {
          console.log(`     📞 Phone: ${result.phone_numbers[0].sanitized_number || result.phone_numbers[0].raw_number}`);
        }
        if (result.linkedin_url) {
          console.log(`     🔗 LinkedIn: ${result.linkedin_url}`);
        }
      } else {
        results.push({
          input_email: email,
          status: 'not_found',
          error: 'No person data returned from Apollo',
          enriched_at: new Date().toISOString()
        });
        failureCount++;
        console.log(`  ⚠️  Not found in Apollo database`);
      }

    } catch (error) {
      results.push({
        input_email: email,
        status: 'error',
        error: error.message,
        enriched_at: new Date().toISOString()
      });
      failureCount++;
      console.log(`  ❌ Error: ${error.message}`);
    }

    console.log('');

    // Small delay to respect rate limits
    if (i < emails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }

  // Save results
  console.log('\n📊 Enrichment Summary:');
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed: ${failureCount}`);
  console.log(`  📧 Total: ${emails.length}`);

  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, 'data', 'enriched');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Save as JSON
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(dataDir, `enriched-emails-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Saved JSON: ${jsonPath}`);

  // Save as CSV
  const csvPath = path.join(dataDir, `enriched-emails-${timestamp}.csv`);
  const csvContent = generateCSV(results);
  fs.writeFileSync(csvPath, csvContent);
  console.log(`💾 Saved CSV: ${csvPath}`);

  // Print detailed results
  console.log('\n📋 Detailed Results:\n');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.input_email}`);
    if (result.status === 'success') {
      console.log(`   Name: ${result.full_name}`);
      console.log(`   Title: ${result.title || 'N/A'}`);
      console.log(`   Company: ${result.company_name || 'N/A'}`);
      console.log(`   Location: ${[result.city, result.state, result.country].filter(Boolean).join(', ') || 'N/A'}`);
      console.log(`   LinkedIn: ${result.linkedin_url || 'N/A'}`);
      console.log(`   Phone: ${result.phone_numbers.length > 0 ? result.phone_numbers[0].sanitized_number || result.phone_numbers[0].raw_number : 'N/A'}`);
    } else {
      console.log(`   Status: ${result.status}`);
      console.log(`   Error: ${result.error || 'N/A'}`);
    }
    console.log('');
  });

  console.log('✨ Enrichment complete!\n');
}

function generateCSV(results) {
  // CSV headers
  const headers = [
    'Input Email',
    'Status',
    'Full Name',
    'First Name',
    'Last Name',
    'Title',
    'Company Name',
    'Company Website',
    'Company Industry',
    'Company Size',
    'Work Email',
    'Personal Emails',
    'Phone Numbers',
    'LinkedIn URL',
    'City',
    'State',
    'Country',
    'Apollo Person ID',
    'Apollo Org ID',
    'Enriched At'
  ];

  const rows = results.map(r => [
    r.input_email,
    r.status,
    r.full_name || '',
    r.first_name || '',
    r.last_name || '',
    r.title || '',
    r.company_name || '',
    r.company_website || '',
    r.company_industry || '',
    r.company_size || '',
    r.work_email || '',
    (r.personal_emails || []).join('; '),
    (r.phone_numbers || []).map(p => p.sanitized_number || p.raw_number).join('; '),
    r.linkedin_url || '',
    r.city || '',
    r.state || '',
    r.country || '',
    r.apollo_person_id || '',
    r.apollo_org_id || '',
    r.enriched_at || ''
  ]);

  // Escape CSV fields
  const escapeCsvField = (field) => {
    if (field == null) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map(row => row.map(escapeCsvField).join(','))
  ];

  return csvLines.join('\n');
}

// Run the enrichment
enrichEmails().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
