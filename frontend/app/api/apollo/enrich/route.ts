import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

interface EnrichmentRequest {
  leads: Array<{
    id: string
    first_name: string
    last_name: string
    organization?: {
      name?: string
      website_url?: string
      primary_domain?: string
    }
    linkedin_url?: string
  }>
}

interface ApolloPhoneNumber {
  raw_number?: string
  sanitized_number?: string
  type?: string
  position?: number
}

interface ApolloEnrichedPerson {
  id: string
  first_name: string
  last_name: string
  name: string
  email?: string
  email_status?: string
  email_confidence_score?: number
  phone_numbers?: ApolloPhoneNumber[]
  mobile_phone?: string
  corporate_phone?: string
  title?: string
  headline?: string
  linkedin_url?: string
  twitter_url?: string
  facebook_url?: string
  city?: string
  state?: string
  country?: string
  organization?: {
    id?: string
    name?: string
    website_url?: string
    primary_domain?: string
    industry?: string
    keywords?: string[]
    estimated_num_employees?: number
    annual_revenue?: number
    total_funding?: number
    city?: string
    state?: string
    country?: string
  }
  departments?: string[]
  subdepartments?: string[]
  functions?: string[]
  seniority?: string
}

interface EnrichedLead {
  id: string
  name: string
  first_name: string
  last_name: string
  email: string
  email_confidence: number
  phone?: string
  mobile_phone?: string
  corporate_phone?: string
  title?: string
  headline?: string
  linkedin_url?: string
  company?: string
  company_website?: string
  industry?: string
  employee_count?: number
  annual_revenue?: number
  city?: string
  state?: string
  country?: string
  seniority?: string
  departments?: string[]
}

/**
 * Apollo Lead Enrichment API Route
 *
 * Enriches leads with email addresses, phone numbers, and company data
 * Filters leads with email_confidence_score > 80%
 *
 * **Bulk Optimization**: Uses Apollo's bulk_match endpoint for multiple leads (faster, fewer API calls)
 */
