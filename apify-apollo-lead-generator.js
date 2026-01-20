#!/usr/bin/env node

/**
 * Apify Apollo Lead Generator
 *
 * Uses cheaper Apify search-based actors ($0.75-$1.50/1k) with Apollo filter criteria
 * to generate new leads cost-effectively.
 *
 * Actors supported:
 * - supreme_coder/apollo-scraper ($0.75/1k) - CHEAPEST OPTION
 * - pipelinelabs/lead-scraper-apollo-zoominfo-lusha-ppe ($1/1k)
 * - code_crafter/leads-finder ($1.50/1k)
 *
 * Usage:
 *   export APIFY_API_TOKEN="your_apify_token"
 *   node apify-apollo-lead-generator.js --segment hni --actor supreme_coder
 *   node apify-apollo-lead-generator.js --segment mass_affluent --actor supreme_coder --limit 100
 */

const https = require('https');
const fs = require('fs');

// Configuration
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || '';
const OUTPUT_DIR = 'data/apify-leads';

// Parse command line arguments
const args = process.argv.slice(2);
const segmentIdx = args.indexOf('--segment');
const actorIdx = args.indexOf('--actor');
const limitIdx = args.indexOf('--limit');
const dryRunIdx = args.indexOf('--dry-run');

const SEGMENT = segmentIdx > -1 ? args[segmentIdx + 1] : 'hni';
const ACTOR_CHOICE = actorIdx > -1 ? args[actorIdx + 1] : 'supreme_coder';
const LIMIT = limitIdx > -1 ? parseInt(args[limitIdx + 1]) : null;
const DRY_RUN = dryRunIdx > -1;

// Actor configurations
const ACTORS = {
  supreme_coder: {
    id: 'supreme_coder/apollo-scraper',
    cost_per_1k: 0.75,
    name: 'Apollo Scraper (Cheapest)',
    build: 'latest',
    description: 'Cheapest option at $0.75/1k leads. Works with Apollo search URLs.'
  },
  pipelinelabs: {
    id: 'pipelinelabs/lead-scraper-apollo-zoominfo-lusha-ppe',
    cost_per_1k: 1.00,
    name: 'Lead Scraper (Apollo/ZoomInfo/Lusha)',
    build: 'latest'
  },
  code_crafter: {
    id: 'code_crafter/leads-finder',
    cost_per_1k: 1.50,
    name: 'Leads Finder',
    build: 'latest'
  }
};

