/**
 * Show ALL Apollo API Fields for Email Enrichment
 *
 * This script enriches a test email and displays the complete raw response
 * to show all available fields and attributes from Apollo API
 */

import ApolloAPI from './services/apollo-api.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function showAllFields() {
  console.log('🔍 Fetching ALL Apollo API Fields for Email Enrichment\n');

  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    console.error('❌ APOLLO_API_KEY not set in .env file');
    process.exit(1);
  }

  const apollo = new ApolloAPI(apiKey);

  // Use the first email that had good data
  const testEmail = 'subendu22@gmail.com';

  console.log(`📧 Test Email: ${testEmail}\n`);
  console.log('⏳ Fetching data from Apollo API...\n');

  try {
    const response = await apollo.enrichPerson({
      email: testEmail,
      reveal_personal_emails: false
    });

    console.log('✅ Raw Apollo API Response:\n');
    console.log('═'.repeat(80));
    console.log(JSON.stringify(response, null, 2));
    console.log('═'.repeat(80));

    // Save to file for reference
    const outputPath = path.join(__dirname, 'data', 'apollo-fields-reference.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(response, null, 2));
    console.log(`\n💾 Saved complete response to: ${outputPath}`);

    // Document all available fields
    console.log('\n📋 EXHAUSTIVE LIST OF AVAILABLE FIELDS:\n');

    if (response.person) {
      const person = response.person;

      console.log('👤 PERSON FIELDS:');
      console.log('─'.repeat(80));
      Object.keys(person).sort().forEach(key => {
        const value = person[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        const preview = getValuePreview(value);
        console.log(`  ${key.padEnd(40)} [${type.padEnd(8)}] ${preview}`);
      });

      if (person.organization) {
        console.log('\n🏢 ORGANIZATION FIELDS:');
        console.log('─'.repeat(80));
        Object.keys(person.organization).sort().forEach(key => {
          const value = person.organization[key];
          const type = Array.isArray(value) ? 'array' : typeof value;
          const preview = getValuePreview(value);
          console.log(`  ${key.padEnd(40)} [${type.padEnd(8)}] ${preview}`);
        });
      }

      if (person.employment_history && person.employment_history.length > 0) {
        console.log('\n💼 EMPLOYMENT HISTORY FIELDS (per entry):');
        console.log('─'.repeat(80));
        const historyEntry = person.employment_history[0];
        Object.keys(historyEntry).sort().forEach(key => {
          const value = historyEntry[key];
          const type = Array.isArray(value) ? 'array' : typeof value;
          const preview = getValuePreview(value);
          console.log(`  ${key.padEnd(40)} [${type.padEnd(8)}] ${preview}`);
        });
      }
    }

    // Generate markdown documentation
    console.log('\n📄 Generating Field Documentation...');
    const markdown = generateMarkdownDoc(response);
    const mdPath = path.join(__dirname, 'APOLLO_FIELDS_REFERENCE.md');
    fs.writeFileSync(mdPath, markdown);
    console.log(`💾 Saved documentation to: ${mdPath}`);

    console.log('\n✨ Done!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function getValuePreview(value) {
  if (value === null || value === undefined) {
    return '(null)';
  }
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  if (typeof value === 'object') {
    return `{${Object.keys(value).length} fields}`;
  }
  if (typeof value === 'string') {
    return value.length > 50 ? `"${value.substring(0, 47)}..."` : `"${value}"`;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}

function generateMarkdownDoc(response) {
  let md = '# Apollo API Email Enrichment - Complete Field Reference\n\n';
  md += '**Generated:** ' + new Date().toISOString() + '\n\n';
  md += 'This document lists all available fields when enriching an email address via Apollo API.\n\n';
  md += '---\n\n';

  if (response.person) {
    const person = response.person;

    md += '## 👤 Person Fields\n\n';
    md += 'Fields directly under the `person` object:\n\n';
    md += '| Field Name | Type | Description | Example Value |\n';
    md += '|------------|------|-------------|---------------|\n';

    Object.keys(person).sort().forEach(key => {
      const value = person[key];
      const type = Array.isArray(value) ? 'array' : typeof value;
      const example = getExampleValue(value);
      const description = getFieldDescription(key);
      md += `| \`${key}\` | ${type} | ${description} | ${example} |\n`;
    });

    if (person.organization) {
      md += '\n## 🏢 Organization Fields\n\n';
      md += 'Fields under `person.organization`:\n\n';
      md += '| Field Name | Type | Description | Example Value |\n';
      md += '|------------|------|-------------|---------------|\n';

      Object.keys(person.organization).sort().forEach(key => {
        const value = person.organization[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        const example = getExampleValue(value);
        const description = getOrgFieldDescription(key);
        md += `| \`${key}\` | ${type} | ${description} | ${example} |\n`;
      });
    }

    if (person.employment_history && person.employment_history.length > 0) {
      md += '\n## 💼 Employment History Fields\n\n';
      md += 'Fields in `person.employment_history[]` array (one entry per job):\n\n';
      md += '| Field Name | Type | Description | Example Value |\n';
      md += '|------------|------|-------------|---------------|\n';

      const historyEntry = person.employment_history[0];
      Object.keys(historyEntry).sort().forEach(key => {
        const value = historyEntry[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        const example = getExampleValue(value);
        const description = getEmploymentFieldDescription(key);
        md += `| \`${key}\` | ${type} | ${description} | ${example} |\n`;
      });
    }

    md += '\n## 📊 Field Categories\n\n';
    md += '### Contact Information\n';
    md += '- `email`, `personal_emails`, `work_email`\n';
    md += '- `phone_numbers` (requires webhook)\n';
    md += '- `city`, `state`, `country`\n\n';

    md += '### Professional Details\n';
    md += '- `title`, `headline`, `seniority`\n';
    md += '- `functions`, `departments`\n';
    md += '- `organization` (company details)\n\n';

    md += '### Social & Web Presence\n';
    md += '- `linkedin_url`, `twitter_url`, `facebook_url`\n';
    md += '- `github_url`, `personal_website`\n\n';

    md += '### Career History\n';
    md += '- `employment_history[]` (array of past positions)\n';
    md += '- `education[]` (array of degrees)\n\n';

    md += '### Apollo Metadata\n';
    md += '- `id` (Apollo person ID)\n';
    md += '- `organization.id` (Apollo org ID)\n';
    md += '- `contact_accuracy_score`\n';
    md += '- `reveal_personal_emails` (boolean flag)\n\n';
  }

  md += '\n---\n\n';
  md += '## Usage Example\n\n';
  md += '```javascript\n';
  md += 'const apollo = new ApolloAPI(apiKey);\n';
  md += 'const enriched = await apollo.enrichPerson({\n';
  md += '  email: "person@company.com",\n';
  md += '  reveal_personal_emails: false\n';
  md += '});\n\n';
  md += 'console.log(enriched.person.first_name);\n';
  md += 'console.log(enriched.person.title);\n';
  md += 'console.log(enriched.person.organization.name);\n';
  md += '```\n\n';

  md += '## Notes\n\n';
  md += '- **Phone Numbers**: Requires `reveal_phone_number: true` and `webhook_url` parameter\n';
  md += '- **Personal Emails**: Requires `reveal_personal_emails: true` (costs credits)\n';
  md += '- **Rate Limits**: ~2 requests/second (10,000/hour)\n';
  md += '- **Null Values**: Many fields may be `null` if data not available\n\n';

  return md;
}

function getExampleValue(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return '{...}';
  if (typeof value === 'string') {
    const truncated = value.length > 30 ? value.substring(0, 27) + '...' : value;
    return `"${truncated}"`;
  }
  return String(value);
}

function getFieldDescription(field) {
  const descriptions = {
    'id': 'Unique Apollo person ID',
    'first_name': 'First name',
    'last_name': 'Last name',
    'name': 'Full name',
    'title': 'Current job title',
    'headline': 'LinkedIn headline',
    'email': 'Primary work email',
    'email_status': 'Email verification status',
    'personal_emails': 'Array of personal email addresses',
    'phone_numbers': 'Array of phone numbers (requires webhook)',
    'linkedin_url': 'LinkedIn profile URL',
    'twitter_url': 'Twitter profile URL',
    'facebook_url': 'Facebook profile URL',
    'github_url': 'GitHub profile URL',
    'city': 'City location',
    'state': 'State/province',
    'country': 'Country',
    'organization': 'Company/organization details',
    'seniority': 'Job seniority level',
    'functions': 'Job functions/roles',
    'departments': 'Departments',
    'employment_history': 'Array of past positions',
    'photo_url': 'Profile photo URL',
    'contact_accuracy_score': 'Data accuracy score (0-100)',
  };
  return descriptions[field] || 'Field description';
}

function getOrgFieldDescription(field) {
  const descriptions = {
    'id': 'Unique Apollo organization ID',
    'name': 'Company name',
    'website_url': 'Company website',
    'primary_domain': 'Primary domain name',
    'linkedin_url': 'Company LinkedIn page',
    'logo_url': 'Company logo URL',
    'industry': 'Industry classification',
    'keywords': 'Industry keywords/tags',
    'estimated_num_employees': 'Employee count estimate',
    'annual_revenue': 'Annual revenue (USD)',
    'founded_year': 'Year founded',
    'publicly_traded_symbol': 'Stock ticker symbol',
    'phone': 'Company phone number',
    'city': 'HQ city',
    'state': 'HQ state',
    'country': 'HQ country',
  };
  return descriptions[field] || 'Organization field';
}

function getEmploymentFieldDescription(field) {
  const descriptions = {
    'created_at': 'Record created timestamp',
    'current': 'Is this current position?',
    'degree': 'Degree if applicable',
    'description': 'Position description',
    'emails': 'Emails used at this position',
    'end_date': 'End date',
    'grade_level': 'Grade/level',
    'kind': 'Type (education/employment)',
    'major': 'Major/specialization',
    'organization_id': 'Apollo org ID',
    'organization_name': 'Company name',
    'raw_address': 'Office address',
    'start_date': 'Start date',
    'title': 'Job title',
    'updated_at': 'Last updated timestamp',
  };
  return descriptions[field] || 'Employment field';
}

showAllFields().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
