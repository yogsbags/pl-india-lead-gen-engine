/**
 * Manual Phone Number Enrichment
 *
 * Steps:
 * 1. Google search for phone numbers on LinkedIn/Facebook
 * 2. Extract LinkedIn profile URLs
 * 3. Enrich profiles using Apollo API
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

function formatIndianPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }
  return phone;
}

function generateSearchQueries(phone) {
  const formatted = formatIndianPhone(phone);
  const plain = phone;
  const withPlus91 = `+91${phone}`;

  return [
    // LinkedIn searches
    {
      platform: 'LinkedIn',
      query: `"${plain}" site:linkedin.com/in`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`"${plain}" site:linkedin.com/in`)}`
    },
    {
      platform: 'LinkedIn',
      query: `"${formatted}" site:linkedin.com`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`"${formatted}" site:linkedin.com`)}`
    },
    // Facebook searches
    {
      platform: 'Facebook',
      query: `"${plain}" site:facebook.com`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`"${plain}" site:facebook.com`)}`
    },
    // Twitter searches
    {
      platform: 'Twitter',
      query: `"${plain}" site:twitter.com`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`"${plain}" site:twitter.com`)}`
    },
    // General web search
    {
      platform: 'Web',
      query: `"${plain}" India contact`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`"${plain}" India contact`)}`
    }
  ];
}

async function enrichFromLinkedIn(linkedinUrl) {
  if (!process.env.APOLLO_API_KEY) {
    return null;
  }

  const apollo = new ApolloAPI(process.env.APOLLO_API_KEY);

  try {
    console.log(`   🔍 Enriching LinkedIn profile: ${linkedinUrl}`);

    const result = await apollo.enrichPerson({
      linkedin_url: linkedinUrl,
      reveal_personal_emails: true
    });

    if (result.person) {
      return {
        name: result.person.name,
        email: result.person.email,
        title: result.person.title,
        company: result.person.organization?.name,
        city: result.person.city,
        linkedin_url: result.person.linkedin_url,
        phone_numbers: result.person.phone_numbers || []
      };
    }
    return null;
  } catch (error) {
    console.log(`   ⚠️  Apollo enrichment failed: ${error.message}`);
    return null;
  }
}

async function manualEnrichment() {
  console.log('📞 Manual Phone Number Enrichment Tool\n');
  console.log('================================================\n');
  console.log('🔍 SEARCH STRATEGY:\n');
  console.log('1. Google search for phone numbers on LinkedIn');
  console.log('2. Find LinkedIn profile URLs');
  console.log('3. Enrich profiles using Apollo API\n');
  console.log('================================================\n');

  const results = [];

  for (const phone of phoneNumbers) {
    console.log(`\n📱 Phone Number: ${phone} (${formatIndianPhone(phone)})`);
    console.log('─'.repeat(60));

    const searches = generateSearchQueries(phone);

    console.log('\n🔎 Google Search Links:\n');
    searches.forEach((search, idx) => {
      console.log(`${idx + 1}. ${search.platform}:`);
      console.log(`   ${search.url}\n`);
    });

    console.log('💡 What to do:');
    console.log('   1. Click on the LinkedIn search link above');
    console.log('   2. If you find a LinkedIn profile, copy the URL');
    console.log('   3. Paste it below when prompted\n');

    results.push({
      phone,
      formatted: formatIndianPhone(phone),
      searches,
      status: 'pending'
    });
  }

  // Create interactive enrichment instructions
  console.log('\n\n================================================');
  console.log('📋 INTERACTIVE ENRICHMENT STEPS\n');
  console.log('For each phone number:\n');

  phoneNumbers.forEach((phone, idx) => {
    console.log(`${idx + 1}. ${phone}:`);
    console.log(`   → Search: https://www.google.com/search?q=${encodeURIComponent(`"${phone}" site:linkedin.com/in`)}`);
    console.log('   → Find LinkedIn profile');
    console.log('   → Copy the LinkedIn URL');
    console.log('');
  });

  console.log('\n================================================');
  console.log('🤖 AUTOMATED ENRICHMENT (If you have LinkedIn URLs)\n');
  console.log('Create a file called "linkedin-profiles.json" with this format:\n');
  console.log(JSON.stringify({
    "enrichments": [
      {
        "phone": "9664140840",
        "linkedin_url": "https://linkedin.com/in/john-doe-123456"
      },
      {
        "phone": "9892405520",
        "linkedin_url": "https://linkedin.com/in/jane-smith-789012"
      }
    ]
  }, null, 2));
  console.log('\nThen run: node test/enrich-from-linkedin-urls.mjs\n');

  // Save search results
  console.log('================================================');
  console.log('💾 Saving search queries to manual-search-queries.json...\n');

  const fs = await import('fs');
  fs.writeFileSync(
    'manual-search-queries.json',
    JSON.stringify(results, null, 2)
  );

  console.log('✅ Search queries saved!\n');

  // Create the automated enrichment script
  console.log('📝 Creating automated enrichment script...\n');

  const enrichmentScript = `/**
 * Enrich phone numbers from LinkedIn URLs
 *
 * Create linkedin-profiles.json first with phone numbers and LinkedIn URLs
 */

