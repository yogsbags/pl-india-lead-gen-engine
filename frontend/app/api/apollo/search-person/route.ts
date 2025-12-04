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
 * Apollo Person Search API Route
 *
 * Searches for people on Apollo using a query string (name, title, company, etc.)
 * Returns up to 25 search results for manual selection
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

    // Call Apollo People Search API with minimal filters
    // Let Apollo's search algorithm handle the query parsing
    const response = await axios.post<ApolloSearchResponse>(
      'https://api.apollo.io/v1/mixed_people/search',
      {
        q_keywords: query,
        page: 1,
        per_page: 25,
        person_locations: ['India'] // Default to India for PL Capital's target market
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
    const searchResults = people.map(person => ({
      id: person.id,
      name: person.name,
      first_name: person.first_name,
      last_name: person.last_name,
      title: person.title || '',
      company: person.organization?.name || '',
      email: person.email,
      phone: person.phone,
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
      pagination: response.data.pagination
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