export async function POST(request: NextRequest) {
  try {
    const body: EnrichmentRequest = await request.json()
    const { leads } = body

    // Validate input
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'leads array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Call Apollo Enrichment API
    const apolloApiKey = process.env.APOLLO_API_KEY
    if (!apolloApiKey) {
      return NextResponse.json(
        { success: false, error: 'APOLLO_API_KEY not configured' },
        { status: 500 }
      )
    }

    const enrichedLeads: EnrichedLead[] = []
    const failedLeads: string[] = []
    let totalConfidence = 0

    // Check if leads already have emails from shallow search
    // If they do, use them directly without enrichment (saves API credits)
    const leadsWithEmails = leads.filter(lead => lead.email && lead.email_confidence_score && lead.email_confidence_score > 80)
    const leadsNeedingEnrichment = leads.filter(lead => !lead.email || !lead.email_confidence_score || lead.email_confidence_score <= 80)

    console.log('Enrichment analysis:', {
      totalLeads: leads.length,
      alreadyHaveEmails: leadsWithEmails.length,
      needEnrichment: leadsNeedingEnrichment.length
    })

    // Use existing emails directly (no API call needed)
    for (const lead of leadsWithEmails) {
      enrichedLeads.push({
        id: lead.id,
        name: lead.name || `${lead.first_name} ${lead.last_name}`,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        email_confidence: lead.email_confidence_score || 95,
        phone: lead.phone || lead.mobile_phone || lead.corporate_phone,
        mobile_phone: lead.mobile_phone,
        corporate_phone: lead.corporate_phone,
        title: lead.title,
        headline: lead.headline,
        linkedin_url: lead.linkedin_url,
        company: lead.organization?.name,
        company_website: lead.organization?.website_url,
        industry: lead.organization?.industry,
        employee_count: lead.organization?.num_employees || lead.organization?.estimated_num_employees,
        annual_revenue: lead.organization?.annual_revenue,
        city: lead.city || lead.organization?.city,
        state: lead.state || lead.organization?.state,
        country: lead.country || lead.organization?.country,
        seniority: lead.seniority,
        departments: lead.departments
      })
      totalConfidence += lead.email_confidence_score || 95
    }

    // Only enrich leads that don't have emails or have low confidence
    if (leadsNeedingEnrichment.length === 0) {
      console.log('All leads already have emails, skipping enrichment API call')
      const avgConfidence = enrichedLeads.length > 0 ? totalConfidence / enrichedLeads.length : 0
      return NextResponse.json({
        success: true,
        leads: enrichedLeads,
        stats: {
          total: leads.length,
          enriched: enrichedLeads.length,
          with_email: enrichedLeads.length,
          with_phone: enrichedLeads.filter(l => l.phone).length,
          avg_confidence: Math.round(avgConfidence * 10) / 10,
          failed: failedLeads.length,
          bulk_api_used: false,
          used_existing_emails: true
        },
        failedLeads: failedLeads.length > 0 ? failedLeads : undefined
      })
    }

    // Use bulk endpoint for multiple leads, single endpoint for one lead
    const useBulkApi = leadsNeedingEnrichment.length > 1

    if (useBulkApi) {
      // **BULK ENRICHMENT** - Process all leads in single API call
      try {
        // Prepare bulk match request
        // Use Apollo person ID if available (from shallow profile search), otherwise match by identifiers
        const bulkRequestBody = {
          details: leadsNeedingEnrichment.map(lead => {
            // If lead has Apollo person ID, use it for direct lookup (most reliable)
            if (lead.id) {
              return {
                id: lead.id  // Use Apollo person ID if available - reveal flags are at top level
              }
            }
            // Otherwise, match by identifiers (name, company, LinkedIn, etc.)
            return {
              first_name: lead.first_name,
              last_name: lead.last_name,
              organization_name: lead.organization?.name,
              domain: lead.organization?.website_url || lead.organization?.primary_domain || undefined,
              linkedin_url: lead.linkedin_url
            }
          }),
          reveal_personal_emails: true
          // Note: reveal_phone_number requires webhook_url, so we skip it
          // Phone numbers may still be included if available in Apollo's response
        }

        console.log('Bulk enrichment request:', JSON.stringify({
          totalLeads: leads.length,
          leadsNeedingEnrichment: leadsNeedingEnrichment.length,
          detailsCount: bulkRequestBody.details.length,
          usingIds: bulkRequestBody.details.filter((d: any) => d.id).length
        }, null, 2))

        const response = await axios.post<{ matches: ApolloEnrichedPerson[]; error?: string }>(
          'https://api.apollo.io/v1/people/bulk_match',
          bulkRequestBody,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': apolloApiKey
            },
            validateStatus: () => true // Don't throw on HTTP errors
          }
        )

        // Check for API errors in response
        if (response.status !== 200 || response.data.error) {
          throw new Error(response.data.error || `Apollo API returned ${response.status}`)
        }

        console.log('Bulk enrichment response:', JSON.stringify({
          matchesCount: response.data.matches?.length || 0,
          matches: response.data.matches?.slice(0, 2) // Log first 2 for debugging
        }, null, 2))

        const matches = response.data.matches || []

        // Process bulk results
        // Note: Apollo may return null values in matches array if no match found
        for (let i = 0; i < leadsNeedingEnrichment.length; i++) {
          const lead = leadsNeedingEnrichment[i]
          const person = matches[i]

          // Skip null matches (Apollo couldn't match this lead)
          if (!person || person === null) {
            console.warn(`No match found for lead ${i + 1}:`, {
              id: lead.id,
              name: `${lead.first_name} ${lead.last_name}`,
              company: lead.organization?.name,
              linkedin: lead.linkedin_url
            })
            failedLeads.push(`${lead.first_name || 'Unknown'} ${lead.last_name || ''} (no match found)`)
            continue
          }

          console.log(`Processing match ${i + 1}:`, {
            id: person.id,
            name: person.name,
            hasEmail: !!person.email,
            emailConfidence: person.email_confidence_score,
            hasPhone: !!(person.phone_numbers?.length || person.mobile_phone || person.corporate_phone)
          })

          // Only include leads with email and confidence > 80%
          if (person.email && person.email_confidence_score && person.email_confidence_score > 80) {
            totalConfidence += person.email_confidence_score

            enrichedLeads.push({
              id: person.id,
              name: person.name,
              first_name: person.first_name,
              last_name: person.last_name,
              email: person.email,
              email_confidence: person.email_confidence_score,
              phone: person.phone_numbers?.[0]?.sanitized_number || person.mobile_phone || person.corporate_phone,
              mobile_phone: person.mobile_phone,
              corporate_phone: person.corporate_phone,
              title: person.title,
              headline: person.headline,
              linkedin_url: person.linkedin_url,
              company: person.organization?.name,
              company_website: person.organization?.website_url,
              industry: person.organization?.industry,
              employee_count: person.organization?.estimated_num_employees,
              annual_revenue: person.organization?.annual_revenue,
              city: person.city || person.organization?.city,
              state: person.state || person.organization?.state,
              country: person.country || person.organization?.country,
              seniority: person.seniority,
              departments: person.departments
            })
          } else {
            console.warn(`Lead ${i + 1} filtered out:`, {
              name: person.name,
              hasEmail: !!person.email,
              emailConfidence: person.email_confidence_score,
              reason: !person.email ? 'no email' : (person.email_confidence_score && person.email_confidence_score <= 80) ? 'low confidence' : 'unknown'
            })
            failedLeads.push(`${person.first_name || lead.first_name} ${person.last_name || lead.last_name} (${!person.email ? 'no email' : `email confidence: ${person.email_confidence_score || 0}%`})`)
          }
        }

      } catch (error: any) {
        console.error('Bulk enrichment error:', error.response?.data || error.message)

        // Fallback to sequential enrichment if bulk API fails
        console.warn('Bulk API failed, falling back to sequential enrichment...')
        const fallbackResults = await fallbackToSequentialEnrichment(leadsNeedingEnrichment, apolloApiKey)
        // Merge fallback results with existing enriched leads
        enrichedLeads.push(...fallbackResults.leads)
        failedLeads.push(...(fallbackResults.failedLeads || []))
        totalConfidence += fallbackResults.totalConfidence || 0
      }

    } else {
      // **SINGLE LEAD ENRICHMENT** - Use original single-person endpoint
      const lead = leadsNeedingEnrichment[0]

      try {
        const response = await axios.post<{ person: ApolloEnrichedPerson }>(
          'https://api.apollo.io/v1/people/match',
          {
            first_name: lead.first_name,
            last_name: lead.last_name,
            organization_name: lead.organization?.name,
            domain: lead.organization?.website_url,
            linkedin_url: lead.linkedin_url,
            reveal_personal_emails: true
            // Note: reveal_phone_number requires webhook_url, skipping for now
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': apolloApiKey
            }
          }
        )

        const person = response.data.person

        // Only include leads with email and confidence > 80%
        if (person.email && person.email_confidence_score && person.email_confidence_score > 80) {
          totalConfidence += person.email_confidence_score

          enrichedLeads.push({
            id: person.id,
            name: person.name,
            first_name: person.first_name,
            last_name: person.last_name,
            email: person.email,
            email_confidence: person.email_confidence_score,
            phone: person.phone_numbers?.[0]?.sanitized_number,
            mobile_phone: person.mobile_phone,
            corporate_phone: person.corporate_phone,
            title: person.title,
            headline: person.headline,
            linkedin_url: person.linkedin_url,
            company: person.organization?.name,
            company_website: person.organization?.website_url,
            industry: person.organization?.industry,
            employee_count: person.organization?.estimated_num_employees,
            annual_revenue: person.organization?.annual_revenue,
            city: person.organization?.city,
            state: person.organization?.state,
            country: person.organization?.country,
            seniority: person.seniority,
            departments: person.departments
          })
        } else {
          failedLeads.push(`${lead.first_name} ${lead.last_name} (low email confidence or no email)`)
        }

      } catch (error: any) {
        console.error(`Enrichment failed for ${lead.first_name} ${lead.last_name}:`, error.response?.data || error.message)
        failedLeads.push(`${lead.first_name} ${lead.last_name} (API error)`)
      }
    }

    const avgConfidence = enrichedLeads.length > 0 ? totalConfidence / enrichedLeads.length : 0

    return NextResponse.json({
      success: true,
      leads: enrichedLeads,
      stats: {
        total: leads.length,
        enriched: enrichedLeads.length,
        with_email: enrichedLeads.length,
        with_phone: enrichedLeads.filter(l => l.phone).length,
        avg_confidence: Math.round(avgConfidence * 10) / 10,
        failed: failedLeads.length,
        bulk_api_used: useBulkApi,
        used_existing_emails: leadsWithEmails.length > 0
      },
      failedLeads: failedLeads.length > 0 ? failedLeads : undefined
    })

  } catch (error: any) {
    console.error('Apollo enrichment error:', error.response?.data || error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to enrich leads'
      },
      { status: 500 }
    )
  }
}