// Apollo filter configurations (from apollo-filters-applied-summary.md)
// All 9 tested segments with proper naming convention
const APOLLO_FILTERS = {
  // PARTNERS SEGMENT (1A-1H) - All had 0 results
  '1a': {
    name: 'Partners - High-Performing IFAs',
    person_titles: [
      'Financial Advisor', 'Wealth Manager', 'Investment Advisor',
      'Independent Financial Advisor', 'IFA', 'Certified Financial Planner',
      'CFP', 'Financial Planner', 'Wealth Advisor', 'Senior Financial Advisor',
      'Principal Financial Advisor', 'Director - Wealth Management',
      'Partner - Financial Services', 'Mutual Fund Distributor', 'MFD',
      'AMFI Registered', 'Registered Investment Advisor', 'RIA'
    ],
    person_seniorities: ['owner', 'partner', 'director', 'senior'],
    person_locations: [
      'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Pune, India',
      'Ahmedabad, India', 'Hyderabad, India', 'Chennai, India',
      'Kolkata, India', 'Gurgaon, India', 'Noida, India',
      'Vadodara, India', 'Surat, India'
    ],
    organization_num_employees_ranges: ['1,10', '11,50', '50,500'],
    industries: [
      'Financial Services', 'Investment Management', 'Wealth Management',
      'Financial Advisory', 'Investment Advisory', 'Portfolio Management',
      'Financial Planning'
    ],
    experience_years: { min: 5, max: 45 },
    keywords: 'IFA OR CFP OR CWM OR AMFI registered OR SEBI RIA OR NISM certified OR mutual fund distributor',
    expected_results: 0,
    status: 'failed',
    note: 'Keywords may not match Apollo data format, or very specific combination'
  },

  '1b': {
    name: 'Partners - Retiring Bank RMs',
    person_titles: [
      'Relationship Manager', 'Branch Manager', 'Regional Head',
      'Private Banking RM', 'Wealth Manager', 'Senior Relationship Manager',
      'VP - Relationship Management', 'AVP - Relationship Management',
      'Country Head', 'Regional Manager'
    ],
    person_seniorities: ['manager', 'director', 'vp', 'senior'],
    person_locations: [
      'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Pune, India',
      'Ahmedabad, India', 'Hyderabad, India', 'Chennai, India',
      'Kolkata, India', 'Gurgaon, India', 'Noida, India'
    ],
    organization_num_employees_ranges: ['1001,5000', '5001,10000', '10001,50000', '50001,100000'],
    industries: [
      'Banking', 'Financial Services', 'Private Banking', 'Wealth Management',
      'ICICI Bank', 'HDFC Bank', 'Axis Bank', 'Kotak Bank', 'SBI', 'PNB',
      'Bank of Baroda'
    ],
    experience_years: { min: 20, max: 35 },
    keywords: 'retirement OR post-retirement OR advisory practice OR RIA OR CFP OR wealth advisor',
    expected_results: 0,
    status: 'failed',
    note: 'Keywords may not match Apollo data format, or very specific combination'
  },

  '1c': {
    name: 'Partners - CA Firms',
    person_titles: [
      'Chartered Accountant', 'CA', 'Tax Consultant', 'Partner', 'Founder',
      'Proprietor', 'Senior Partner', 'Managing Partner', 'Director',
      'Principal'
    ],
    person_seniorities: ['owner', 'partner', 'director', 'senior'],
    person_locations: [
      'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Pune, India',
      'Ahmedabad, India', 'Hyderabad, India', 'Chennai, India',
      'Kolkata, India', 'Gurgaon, India', 'Noida, India'
    ],
    organization_num_employees_ranges: ['1,10', '11,50'],
    industries: [
      'Accounting', 'Financial Services', 'Tax Consulting',
      'Business Consulting', 'CA Firm', 'Audit', 'Tax Planning'
    ],
    education_degree: ['professional'],
    keywords: 'Chartered Accountant OR CA OR ICAI OR tax consultant OR audit firm OR HNI clients',
    expected_results: 0,
    status: 'failed',
    note: '"CA Firm" may not be a recognized industry tag in Apollo'
  },

  '1d': {
    name: 'Partners - Regional Mega IFAs',
    person_titles: [
      'Founder', 'CEO', 'Managing Director', 'Principal', 'Family Office',
      'Chief Investment Officer', 'CIO', 'Director', 'Co-Founder'
    ],
    person_seniorities: ['c_suite', 'owner', 'founder', 'director'],
    person_locations: [
      'Ahmedabad, India', 'Surat, India', 'Vadodara, India', 'Pune, India',
      'Nagpur, India', 'Indore, India', 'Lucknow, India', 'Jaipur, India',
      'Udaipur, India', 'Jodhpur, India'
    ],
    organization_num_employees_ranges: ['11,50', '51,200'],
    industries: [
      'Financial Services', 'Wealth Management', 'Investment Advisory',
      'Family Office', 'Multi-Family Office', 'Investment Management'
    ],
    experience_years: { min: 15, max: 30 },
    keywords: 'multi-city OR multiple offices OR regional OR AUM OR assets under management',
    expected_results: 0,
    status: 'failed',
    note: 'Keywords may be too specific, or regional focus too narrow'
  },

  '1h': {
    name: 'Partners - Geographic Expansion (UP/MP/Rajasthan)',
    person_titles: [
      'Financial Advisor', 'Mutual Fund Distributor', 'Investment Consultant',
      'Financial Planner', 'Wealth Manager', 'IFA', 'Investment Advisor'
    ],
    person_seniorities: ['owner', 'partner', 'director', 'senior'],
    person_locations: [
      'Lucknow, India', 'Noida, India', 'Kanpur, India', 'Varanasi, India',
      'Agra, India', 'Indore, India', 'Bhopal, India', 'Gwalior, India',
      'Jabalpur, India', 'Jaipur, India', 'Jodhpur, India', 'Udaipur, India',
      'Kota, India', 'Ajmer, India'
    ],
    organization_num_employees_ranges: ['1,10', '11,50'],
    industries: [
      'Financial Services', 'Investment Management', 'Mutual Funds',
      'Insurance', 'Financial Advisory'
    ],
    experience_years: { min: 5, max: 20 },
    keywords: 'AMFI registered OR mutual fund distributor OR CFP OR financial advisor OR IFA OR independent',
    expected_results: 0,
    status: 'failed',
    note: 'Tier-2/3 cities may have limited Apollo coverage, or filters too restrictive'
  },

  // HNI SEGMENT (2A-2B) - Both successful
  '2a': {
    name: 'HNI - Business Owners & Entrepreneurs',
    person_titles: [
      'CEO', 'Founder', 'Managing Director', 'Co-Founder', 'Owner',
      'Proprietor', 'Director', 'Chairman', 'President', 'Business Owner',
      'Entrepreneur'
    ],
    person_seniorities: ['c_suite', 'owner', 'founder', 'director'],
    person_locations: [
      'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Pune, India',
      'Hyderabad, India', 'Chennai, India', 'Ahmedabad, India',
      'Kolkata, India', 'Gurgaon, India', 'Noida, India'
    ],
    organization_num_employees_ranges: ['51,200', '201,500', '501,1000'],
    industries: [
      'Technology', 'Manufacturing', 'Healthcare', 'Real Estate',
      'Pharmaceuticals', 'FMCG', 'E-commerce', 'Consulting',
      'Financial Services', 'Automotive', 'Textiles', 'Engineering'
    ],
    education_degree: ['bachelor', 'master', 'mba'],
    expected_results: 97495,
    status: 'success',
    note: 'Broader filters, no restrictive keywords, common titles'
  },

  '2b': {
    name: 'HNI - C-Suite Executives',
    person_titles: [
      'VP', 'Vice President', 'Director', 'Senior Director',
      'Country Head', 'Regional Head', 'General Manager'
    ],
    person_seniorities: ['c_suite', 'vp', 'director'],
    person_locations: [
      'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Pune, India',
      'Hyderabad, India', 'Chennai, India', 'Ahmedabad, India',
      'Kolkata, India', 'Gurgaon, India', 'Noida, India'
    ],
    organization_num_employees_ranges: ['501,1000', '1001,5000', '5001,10000'],
    industries: [
      'IT Services', 'Banking', 'Consulting', 'Technology',
      'Healthcare', 'Pharmaceuticals', 'E-commerce', 'Financial Services',
      'Fortune 500', 'MNC'
    ],
    education_degree: ['bachelor', 'master', 'mba'],
    expected_results: 102187,
    status: 'success',
    note: 'Standard corporate titles, large company sizes, no restrictive keywords'
  },

  // UHNI SEGMENT (3A) - Failed
  '3a': {
    name: 'UHNI - Promoters & Listed Company Owners',
    person_titles: [
      'Chairman', 'Promoter', 'Founder & CEO', 'Managing Director',
      'Executive Chairman', 'Non-Executive Chairman', 'Family Office',
      'Principal', 'Chief Executive Officer'
    ],
    person_seniorities: ['c_suite', 'owner', 'founder'],
    person_locations: [
      'Mumbai, India', 'Delhi, India', 'Bangalore, India',
      'Pune, India', 'Hyderabad, India', 'Gurgaon, India', 'Noida, India'
    ],
    organization_num_employees_ranges: ['1001,5000', '5001,10000', '10001,50000', '50001,100000'],
    industries: [
      'Public Company', 'Listed Company', 'Conglomerate',
      'Holding Company', 'Family Office', 'Private Equity', 'Investment Holding'
    ],
    education_degree: ['bachelor', 'master', 'mba'],
    keywords: 'listed OR promoter OR family office OR Forbes OR Hurun',
    expected_results: 0,
    status: 'failed',
    note: '"Promoter" title may not exist in Apollo, or "Listed Company" industry tag not recognized'
  },

  // MASS AFFLUENT SEGMENT (4A) - Successful
  '4a': {
    name: 'Mass Affluent - Mid-Senior Corporate Professionals',
    person_titles: [
      'Vice President', 'VP', 'Director', 'Senior Director',
      'Associate Director', 'Senior Manager', 'Manager', 'Lead',
      'Principal', 'Senior Consultant', 'Specialist', 'Head', 'Senior Head'
    ],
    person_seniorities: ['director', 'manager', 'senior'],
    person_locations: [
      'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Pune, India',
      'Hyderabad, India', 'Chennai, India', 'Ahmedabad, India',
      'Kolkata, India', 'Gurgaon, India', 'Noida, India',
      'Chandigarh, India', 'Jaipur, India', 'Indore, India',
      'Nagpur, India', 'Nashik, India'
    ],
    organization_num_employees_ranges: ['501,1000', '1001,5000', '5001,10000', '10001,50000'],
    industries: [
      'IT Services', 'Banking', 'Consulting', 'Technology',
      'Healthcare', 'Pharmaceuticals', 'E-commerce', 'Financial Services',
      'Fortune 500', 'MNC'
    ],
    education_degree: ['bachelor', 'master', 'mba'],
    education_schools: ['IIT', 'IIM', 'BITS', 'NIT', 'ISB'],
    experience_years: { min: 8, max: 20 },
    expected_results: 1535441,
    status: 'success',
    note: 'Very broad filters covering common corporate roles across large companies'
  }
};

