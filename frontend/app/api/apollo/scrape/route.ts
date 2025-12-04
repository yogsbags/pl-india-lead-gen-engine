import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

interface ApolloPeopleSearchRequest {
  segment: string
  leadCount: number
}

interface ApolloPersonTitle {
  name: string
  role?: string
  sub_role?: string
  level?: string
}

interface ApolloOrganization {
  id: string
  name: string
  website_url?: string
  primary_domain?: string
  industry?: string
  num_employees?: number
  revenue?: number
  city?: string
  state?: string
  country?: string
}

interface ApolloPerson {
  id: string
  first_name: string
  last_name: string
  name: string
  linkedin_url?: string
  title?: string
  city?: string
  state?: string
  country?: string
  organization?: ApolloOrganization
  headline?: string
  photo_url?: string
}

interface ApolloSearchResponse {
  people: ApolloPerson[]
  pagination: {
    page: number
    per_page: number
    total_entries: number
    total_pages: number
  }
}

/**
 * Apollo Lead Scraping API Route
 *
 * Fetches leads from Apollo.io using lookalike profile-based search
 * Supports all 8 segments defined in config/segments.js
 */
export async function POST(request: NextRequest) {
  try {
    const body: ApolloPeopleSearchRequest = await request.json()
    const { segment, leadCount } = body

    // Validate input
    if (!segment) {
      return NextResponse.json(
        { success: false, error: 'segment is required' },
        { status: 400 }
      )
    }

    if (!leadCount || leadCount < 10 || leadCount > 50) {
      return NextResponse.json(
        { success: false, error: 'leadCount must be between 10 and 50' },
        { status: 400 }
      )
    }

    // Call Apollo API
    const apolloApiKey = process.env.APOLLO_API_KEY
    if (!apolloApiKey) {
      return NextResponse.json(
        { success: false, error: 'APOLLO_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Get segment-specific search criteria
    const searchCriteria = getSegmentCriteria(segment)

    // Call Apollo People Search API
    const response = await axios.post<ApolloSearchResponse>(
      'https://api.apollo.io/v1/mixed_people/search',
      {
        ...searchCriteria,
        page: 1,
        per_page: leadCount
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apolloApiKey
        }
      }
    )

    const leads = response.data.people || []

    return NextResponse.json({
      success: true,
      segment,
      leads,
      count: leads.length,
      pagination: response.data.pagination
    })

  } catch (error: any) {
    console.error('Apollo scraping error:', error.response?.data || error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to scrape leads'
      },
      { status: 500 }
    )
  }
}

/**
 * Get Apollo search criteria based on segment
 * Lookalike profile-based targeting
 */
function getSegmentCriteria(segment: string): Record<string, any> {
  const baseIndia = {
    person_locations: ['India'],
    organization_locations: ['India']
  }

  // Partners segments
  if (segment === 'partners-mega') {
    return {
      ...baseIndia,
      person_titles: ['CEO', 'Founder', 'Managing Director', 'Director', 'Partner'],
      organization_num_employees_ranges: ['51-200', '201-500', '501-1000', '1001-5000', '5001-10000'],
      q_keywords: 'wealth management OR financial advisor OR IFA OR portfolio management OR investment advisory',
      person_seniority: ['owner', 'c_suite', 'partner']
    }
  }

  if (segment === 'partners-large') {
    return {
      ...baseIndia,
      person_titles: ['CEO', 'Founder', 'Director', 'Managing Partner', 'Senior Partner'],
      organization_num_employees_ranges: ['11-50', '51-200', '201-500'],
      q_keywords: 'wealth management OR financial advisor OR IFA OR RIA',
      person_seniority: ['owner', 'c_suite', 'partner']
    }
  }

  if (segment === 'partners-medium') {
    return {
      ...baseIndia,
      person_titles: ['Founder', 'Director', 'Partner', 'Financial Advisor'],
      organization_num_employees_ranges: ['1-10', '11-50'],
      q_keywords: 'wealth advisor OR financial planner OR IFA',
      person_seniority: ['owner', 'partner', 'manager']
    }
  }

  if (segment === 'partners-small' || segment === 'partners-micro') {
    return {
      ...baseIndia,
      person_titles: ['Financial Advisor', 'Wealth Manager', 'Investment Consultant', 'IFA'],
      organization_num_employees_ranges: ['1-10'],
      q_keywords: 'financial advisor OR wealth manager OR independent financial advisor',
      person_seniority: ['owner', 'individual_contributor']
    }
  }

  // Client segments
  if (segment === 'uhni') {
    return {
      ...baseIndia,
      person_titles: ['CEO', 'Founder', 'Chairman', 'Managing Director', 'Owner'],
      organization_num_employees_ranges: ['201-500', '501-1000', '1001-5000', '5001-10000', '10001+'],
      q_keywords: 'entrepreneur OR business owner OR promoter OR chairman',
      person_seniority: ['owner', 'c_suite'],
      revenue_range: { min: 10000000 } // $10M+ revenue
    }
  }

  if (segment === 'hni') {
    return {
      ...baseIndia,
      person_titles: ['CEO', 'CFO', 'CTO', 'VP', 'Director', 'General Manager', 'Founder'],
      organization_num_employees_ranges: ['51-200', '201-500', '501-1000'],
      q_keywords: 'executive OR senior management OR C-level',
      person_seniority: ['c_suite', 'vp', 'director']
    }
  }

  if (segment === 'mass-affluent') {
    return {
      ...baseIndia,
      person_titles: ['Manager', 'Senior Manager', 'Assistant Vice President', 'Professional'],
      organization_num_employees_ranges: ['11-50', '51-200', '201-500'],
      q_keywords: 'manager OR professional OR consultant',
      person_seniority: ['manager', 'senior']
    }
  }

  // Default fallback
  return {
    ...baseIndia,
    q_keywords: 'executive OR manager OR professional'
  }
}

