import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

interface PersonSearchRequest {
  query: string
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
  email?: string
  phone?: string
  city?: string
  state?: string
  country?: string
  organization?: ApolloOrganization
  headline?: string
  photo_url?: string
  email_status?: string
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
 * Parse search query to extract structured parameters
 * Detects: titles, locations, company names, and person names
 */
function parseSearchQuery(query: string): Record<string, any> {
  const queryLower = query.toLowerCase().trim()
  const params: Record<string, any> = {}

  // Common job titles (case-insensitive)
  const titleKeywords = [
    'ceo', 'cto', 'cfo', 'coo', 'founder', 'co-founder', 'cofounder',
    'president', 'chairman', 'managing director', 'md', 'director',
    'vp', 'vice president', 'head', 'manager', 'senior manager',
    'partner', 'owner', 'chief'
  ]

  // Indian cities (Tier 1 and Tier 2)
  const locationKeywords = [
    'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai',
    'kolkata', 'pune', 'ahmedabad', 'gurgaon', 'gurugram', 'noida',
    'ncr', 'chandigarh', 'jaipur', 'lucknow', 'kochi', 'indore',
    'bhopal', 'nagpur', 'surat', 'vadodara', 'coimbatore', 'kochi'
  ]

  // Extract titles
  const foundTitles: string[] = []
  for (const title of titleKeywords) {
    const regex = new RegExp(`\\b${title}\\b`, 'i')
    if (regex.test(queryLower)) {
      // Capitalize properly
      const properTitle = title
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      foundTitles.push(properTitle)
    }
  }

  // Extract locations
  const foundLocations: string[] = []
  for (const location of locationKeywords) {
    const regex = new RegExp(`\\b${location}\\b`, 'i')
    if (regex.test(queryLower)) {
      // Capitalize properly
      const properLocation = location.charAt(0).toUpperCase() + location.slice(1)
      foundLocations.push(properLocation)
    }
  }

  // Build search parameters
  if (foundTitles.length > 0) {
    params.person_titles = foundTitles
  }

  if (foundLocations.length > 0) {
    params.person_locations = foundLocations.map(loc => `${loc}, India`)
  } else {
    // Default to India if no specific location mentioned
    params.person_locations = ['India']
  }

  // Remove detected keywords from query to extract person/company name
  let remainingQuery = query
  foundTitles.forEach(title => {
    remainingQuery = remainingQuery.replace(new RegExp(`\\b${title}\\b`, 'gi'), '')
  })
  foundLocations.forEach(loc => {
    remainingQuery = remainingQuery.replace(new RegExp(`\\b${loc}\\b`, 'gi'), '')
  })

  // Clean up remaining query (remove extra spaces, 'at', 'in', etc.)
  remainingQuery = remainingQuery
    .replace(/\b(at|in|from|,)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // If we have remaining text, use it for keyword search (person/company name)
  if (remainingQuery) {
    params.q_keywords = remainingQuery
  }

  // If no structured parameters extracted, fall back to full query in keywords
  if (!params.q_keywords && foundTitles.length === 0) {
    params.q_keywords = query
  }

  return params
}

/**
 * Apollo Person Search API Route (Updated for January 15, 2026 Migration)
 *
 * Searches for people on Apollo using a query string (name, title, company, etc.)
 * Returns up to 25 search results for manual selection
 *
 * Intelligently parses queries like:
 * - "Rajesh Sharma CEO Mumbai" → name: Rajesh Sharma, title: CEO, location: Mumbai
 * - "Founder Bangalore" → title: Founder, location: Bangalore
 * - "CFO at Reliance" → title: CFO, company: Reliance
 *
 * NEW WORKFLOW (Jan 15, 2026+):
 * - Returns shallow contact profiles (preview data without full enrichment)
 * - Email/phone numbers NOT included in shallow profiles (null by default)
 * - Shallow search is FREE (no credit cost)
 * - To get full contact data, use /api/apollo/enrich endpoint with selected person IDs
 */
export async function POST(request: NextRequest) {
  try {
    const body: PersonSearchRequest = await request.json()
    const { query } = body

    // Validate input
    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: false, error: 'query is required' },
        { status: 400 }
      )
    }

    // Check Apollo API key
    const apolloApiKey = process.env.APOLLO_API_KEY
    if (!apolloApiKey) {
      return NextResponse.json(
        { success: false, error: 'APOLLO_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Parse query to extract structured search parameters
    const searchParams = parseSearchQuery(query)

    // Call NEW Apollo People Search API (returns shallow profiles - FREE)
    const response = await axios.post<ApolloSearchResponse>(
      'https://api.apollo.io/v1/Mixed_people/api_search',
      {
        ...searchParams,
        page: 1,
        per_page: 25
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apolloApiKey
        }
      }
    )

    const people = response.data.people || []

    // Transform to SearchResult format expected by frontend
    // NOTE: email and phone will be null in shallow profiles (not enriched)
    const searchResults = people.map(person => ({
      id: person.id,
      name: person.name,
      first_name: person.first_name,
      last_name: person.last_name,
      title: person.title || '',
      company: person.organization?.name || '',
      email: person.email || null, // Will be null in shallow profiles
      phone: person.phone || null, // Will be null in shallow profiles
      linkedin_url: person.linkedin_url,
      city: person.city,
      state: person.state,
      employee_count: person.organization?.num_employees,
      industry: person.organization?.industry,
      email_confidence: person.email_status === 'verified' ? 95 : 0
    }))

    return NextResponse.json({
      success: true,
      people: searchResults,
      count: searchResults.length,
      pagination: response.data.pagination,
      enriched: false,
      message: 'Shallow profiles returned (no credit cost). Use /api/apollo/enrich to get email/phone data.'
    })

  } catch (error: any) {
    console.error('Apollo person search error:', error.response?.data || error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to search people'
      },
      { status: 500 }
    )
  }
}
