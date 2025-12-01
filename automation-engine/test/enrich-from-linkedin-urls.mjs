/**
 * Enrich phone numbers from LinkedIn URLs
 *
 * Create linkedin-profiles.json first with phone numbers and LinkedIn URLs
 */

import { config } from 'dotenv';
import { ApolloAPI } from '../services/apollo-api.mjs';
import fs from 'fs';

config();

async function enrichFromLinkedInUrls() {
  console.log('🔗 Enriching from LinkedIn URLs...\n');

  if (!fs.existsSync('linkedin-profiles.json')) {
    console.log('❌ Error: linkedin-profiles.json not found');
    console.log('\nCreate the file with this format:\n');
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
    console.log(`\n📱 Processing: ${item.phone}`);
    console.log(`🔗 LinkedIn: ${item.linkedin_url}`);

    try {
      const enriched = await apollo.enrichPerson({
        linkedin_url: item.linkedin_url,
        reveal_personal_emails: true
      });

      if (enriched.person) {
        console.log('✅ Enriched successfully!');
        console.log(`   Name: ${enriched.person.name}`);
        console.log(`   Email: ${enriched.person.email || 'N/A'}`);
        console.log(`   Title: ${enriched.person.title || 'N/A'}`);
        console.log(`   Company: ${enriched.person.organization?.name || 'N/A'}`);

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
      console.log(`❌ Error: ${error.message}`);
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

  console.log('\n================================================');
  console.log('📊 ENRICHMENT SUMMARY\n');

  const successful = results.filter(r => r.status === 'success');
  console.log(`✅ Successfully enriched: ${successful.length}/${results.length}`);

  if (successful.length > 0) {
    console.log('\n✅ ENRICHED CONTACTS:\n');
    successful.forEach(({ phone, data }) => {
      console.log(`📱 ${phone}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Title: ${data.title}`);
      console.log(`   Company: ${data.organization?.name}`);
      console.log('');
    });
  }

  console.log('💾 Saving results to enriched-contacts.json...\n');
  fs.writeFileSync('enriched-contacts.json', JSON.stringify(results, null, 2));
  console.log('✅ Results saved!\n');
}

enrichFromLinkedInUrls().catch(console.error);