/**
 * Transform Apollo filters to Apify Pipelinelabs actor input
 */
function transformToPipelinelabs(filters) {
  const input = {
    // Job titles
    contact_job_title: filters.person_titles,

    // Seniority mapping
    seniority_level: filters.person_seniorities.map(s => {
      const mapping = {
        'c_suite': 'C-Suite',
        'vp': 'VP',
        'director': 'Director',
        'manager': 'Manager',
        'senior': 'Senior',
        'owner': 'Owner',
        'founder': 'Founder'
      };
      return mapping[s] || s;
    }),

    // Locations
    contact_location: filters.person_locations,

    // Company size (employee ranges)
    size: filters.organization_num_employees_ranges.map(range => {
      // Convert "51,200" to employee range format
      const [min, max] = range.split(',').map(n => parseInt(n));
      if (max <= 10) return '1-10';
      if (max <= 50) return '11-50';
      if (max <= 200) return '51-200';
      if (max <= 500) return '201-500';
      if (max <= 1000) return '501-1,000';
      if (max <= 5000) return '1,001-5,000';
      if (max <= 10000) return '5,001-10,000';
      return '10,001+';
    }),

    // Industries
    industry: filters.industries,

    // Education
    contact_education_degree: filters.education_degree,
    contact_education_school: filters.education_schools || [],

    // Experience (if available)
    contact_years_experience_min: filters.experience_years?.min,
    contact_years_experience_max: filters.experience_years?.max,

    // Output settings
    per_page: LIMIT || 50,
    max_pages: LIMIT ? Math.ceil(LIMIT / 50) : 20
  };

  return input;
}

