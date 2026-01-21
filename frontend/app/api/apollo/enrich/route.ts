import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

interface EnrichmentRequest {
  leads: Array<{
    id: string
    first_name: string
    last_name: string
    name?: string
    email?: string
    phone?: string
    mobile_phone?: string
    corporate_phone?: string
    email_confidence_score?: number
    email_status?: string
    title?: string
    headline?: string
    city?: string
    state?: string
    country?: string
    seniority?: string
    departments?: string[]
    organization?: {
      name?: string
      website_url?: string
      primary_domain?: string
      industry?: string
      num_employees?: number
      estimated_num_employees?: number
      annual_revenue?: number
      city?: string
      state?: string
      country?: string
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

    // Note: Apollo's People API Search does NOT return emails/phones (per docs.apollo.io)
    // All leads from search need enrichment to get contact data
    // Use bulk endpoint for multiple leads, single endpoint for one lead
    const useBulkApi = leads.length > 1

    if (useBulkApi) {
      // **BULK ENRICHMENT** - Process all leads in single API call
      try {
        // Prepare bulk match request
        // Use Apollo person ID if available (from shallow profile search), otherwise match by identifiers
        const bulkRequestBody = {
          details: leads.map(lead => {
            // If lead has Apollo person ID, use it for direct lookup (most reliable)
            // Apollo API expects "id" field (not "person_id") for ID-based matching
            if (lead.id) {
              return {
                id: lead.id  // Use "id" field (as shown in Apollo's working example)
              }
            }
            // Otherwise, match by identifiers (name, company, LinkedIn, etc.)
            const detail: any = {
              first_name: lead.first_name,
              last_name: lead.last_name
            }

            // Add optional identifiers for better matching
            if (lead.organization?.name) {
              detail.organization_name = lead.organization.name
            }
            if (lead.organization?.primary_domain) {
              detail.domain = lead.organization.primary_domain
            } else if (lead.organization?.website_url) {
              // Extract domain from website URL
              detail.domain = lead.organization.website_url.replace(/^https?:\/\//, '').split('/')[0]
            }
            if (lead.linkedin_url) {
              detail.linkedin_url = lead.linkedin_url
            }

            return detail
          })
          // Note: reveal_personal_emails goes in URL query param, not body
          // Note: reveal_phone_number requires webhook_url, so we skip it
        }

        console.log('Bulk enrichment request:', JSON.stringify({
          totalLeads: leads.length,
          detailsCount: bulkRequestBody.details.length,
          usingPersonIds: bulkRequestBody.details.filter((d: any) => d.id).length,
          usingIdentifiers: bulkRequestBody.details.filter((d: any) => !d.id).length
        }, null, 2))

        // Log the FULL Apollo request for debugging
        console.log('Full Apollo bulk_match request body:', JSON.stringify(bulkRequestBody, null, 2))

        // Use query parameters for reveal_personal_emails (as per Apollo API docs)
        const response = await axios.post<{ matches: ApolloEnrichedPerson[]; error?: string }>(
          'https://api.apollo.io/api/v1/people/bulk_match?reveal_personal_emails=true&reveal_phone_number=false',
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
        // If id-based matching fails, we'll need to try identifier-based matching
        const leadsNeedingFallback: typeof leads = []

        for (let i = 0; i < leads.length; i++) {
          const lead = leads[i]
          const person = matches[i]

          // Skip null matches (Apollo couldn't match this lead using id)
          if (!person || person === null) {
            console.warn(`No match found for lead ${i + 1} using id:`, {
              id: lead.id,
              name: `${lead.first_name} ${lead.last_name}`,
              company: lead.organization?.name,
              linkedin: lead.linkedin_url
            })

            // Store for fallback matching with identifiers
            leadsNeedingFallback.push(lead)
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
          const personEmail = person.email
          const personEmailConfidence = person.email_confidence_score
          if (personEmail && personEmailConfidence && personEmailConfidence > 80) {
            totalConfidence += personEmailConfidence

            enrichedLeads.push({
              id: person.id,
              name: person.name,
              first_name: person.first_name,
              last_name: person.last_name,
              email: personEmail,
              email_confidence: personEmailConfidence,
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

        // **FALLBACK**: If id-based matching failed for some leads, try identifier-based matching
        if (leadsNeedingFallback.length > 0) {
          console.log(`Attempting fallback enrichment for ${leadsNeedingFallback.length} leads using identifiers...`)

          try {
            const fallbackRequestBody = {
              details: leadsNeedingFallback.map(lead => {
                const detail: any = {
                  first_name: lead.first_name,
                  last_name: lead.last_name_obfuscated ? undefined : lead.last_name  // Skip obfuscated names
                }

                if (lead.organization?.name) {
                  detail.organization_name = lead.organization.name
                }
                if (lead.organization?.primary_domain) {
                  detail.domain = lead.organization.primary_domain
                } else if (lead.organization?.website_url) {
                  detail.domain = lead.organization.website_url.replace(/^https?:\/\//, '').split('/')[0]
                }
                if (lead.linkedin_url) {
                  detail.linkedin_url = lead.linkedin_url
                }

                return detail
              }).filter((d: any) => d.first_name && (d.last_name || d.organization_name)) // Only include valid
            }

            const fallbackResponse = await axios.post<{ matches: ApolloEnrichedPerson[]; error?: string }>(
              'https://api.apollo.io/api/v1/people/bulk_match?reveal_personal_emails=true&reveal_phone_number=false',
              fallbackRequestBody,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'X-Api-Key': apolloApiKey
                },
                validateStatus: () => true
              }
            )

            if (fallbackResponse.status === 200 && !fallbackResponse.data.error && fallbackResponse.data.matches) {
              const fallbackMatches = fallbackResponse.data.matches || []

              // Process fallback results
              for (let i = 0; i < leadsNeedingFallback.length; i++) {
                const lead = leadsNeedingFallback[i]
                const person = fallbackMatches[i]

                if (person && person !== null) {
                  const personEmail = person.email
                  const personEmailConfidence = person.email_confidence_score
                  if (personEmail && personEmailConfidence && personEmailConfidence > 80) {
                    totalConfidence += personEmailConfidence

                    enrichedLeads.push({
                      id: person.id,
                      name: person.name,
                      first_name: person.first_name,
                      last_name: person.last_name,
                      email: personEmail,
                      email_confidence: personEmailConfidence,
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
                    continue
                  }
                }

                // Still no match after fallback
                failedLeads.push(`${lead.first_name || 'Unknown'} ${lead.last_name || ''} (no match found with identifiers)`)
              }
            }
          } catch (fallbackError: any) {
            console.error('Fallback enrichment error:', fallbackError.response?.data || fallbackError.message)
            // Mark all fallback leads as failed
            leadsNeedingFallback.forEach(lead => {
              failedLeads.push(`${lead.first_name || 'Unknown'} ${lead.last_name || ''} (fallback enrichment failed)`)
            })
          }
        }

      } catch (error: any) {
        console.error('Bulk enrichment error:', error.response?.data || error.message)

        // Fallback to sequential enrichment if bulk API fails
        console.warn('Bulk API failed, falling back to sequential enrichment...')
        const fallbackResults = await fallbackToSequentialEnrichment(leads, apolloApiKey)
        // Merge fallback results
        enrichedLeads.push(...fallbackResults.leads)
        failedLeads.push(...(fallbackResults.failedLeads || []))
        totalConfidence += fallbackResults.totalConfidence || 0
      }

    } else {
      // **SINGLE LEAD ENRICHMENT** - Use original single-person endpoint
      const lead = leads[0]

      try {
        const response = await axios.post<{ person: ApolloEnrichedPerson }>(
          'https://api.apollo.io/api/v1/people/match',
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
        const personEmail = person.email
        const personEmailConfidence = person.email_confidence_score
        if (personEmail && personEmailConfidence && personEmailConfidence > 80) {
          totalConfidence += personEmailConfidence

          enrichedLeads.push({
            id: person.id,
            name: person.name,
            first_name: person.first_name,
            last_name: person.last_name,
            email: personEmail,
            email_confidence: personEmailConfidence,
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
        bulk_api_used: useBulkApi
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
        'https://api.apollo.io/api/v1/people/match',
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

