/**
 * ENHANCED Email Enrichment Script
 *
 * Multi-Step Enrichment Process:
 * 1. Enrich personal email → Get name + company
 * 2. Search Apollo for work profile using name + company
 * 3. Get full professional data (work email, LinkedIn, phone, etc.)
 *
 * This solves the "personal email" problem by finding work profiles!
 */

import ApolloAPI from './services/apollo-api.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email addresses to enrich
const emails = [
  'subendu22@gmail.com',
  'vineetnair33@gmail.com',
  'haritgautam56@gmail.com',
  'parulgautam56@gmail.com'
];

async function enhancedEnrichment() {
  console.log('🚀 ENHANCED Email Enrichment - Multi-Step Process\n');
  console.log('This script will:');
  console.log('  1️⃣  Enrich personal email → Extract name + company');
  console.log('  2️⃣  Search Apollo for work profile');
  console.log('  3️⃣  Get complete professional data\n');

  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    console.error('❌ APOLLO_API_KEY not set');
    process.exit(1);
  }

  const apollo = new ApolloAPI(apiKey);

  const results = [];
  let fullEnrichmentCount = 0;
  let partialEnrichmentCount = 0;
  let failedCount = 0;

  console.log(`📧 Processing ${emails.length} personal emails...\n`);
  console.log('═'.repeat(80) + '\n');

  for (let i = 0; i < emails.length; i++) {
    const personalEmail = emails[i];
    console.log(`[${i + 1}/${emails.length}] 📩 Input: ${personalEmail}`);

    try {
      // ============================================
      // STEP 1: Enrich Personal Email
      // ============================================
      console.log('  ⏳ Step 1: Enriching personal email...');

      const personalData = await apollo.enrichPerson({
        email: personalEmail,
        reveal_personal_emails: false
      });

      if (!personalData.person) {
        results.push({
          input_email: personalEmail,
          status: 'not_found',
          error: 'Email not found in Apollo database',
          enrichment_method: 'none',
          enriched_at: new Date().toISOString()
        });
        failedCount++;
        console.log('  ❌ Email not found in Apollo\n');
        continue;
      }

      const person = personalData.person;
      const firstName = person.first_name;
      const lastName = person.last_name;
      const companyName = person.organization?.name;

      console.log(`  ✅ Found: ${firstName} ${lastName}${companyName ? ' @ ' + companyName : ''}`);

      // ============================================
      // STEP 2: Search for Work Profile
      // ============================================

      let workProfile = null;
      let workEmail = null;
      let linkedinUrl = null;

      if (firstName && lastName && companyName) {
        console.log('  ⏳ Step 2: Searching for work profile...');

        try {
          const searchResults = await apollo.searchPeople({
            q_keywords: `${firstName} ${lastName}`,
            q_organization_domains: companyName.toLowerCase().replace(/[^a-z0-9]/g, ''),
            per_page: 5
          });

          // Try alternate search if first one fails
          if (!searchResults.people || searchResults.people.length === 0) {
            console.log('  🔄 Trying alternate search with company name...');

            const altSearch = await apollo.searchPeople({
              person_titles: [person.title].filter(Boolean),
              q_keywords: `${firstName} ${lastName} ${companyName}`,
              per_page: 5
            });

            if (altSearch.people && altSearch.people.length > 0) {
              workProfile = altSearch.people[0];
            }
          } else {
            // Find best match by name similarity
            workProfile = searchResults.people.find(p => {
              const matchFirst = p.first_name?.toLowerCase() === firstName?.toLowerCase();
              const matchLast = p.last_name?.toLowerCase() === lastName?.toLowerCase();
              const matchOrg = p.organization?.name?.toLowerCase()?.includes(companyName?.toLowerCase());
              return matchFirst && matchLast && matchOrg;
            }) || searchResults.people[0]; // Fallback to first result
          }

          if (workProfile) {
            workEmail = workProfile.email;
            linkedinUrl = workProfile.linkedin_url;

            console.log(`  ✅ Found work profile!`);
            console.log(`     💼 Work Email: ${workEmail || 'N/A'}`);
            console.log(`     🔗 LinkedIn: ${linkedinUrl || 'N/A'}`);

            // ============================================
            // STEP 3: Get Full Work Profile Data
            // ============================================

            if (workEmail) {
              console.log('  ⏳ Step 3: Getting full work profile...');

              try {
                const fullProfile = await apollo.enrichPerson({
                  email: workEmail,
                  reveal_personal_emails: false
                });

                if (fullProfile.person) {
                  // Merge personal + work data
                  const enrichedResult = {
                    // Input
                    input_email: personalEmail,
                    status: 'full_enrichment',
                    enrichment_method: 'multi_step',

                    // Personal Contact
                    personal_email: personalEmail,

                    // Work Contact
                    work_email: fullProfile.person.email,
                    linkedin_url: fullProfile.person.linkedin_url,
                    phone_numbers: fullProfile.person.phone_numbers || [],

                    // Person Details
                    first_name: fullProfile.person.first_name,
                    last_name: fullProfile.person.last_name,
                    full_name: `${fullProfile.person.first_name || ''} ${fullProfile.person.last_name || ''}`.trim(),
                    title: fullProfile.person.title,
                    headline: fullProfile.person.headline,
                    seniority: fullProfile.person.seniority,
                    functions: fullProfile.person.functions || [],
                    departments: fullProfile.person.departments || [],

                    // Location
                    city: fullProfile.person.city,
                    state: fullProfile.person.state,
                    country: fullProfile.person.country,
                    time_zone: fullProfile.person.time_zone,

                    // Social
                    twitter_url: fullProfile.person.twitter_url,
                    facebook_url: fullProfile.person.facebook_url,
                    github_url: fullProfile.person.github_url,
                    photo_url: fullProfile.person.photo_url,

                    // Company
                    company_name: fullProfile.person.organization?.name,
                    company_website: fullProfile.person.organization?.website_url,
                    company_domain: fullProfile.person.organization?.primary_domain,
                    company_linkedin: fullProfile.person.organization?.linkedin_url,
                    company_industry: fullProfile.person.organization?.industry,
                    company_size: fullProfile.person.organization?.estimated_num_employees,
                    company_revenue: fullProfile.person.organization?.organization_revenue,
                    company_founded_year: fullProfile.person.organization?.founded_year,
                    company_phone: fullProfile.person.organization?.phone,
                    company_description: fullProfile.person.organization?.short_description,
                    company_keywords: fullProfile.person.organization?.keywords || [],
                    company_technologies: fullProfile.person.organization?.technology_names || [],
                    company_funding: fullProfile.person.organization?.total_funding_printed,

                    // Career History
                    employment_history: fullProfile.person.employment_history || [],
                    current_position_since: fullProfile.person.employment_history?.find(e => e.current)?.start_date,
                    previous_companies: fullProfile.person.employment_history?.filter(e => !e.current).map(e => e.organization_name) || [],

                    // Apollo IDs
                    apollo_person_id: fullProfile.person.id,
                    apollo_org_id: fullProfile.person.organization?.id,

                    // Metadata
                    enriched_at: new Date().toISOString()
                  };

                  results.push(enrichedResult);
                  fullEnrichmentCount++;

                  console.log(`  ✅ FULL ENRICHMENT SUCCESS!`);
                  console.log(`     👤 ${enrichedResult.full_name} - ${enrichedResult.title}`);
                  console.log(`     🏢 ${enrichedResult.company_name}`);
                  console.log(`     📧 ${enrichedResult.work_email}`);
                  console.log(`     🔗 ${enrichedResult.linkedin_url || 'N/A'}`);
                  console.log('');
                  continue;
                }
              } catch (error) {
                console.log(`  ⚠️  Step 3 failed: ${error.message}`);
                // Fall through to partial enrichment
              }
            }
          } else {
            console.log('  ⚠️  No work profile found in search');
          }
        } catch (error) {
          console.log(`  ⚠️  Step 2 search failed: ${error.message}`);
        }
      }

      // ============================================
      // FALLBACK: Use Personal Email Data
      // ============================================

      console.log('  ℹ️  Using data from personal email only (partial enrichment)');

      const partialResult = {
        input_email: personalEmail,
        status: 'partial_enrichment',
        enrichment_method: 'personal_email_only',

        personal_email: personalEmail,
        work_email: workEmail || null,
        linkedin_url: linkedinUrl || person.linkedin_url,

        first_name: person.first_name,
        last_name: person.last_name,
        full_name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
        title: person.title,
        headline: person.headline,
        seniority: person.seniority,

        city: person.city,
        state: person.state,
        country: person.country,

        photo_url: person.photo_url,

        company_name: person.organization?.name,
        company_linkedin: person.organization?.linkedin_url,
        company_industry: person.organization?.industry,
        company_size: person.organization?.estimated_num_employees,
        company_founded_year: person.organization?.founded_year,

        employment_history: person.employment_history || [],

        apollo_person_id: person.id,
        apollo_org_id: person.organization?.id,

        enriched_at: new Date().toISOString(),
        note: 'Limited data - work email not found'
      };

      results.push(partialResult);
      partialEnrichmentCount++;

      console.log(`  ✅ Partial enrichment complete`);
      console.log('');

    } catch (error) {
      results.push({
        input_email: personalEmail,
        status: 'error',
        error: error.message,
        enrichment_method: 'failed',
        enriched_at: new Date().toISOString()
      });
      failedCount++;
      console.log(`  ❌ Error: ${error.message}\n`);
    }

    // Rate limiting delay
    if (i < emails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // ============================================
  // SUMMARY & EXPORT
  // ============================================

  console.log('═'.repeat(80));
  console.log('\n📊 ENRICHMENT SUMMARY:\n');
  console.log(`  ✅ Full Enrichment (work email found):  ${fullEnrichmentCount}`);
  console.log(`  ⚠️  Partial Enrichment (personal only):  ${partialEnrichmentCount}`);
  console.log(`  ❌ Failed:                               ${failedCount}`);
  console.log(`  📧 Total Processed:                      ${emails.length}\n`);

  // Calculate success rate
  const successRate = ((fullEnrichmentCount / emails.length) * 100).toFixed(1);
  console.log(`  🎯 Work Email Discovery Rate: ${successRate}%\n`);

  // Save results
  const dataDir = path.join(__dirname, 'data', 'enriched');
  fs.mkdirSync(dataDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // JSON Export
  const jsonPath = path.join(dataDir, `enhanced-enrichment-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`💾 JSON saved: ${jsonPath}`);

  // CSV Export
  const csvPath = path.join(dataDir, `enhanced-enrichment-${timestamp}.csv`);
  const csvContent = generateEnhancedCSV(results);
  fs.writeFileSync(csvPath, csvContent);
  console.log(`💾 CSV saved: ${csvPath}`);

  // Detailed Report
  console.log('\n' + '═'.repeat(80));
  console.log('\n📋 DETAILED RESULTS:\n');

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.input_email}`);
    console.log(`   Status: ${getStatusEmoji(result.status)} ${result.status.toUpperCase()}`);

    if (result.status === 'full_enrichment') {
      console.log(`   Name: ${result.full_name}`);
      console.log(`   Title: ${result.title || 'N/A'}`);
      console.log(`   Company: ${result.company_name || 'N/A'}`);
      console.log(`   Work Email: ${result.work_email}`);
      console.log(`   LinkedIn: ${result.linkedin_url || 'N/A'}`);
      console.log(`   Location: ${[result.city, result.state, result.country].filter(Boolean).join(', ')}`);
      console.log(`   Company Size: ${result.company_size ? result.company_size.toLocaleString() + ' employees' : 'N/A'}`);
      console.log(`   Career: ${result.employment_history?.length || 0} positions tracked`);
    } else if (result.status === 'partial_enrichment') {
      console.log(`   Name: ${result.full_name || 'N/A'}`);
      console.log(`   Title: ${result.title || 'N/A'}`);
      console.log(`   Company: ${result.company_name || 'N/A'}`);
      console.log(`   Note: ${result.note}`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });

  console.log('✨ Enhanced enrichment complete!\n');
}

function getStatusEmoji(status) {
  const emojis = {
    'full_enrichment': '🎯',
    'partial_enrichment': '⚠️',
    'not_found': '❌',
    'error': '❌'
  };
  return emojis[status] || '❓';
}

function generateEnhancedCSV(results) {
  const headers = [
    'Input Email',
    'Status',
    'Enrichment Method',
    'Full Name',
    'First Name',
    'Last Name',
    'Title',
    'Seniority',
    'Personal Email',
    'Work Email',
    'LinkedIn URL',
    'Phone Numbers',
    'Company Name',
    'Company Website',
    'Company Industry',
    'Company Size',
    'Company Revenue',
    'Company Founded',
    'Company LinkedIn',
    'Company Technologies',
    'City',
    'State',
    'Country',
    'Time Zone',
    'Employment History Count',
    'Current Position Since',
    'Previous Companies',
    'Apollo Person ID',
    'Apollo Org ID',
    'Enriched At',
    'Notes'
  ];

  const rows = results.map(r => [
    r.input_email,
    r.status,
    r.enrichment_method,
    r.full_name || '',
    r.first_name || '',
    r.last_name || '',
    r.title || '',
    r.seniority || '',
    r.personal_email || '',
    r.work_email || '',
    r.linkedin_url || '',
    (r.phone_numbers || []).map(p => p.sanitized_number || p.raw_number).join('; '),
    r.company_name || '',
    r.company_website || '',
    r.company_industry || '',
    r.company_size || '',
    r.company_revenue || '',
    r.company_founded_year || '',
    r.company_linkedin || '',
    (r.company_technologies || []).join('; '),
    r.city || '',
    r.state || '',
    r.country || '',
    r.time_zone || '',
    (r.employment_history || []).length,
    r.current_position_since || '',
    (r.previous_companies || []).join('; '),
    r.apollo_person_id || '',
    r.apollo_org_id || '',
    r.enriched_at || '',
    r.note || r.error || ''
  ]);

  const escapeCsvField = (field) => {
    if (field == null) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  return [
    headers.map(escapeCsvField).join(','),
    ...rows.map(row => row.map(escapeCsvField).join(','))
  ].join('\n');
}

enhancedEnrichment().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
