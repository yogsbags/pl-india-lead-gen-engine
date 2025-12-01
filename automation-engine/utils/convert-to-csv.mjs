#!/usr/bin/env node

/**
 * Convert JSON lead files to CSV
 *
 * Usage:
 *   node utils/convert-to-csv.mjs                 # Convert all segment files
 *   node utils/convert-to-csv.mjs partners        # Convert specific segment
 *   node utils/convert-to-csv.mjs --minimal       # Use minimal columns
 *   node utils/convert-to-csv.mjs --email-outreach # Email outreach format
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const leadsDir = path.join(projectRoot, 'data', 'leads');
const exportsDir = path.join(projectRoot, 'data', 'exports');

// Column configurations
const COLUMN_PRESETS = {
  default: [
    { field: 'first_name', label: 'First Name' },
    { field: 'last_name', label: 'Last Name' },
    { field: 'name', label: 'Full Name' },
    { field: 'email', label: 'Email' },
    { field: 'phone', label: 'Phone' },
    { field: 'title', label: 'Job Title' },
    { field: 'company', label: 'Company' },
    { field: 'industry', label: 'Industry' },
    { field: 'city', label: 'City' },
    { field: 'state', label: 'State' },
    { field: 'country', label: 'Country' },
    { field: 'linkedin_url', label: 'LinkedIn URL' },
    { field: 'website', label: 'Website' },
    { field: 'lead_score', label: 'Lead Score' },
    { field: 'lead_tier', label: 'Lead Tier' },
    { field: 'source', label: 'Source' }
  ],
  minimal: [
    { field: 'name', label: 'Name' },
    { field: 'email', label: 'Email' },
    { field: 'phone', label: 'Phone' },
    { field: 'company', label: 'Company' },
    { field: 'linkedin_url', label: 'LinkedIn' }
  ],
  'email-outreach': [
    { field: 'first_name', label: 'First Name' },
    { field: 'email', label: 'Email' },
    { field: 'title', label: 'Job Title' },
    { field: 'company', label: 'Company' },
    { field: 'city', label: 'City' },
    { field: 'lead_score', label: 'Score' },
    { field: 'linkedin_url', label: 'LinkedIn' }
  ],
  'crm-import': [
    { field: 'first_name', label: 'First Name' },
    { field: 'last_name', label: 'Last Name' },
    { field: 'email', label: 'Email' },
    { field: 'phone', label: 'Phone' },
    { field: 'title', label: 'Title' },
    { field: 'company', label: 'Company' },
    { field: 'city', label: 'City' },
    { field: 'state', label: 'State' },
    { field: 'country', label: 'Country' },
    { field: 'linkedin_url', label: 'LinkedIn URL' },
    { field: 'website', label: 'Website' },
    { field: 'lead_score', label: 'Lead Score' },
    { field: 'lead_status', label: 'Status' },
    { field: 'source', label: 'Source' }
  ]
};

function getFieldValue(obj, fieldPath) {
  if (!fieldPath) return '';

  const parts = fieldPath.split('.');
  let value = obj;

  for (const part of parts) {
    if (value === null || value === undefined) {
      return '';
    }

    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      value = value[arrayName];
      if (Array.isArray(value)) {
        value = value[parseInt(index)];
      } else {
        return '';
      }
    } else {
      value = value[part];
    }
  }

  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.join('; ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  if (stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')) {
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return stringValue;
}

function generateCsv(leads, columns, includeHeader = true) {
  const rows = [];

  if (includeHeader) {
    const headers = columns.map(col => escapeCsvValue(col.label || col.field));
    rows.push(headers.join(','));
  }

  for (const lead of leads) {
    const values = columns.map(col => {
      const value = getFieldValue(lead, col.field);
      return escapeCsvValue(value);
    });
    rows.push(values.join(','));
  }

  return rows.join('\n');
}

async function convertFile(filename, columns) {
  const inputPath = path.join(leadsDir, filename);
  const segmentName = path.basename(filename, '.json');

  if (!await fs.pathExists(inputPath)) {
    console.log(`❌ File not found: ${inputPath}`);
    return null;
  }

  const leads = await fs.readJson(inputPath);

  if (!Array.isArray(leads) || leads.length === 0) {
    console.log(`⚠️  No leads found in ${filename}`);
    return null;
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const outputFilename = `${segmentName}_${timestamp}.csv`;
  const outputPath = path.join(exportsDir, outputFilename);

  const csvContent = generateCsv(leads, columns, true);
  await fs.writeFile(outputPath, '\uFEFF' + csvContent, 'utf8');

  console.log(`✅ Exported ${leads.length} leads to: ${outputFilename}`);

  return {
    segment: segmentName,
    leads: leads.length,
    filepath: outputPath
  };
}

async function main() {
  const args = process.argv.slice(2);

  // Determine column preset
  let columnPreset = 'default';
  if (args.includes('--minimal')) {
    columnPreset = 'minimal';
  } else if (args.includes('--email-outreach')) {
    columnPreset = 'email-outreach';
  } else if (args.includes('--crm-import')) {
    columnPreset = 'crm-import';
  }

  const columns = COLUMN_PRESETS[columnPreset];

  console.log('📊 CSV Converter\n');
  console.log(`Using column preset: ${columnPreset}\n`);

  await fs.ensureDir(exportsDir);

  // Check if specific segment requested
  const segmentArg = args.find(arg => !arg.startsWith('--'));

  if (segmentArg) {
    // Convert specific segment
    const filename = segmentArg.endsWith('.json') ? segmentArg : `${segmentArg}.json`;
    const result = await convertFile(filename, columns);

    if (result) {
      console.log('\n✅ Conversion complete!');
      console.log(`   Segment: ${result.segment}`);
      console.log(`   Leads: ${result.leads}`);
      console.log(`   File: ${result.filepath}\n`);
    }
  } else {
    // Convert all segment files
    const files = await fs.readdir(leadsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('-'));

    if (jsonFiles.length === 0) {
      console.log('❌ No lead files found in data/leads/\n');
      console.log('💡 Run a workflow first: npm run run:partners\n');
      return;
    }

    console.log(`Found ${jsonFiles.length} lead file(s)\n`);

    const results = [];
    for (const filename of jsonFiles) {
      const result = await convertFile(filename, columns);
      if (result) {
        results.push(result);
      }
    }

    if (results.length > 0) {
      console.log('\n✅ All conversions complete!\n');
      console.log('📊 Summary:');
      let totalLeads = 0;
      results.forEach(r => {
        console.log(`   - ${r.segment}: ${r.leads} leads`);
        totalLeads += r.leads;
      });
      console.log(`\n   Total: ${totalLeads} leads exported\n`);
      console.log(`📁 Files saved to: ${exportsDir}\n`);
    }
  }

  console.log('💡 Usage examples:');
  console.log('   node utils/convert-to-csv.mjs                 # Convert all');
  console.log('   node utils/convert-to-csv.mjs partners        # Convert Partners');
  console.log('   node utils/convert-to-csv.mjs --minimal       # Minimal columns');
  console.log('   node utils/convert-to-csv.mjs --email-outreach # Email format');
  console.log('   node utils/convert-to-csv.mjs --crm-import    # CRM format\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