/**
 * Transform Apollo filters to Apify Supreme Coder actor input
 * This actor works with Apollo search URLs - we build the URL from filters
 */
function transformToSupremeCoder(filters) {
  // Build Apollo search URL from filters
  // Format: https://app.apollo.io/#/people?finderViewId=...&person_titles[]=CEO&...
  const baseUrl = 'https://app.apollo.io/#/people';
  const params = new URLSearchParams();
  
  // Add person titles
  if (filters.person_titles && filters.person_titles.length > 0) {
    filters.person_titles.forEach(title => {
      params.append('person_titles[]', title);
    });
  }
  
  // Add locations
  if (filters.person_locations && filters.person_locations.length > 0) {
    filters.person_locations.forEach(location => {
      params.append('person_locations[]', location);
    });
  }
  
  // Add organization locations
  if (filters.organization_locations && filters.organization_locations.length > 0) {
    filters.organization_locations.forEach(location => {
      params.append('organization_locations[]', location);
    });
  }
  
  // Add seniority
  if (filters.person_seniorities && filters.person_seniorities.length > 0) {
    filters.person_seniorities.forEach(seniority => {
      params.append('person_seniorities[]', seniority);
    });
  }
  
  // Add company size
  if (filters.organization_num_employees_ranges && filters.organization_num_employees_ranges.length > 0) {
    filters.organization_num_employees_ranges.forEach(range => {
      params.append('organization_num_employees_ranges[]', range);
    });
  }
  
  // Add industries
  if (filters.industries && filters.industries.length > 0) {
    filters.industries.forEach(industry => {
      params.append('industries[]', industry);
    });
  }
  
  // Add keywords if available
  if (filters.q_keywords) {
    params.append('q_keywords', filters.q_keywords);
  }
  
  const searchUrl = `${baseUrl}?${params.toString()}`;
  
  // Supreme Coder Apollo Scraper input format
  // This actor works with Apollo search URLs directly
  const input = {
    searchUrl: searchUrl, // Single URL or array of URLs
    maxPages: LIMIT ? Math.ceil(LIMIT / 25) : 10, // Apollo shows 25 per page
    includeEmails: true,
    includePhones: false, // Phone requires webhook, skip for now
    proxyConfiguration: {
      useApifyProxy: true
    },
    // Optional: limit results
    maxResults: LIMIT || null
  };
  
  return input;
}