/**
 * Fallback to sequential enrichment if bulk API fails
 */
async function fallbackToSequentialEnrichment(leads: any[], apolloApiKey: string): Promise<{ leads: EnrichedLead[], failedLeads: string[], totalConfidence: number }> {
  const enrichedLeads: EnrichedLead[] = []
  const failedLeads: string[] = []
  let totalConfidence = 0

  // Enrich each lead sequentially with rate limiting
  for (const lead of leads) {
    try {
      const response = await axios.post<{ person: ApolloEnrichedPerson }>(
        'https://api.apollo.io/v1/people/match',
        {
          first_name: lead.first_name,
          last_name: lead.last_name,
          organization_name: lead.organization?.name,
          domain: lead.organization?.website_url,
          linkedin_url: lead.linkedin_url,
          reveal_personal_emails: true
          // Note: reveal_phone_number requires webhook_url, so we skip it
          // Phone numbers may still be included if available in Apollo's response
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apolloApiKey
          }
        }
      )

      const person = response.data.person

      if (person.email && person.email_confidence_score && person.email_confidence_score > 80) {
        totalConfidence += person.email_confidence_score

        enrichedLeads.push({
          id: person.id,
          name: person.name,
          first_name: person.first_name,
          last_name: person.last_name,
          email: person.email,
          email_confidence: person.email_confidence_score,
          phone: person.phone_numbers?.[0]?.sanitized_number,
          mobile_phone: person.mobile_phone,
          corporate_phone: person.corporate_phone,
          title: person.title,
          headline: person.headline,
          linkedin_url: person.linkedin_url,
          company: person.organization?.name,
          company_website: person.organization?.website_url,
          industry: person.organization?.industry,
          employee_count: person.organization?.estimated_num_employees,
          annual_revenue: person.organization?.annual_revenue,
          city: person.organization?.city,
          state: person.organization?.state,
          country: person.organization?.country,
          seniority: person.seniority,
          departments: person.departments
        })
      } else {
        failedLeads.push(`${lead.first_name} ${lead.last_name} (low email confidence or no email)`)
      }

      // Rate limiting: Sleep 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error: any) {
      console.error(`Enrichment failed for ${lead.first_name} ${lead.last_name}:`, error.response?.data || error.message)
      failedLeads.push(`${lead.first_name} ${lead.last_name} (API error)`)
    }
  }

  return {
    leads: enrichedLeads,
    failedLeads,
    totalConfidence
  }
}