import { config } from 'dotenv';
import { ApolloAPI } from '../services/apollo-api.mjs';
import fs from 'fs';

config();

async function enrichFromLinkedInUrls() {
  console.log('🔗 Enriching from LinkedIn URLs...\\n');

  if (!fs.existsSync('linkedin-profiles.json')) {
    console.log('❌ Error: linkedin-profiles.json not found');
    console.log('\\nCreate the file with this format:\\n');
    console.log(JSON.stringify({
      "enrichments": [
        {
          "phone": "9664140840",
          "linkedin_url": "https://linkedin.com/in/john-doe"
        }
      ]
    }, null, 2));
    return;
  }

  const data = JSON.parse(fs.readFileSync('linkedin-profiles.json', 'utf8'));
  const apollo = new ApolloAPI(process.env.APOLLO_API_KEY);
  const results = [];

  for (const item of data.enrichments) {
    console.log(\`\\n📱 Processing: \${item.phone}\`);
    console.log(\`🔗 LinkedIn: \${item.linkedin_url}\`);

    try {
      const enriched = await apollo.enrichPerson({
        linkedin_url: item.linkedin_url,
        reveal_personal_emails: true
      });

      if (enriched.person) {
        console.log('✅ Enriched successfully!');
        console.log(\`   Name: \${enriched.person.name}\`);
        console.log(\`   Email: \${enriched.person.email || 'N/A'}\`);
        console.log(\`   Title: \${enriched.person.title || 'N/A'}\`);
        console.log(\`   Company: \${enriched.person.organization?.name || 'N/A'}\`);

        results.push({
          phone: item.phone,
          linkedin_url: item.linkedin_url,
          status: 'success',
          data: enriched.person
        });
      } else {
        console.log('ℹ️  No data found');
        results.push({
          phone: item.phone,
          linkedin_url: item.linkedin_url,
          status: 'not_found'
        });
      }
    } catch (error) {
      console.log(\`❌ Error: \${error.message}\`);
      results.push({
        phone: item.phone,
        linkedin_url: item.linkedin_url,
        status: 'error',
        error: error.message
      });
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  console.log('\\n================================================');
  console.log('📊 ENRICHMENT SUMMARY\\n');

  const successful = results.filter(r => r.status === 'success');
  console.log(\`✅ Successfully enriched: \${successful.length}/\${results.length}\`);

  if (successful.length > 0) {
    console.log('\\n✅ ENRICHED CONTACTS:\\n');
    successful.forEach(({ phone, data }) => {
      console.log(\`📱 \${phone}\`);
      console.log(\`   Name: \${data.name}\`);
      console.log(\`   Email: \${data.email}\`);
      console.log(\`   Title: \${data.title}\`);
      console.log(\`   Company: \${data.organization?.name}\`);
      console.log('');
    });
  }

  console.log('💾 Saving results to enriched-contacts.json...\\n');
  fs.writeFileSync('enriched-contacts.json', JSON.stringify(results, null, 2));
  console.log('✅ Results saved!\\n');
}

enrichFromLinkedInUrls().catch(console.error);
`;

  fs.writeFileSync('test/enrich-from-linkedin-urls.mjs', enrichmentScript);
  console.log('✅ Script created: test/enrich-from-linkedin-urls.mjs\n');

  console.log('================================================');
  console.log('📋 QUICK REFERENCE\n');
  console.log('Phone Numbers to Search:');
  phoneNumbers.forEach((phone, idx) => {
    console.log(`${idx + 1}. ${phone}`);
  });
  console.log('\n================================================\n');
}

manualEnrichment().catch(console.error);