/**
 * Transform Apollo filters to Apify Code Crafter actor input
 */
function transformToCodeCrafter(filters) {
  const input = {
    // Job titles
    jobTitles: filters.person_titles,

    // Seniority
    seniorities: filters.person_seniorities,

    // Locations
    locations: filters.person_locations,

    // Company size
    companySizes: filters.organization_num_employees_ranges.map(range => {
      const [min, max] = range.split(',').map(n => parseInt(n));
      return { min, max };
    }),

    // Industries
    industries: filters.industries,

    // Education
    educationDegrees: filters.education_degree,
    educationSchools: filters.education_schools || [],

    // Experience
    yearsOfExperience: filters.experience_years ? {
      min: filters.experience_years.min,
      max: filters.experience_years.max
    } : undefined,

    // Output settings
    maxResults: LIMIT || 1000
  };

  return input;
}

/**
 * Execute Apify actor
 */
async function executeApifyActor(actorId, input) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(input);

    const options = {
      hostname: 'api.apify.com',
      path: `/v2/acts/${actorId}/runs?token=${APIFY_API_TOKEN}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);

          if (res.statusCode === 201) {
            resolve(response.data);
          } else {
            reject(new Error(`Apify API error: ${res.statusCode} - ${responseData}`));
          }
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Wait for actor run to complete and fetch results
 */
async function waitForResults(runId, actorId) {
  const maxWaitTime = 600000; // 10 minutes
  const pollInterval = 5000; // 5 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const status = await checkRunStatus(runId, actorId);

    console.log(`[${new Date().toISOString()}] Run status: ${status.status}`);

    if (status.status === 'SUCCEEDED') {
      return await fetchDataset(status.defaultDatasetId);
    } else if (status.status === 'FAILED' || status.status === 'ABORTED') {
      throw new Error(`Actor run ${status.status.toLowerCase()}: ${status.statusMessage || 'Unknown error'}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Actor run timed out after 10 minutes');
}

/**
 * Check actor run status
 */
async function checkRunStatus(runId, actorId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.apify.com',
      path: `/v2/acts/${actorId}/runs/${runId}?token=${APIFY_API_TOKEN}`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data).data);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Fetch dataset results
 */
