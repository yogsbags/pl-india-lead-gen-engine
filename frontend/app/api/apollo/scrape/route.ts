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
 * Apollo Lead Scraping API Route (Updated for January 15, 2026 Migration)
 *
 * Fetches leads from Apollo.io using lookalike profile-based search
 * Supports all 8 segments defined in config/segments.js
 *
 * NEW WORKFLOW (Jan 15, 2026+):
 * - Returns shallow contact profiles (preview data without full enrichment)
 * - Email/phone numbers not included in shallow profiles (use enrichment endpoint separately)
 * - Shallow search is FREE (no credit cost)
 * - To get full contact data, use /api/apollo/enrich endpoint with selected lead IDs
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

    console.log('Apollo Search Request (Shallow):', JSON.stringify({
      segment,
      leadCount,
      searchCriteria
    }, null, 2))

    // Call Apollo People Search API (returns shallow profiles - FREE)
    const requestPayload = {
      ...searchCriteria,
      page: 1,
      per_page: leadCount
    }

    console.log('Apollo API Request URL: https://api.apollo.io/v1/Mixed_people/api_search')
    console.log('Apollo API Request Payload:', JSON.stringify(requestPayload, null, 2))

    let response
    try {
      response = await axios.post<ApolloSearchResponse>(
        'https://api.apollo.io/v1/Mixed_people/api_search',
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'X-Api-Key': apolloApiKey
          },
          validateStatus: () => true // Don't throw on HTTP errors
        }
      )

      // Check for API errors
      if (response.status !== 200) {
        console.error('Apollo API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        })
        throw new Error(`Apollo API returned ${response.status}: ${JSON.stringify(response.data || response.statusText)}`)
      }
    } catch (apiError: any) {
      // If axios throws, it's a network/connection error
      if (apiError.response) {
        console.error('Apollo API Error:', {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: apiError.response.data
        })
        throw new Error(`Apollo API error (${apiError.response.status}): ${JSON.stringify(apiError.response.data || apiError.response.statusText)}`)
      }
      throw apiError
    }

    console.log('Apollo Search Response:', JSON.stringify({
      peopleCount: response.data.people?.length || 0,
      pagination: response.data.pagination
    }, null, 2))

    const leads = response.data.people || []

    return NextResponse.json({
      success: true,
      segment,
      leads,
      count: leads.length,
      pagination: response.data.pagination,
      enriched: false,
      message: 'Shallow profiles returned (no credit cost). Use /api/apollo/enrich to get full contact data.'
    })

  } catch (error: any) {
    console.error('Apollo scraping error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    })

    // Provide more helpful error messages
    let errorMessage = error.message || 'Failed to scrape leads'
    let statusCode = 500

    if (error.response) {
      statusCode = error.response.status || 500
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error
        } else {
          errorMessage = JSON.stringify(error.response.data)
        }
      } else {
        errorMessage = `Apollo API returned ${statusCode}: ${error.response.statusText || 'Unknown error'}`
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error.response?.data || undefined,
        statusCode: statusCode
      },
      { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
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
      person_titles: [
        'Vice President',
        'Director',
        'Senior Manager',
        'Head',
        'General Manager',
        'Assistant Vice President'
      ],
      // Keep to mid-large companies to avoid small-firm noise; titles-only works better than keyword filters
      organization_num_employees_ranges: ['201-500', '501-1000', '1001-5000', '5001-10000', '10001+']
    }
  }

  // Default fallback
  return {
    ...baseIndia,
    q_keywords: 'executive OR manager OR professional'
  }
}