async function fetchDataset(datasetId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.apify.com',
      path: `/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Save results to files
 */
function saveResults(segment, actor, results, runInfo) {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const baseFilename = `${segment}_${actor}_${timestamp}`;

  // Save JSON
  const jsonFile = `${OUTPUT_DIR}/${baseFilename}.json`;
  fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));

  // Save CSV
  if (results.length > 0) {
    const headers = Object.keys(results[0]);
    const csvContent = [
      headers.join(','),
      ...results.map(r => headers.map(h => `"${r[h] || ''}"`).join(','))
    ].join('\n');

    const csvFile = `${OUTPUT_DIR}/${baseFilename}.csv`;
    fs.writeFileSync(csvFile, csvContent);

    console.log(`\n📁 Results saved:`);
    console.log(`   JSON: ${jsonFile}`);
    console.log(`   CSV:  ${csvFile}`);
  }

  // Save summary
  const summary = {
    segment: APOLLO_FILTERS[segment].name,
    actor: ACTORS[actor].name,
    actor_id: ACTORS[actor].id,
    timestamp,
    run_id: runInfo.id,
    status: runInfo.status,
    total_leads: results.length,
    cost_estimate: `$${(results.length / 1000 * ACTORS[actor].cost_per_1k).toFixed(2)}`,
    expected_results: APOLLO_FILTERS[segment].expected_results,
    actual_vs_expected: APOLLO_FILTERS[segment].expected_results > 0
      ? `${Math.round(results.length / APOLLO_FILTERS[segment].expected_results * 100)}%`
      : 'N/A'
  };

  const summaryFile = `${OUTPUT_DIR}/${baseFilename}_summary.json`;
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

  console.log(`\n📊 Summary:`);
  console.log(`   Total Leads: ${summary.total_leads}`);
  console.log(`   Cost Estimate: ${summary.cost_estimate}`);
  console.log(`   Expected: ${summary.expected_results} leads`);
  console.log(`   Actual vs Expected: ${summary.actual_vs_expected}`);

  return summary;
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(80));
  console.log('Apify Apollo Lead Generator');
  console.log('='.repeat(80));

  // Validate inputs
  if (!APIFY_API_TOKEN && !DRY_RUN) {
    console.error('\n❌ Error: APIFY_API_TOKEN not set!\n');
    console.log('Set your Apify API token:');
    console.log('  export APIFY_API_TOKEN="your_token_here"\n');
    console.log('Or run in dry-run mode to see the input configuration:');
    console.log('  node apify-apollo-lead-generator.js --segment hni --actor pipelinelabs --dry-run\n');
    process.exit(1);
  }

  if (!APOLLO_FILTERS[SEGMENT]) {
    console.error(`\n❌ Error: Invalid segment "${SEGMENT}"\n`);
    console.log('Valid segments:', Object.keys(APOLLO_FILTERS).join(', '));
    process.exit(1);
  }

  if (!ACTORS[ACTOR_CHOICE]) {
    console.error(`\n❌ Error: Invalid actor "${ACTOR_CHOICE}"\n`);
    console.log('Valid actors:', Object.keys(ACTORS).join(', '));
    process.exit(1);
  }

  const actor = ACTORS[ACTOR_CHOICE];
  const filters = APOLLO_FILTERS[SEGMENT];

  console.log(`\nSegment:         ${filters.name}`);
  console.log(`Actor:           ${actor.name} (${actor.id})`);
  console.log(`Cost:            $${actor.cost_per_1k}/1k leads`);
  console.log(`Expected Leads:  ${filters.expected_results.toLocaleString()}`);
  console.log(`Limit:           ${LIMIT || 'None (run full search)'}`);
  console.log(`Mode:            ${DRY_RUN ? 'DRY RUN (no execution)' : 'LIVE'}`);
  console.log('='.repeat(80));

  // Transform filters to actor input
  console.log('\n🔄 Transforming Apollo filters to Apify input...\n');

  let actorInput;
  if (ACTOR_CHOICE === 'supreme_coder') {
    actorInput = transformToSupremeCoder(filters);
  } else if (ACTOR_CHOICE === 'pipelinelabs') {
    actorInput = transformToPipelinelabs(filters);
  } else {
    actorInput = transformToCodeCrafter(filters);
  }

  console.log('Actor Input Configuration:');
  console.log(JSON.stringify(actorInput, null, 2));

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete. Input configuration generated successfully.');
    console.log('\nTo execute for real, remove --dry-run flag:');
    console.log(`  node apify-apollo-lead-generator.js --segment ${SEGMENT} --actor ${ACTOR_CHOICE}${LIMIT ? ` --limit ${LIMIT}` : ''}\n`);
    return;
  }

  // Execute actor
  console.log('\n🚀 Starting Apify actor...\n');

  try {
    const run = await executeApifyActor(actor.id, actorInput);
    console.log(`✅ Actor started successfully!`);
    console.log(`   Run ID: ${run.id}`);
    console.log(`   Status: ${run.status}`);
    console.log(`   View run: https://console.apify.com/actors/runs/${run.id}\n`);

    // Wait for completion and fetch results
    console.log('⏳ Waiting for actor to complete...\n');
    const results = await waitForResults(run.id, actor.id);

    console.log(`\n✅ Actor completed successfully!`);
    console.log(`   Total leads found: ${results.length}`);

    // Save results
    const summary = saveResults(SEGMENT, ACTOR_CHOICE, results, run);

    // Cost analysis
    console.log('\n💰 Cost Analysis:');
    console.log(`   Leads generated: ${results.length}`);
    console.log(`   Cost per lead: $${(actor.cost_per_1k / 1000).toFixed(4)}`);
    console.log(`   Total cost: ${summary.cost_estimate}`);

    console.log('\n🎉 Lead generation complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
