import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

interface MoEngageEvent {
  event_name: string
  user_id?: string
  email?: string
  timestamp?: string
  campaign_id?: string
  campaign_name?: string
  attributes?: Record<string, any>
}

interface LeadProgressionEvent {
  email: string
  event_type: 'email_opened' | 'email_clicked' | 'email_replied' | 'call_booked' | 'other'
  previous_tier: 'cold' | 'warm' | 'hot'
  new_tier: 'cold' | 'warm' | 'hot'
  icp_score: number
  timestamp: string
  campaign_id?: string
  campaign_name?: string
}

/**
 * MoEngage Event Tracking Webhook
 *
 * Receives webhook events from MoEngage to track lead engagement
 * Updates lead tier based on engagement (Cold → Warm → Hot)
 * Triggers automated campaigns when leads qualify to higher tiers
 *
 * Event-to-Tier Mapping:
 * - email_opened, email_clicked → Qualify to WARM
 * - email_replied, call_booked → Qualify to HOT
 */
export async function POST(request: NextRequest) {
  try {
    const events: MoEngageEvent | MoEngageEvent[] = await request.json()
    const eventArray = Array.isArray(events) ? events : [events]

    console.log('MoEngage webhook received:', eventArray.length, 'events')

    const progressions: LeadProgressionEvent[] = []

    for (const event of eventArray) {
      const email = event.email || event.user_id
      if (!email) {
        console.warn('Event missing email/user_id:', event)
        continue
      }

      // Determine event type
      const eventType = mapEventType(event.event_name)
      if (!eventType) {
        console.log('Ignoring non-engagement event:', event.event_name)
        continue
      }

      // Load lead data from storage
      const leadData = await loadLeadData(email)
      if (!leadData) {
        console.warn('Lead not found for email:', email)
        continue
      }

      // Calculate new tier based on event type
      const previousTier = leadData.tier || 'cold'
      const newTier = calculateNewTier(previousTier, eventType)

      if (newTier !== previousTier) {
        // Update lead tier in storage
        await updateLeadTier(email, newTier)

        // Record progression event
        const progression: LeadProgressionEvent = {
          email,
          event_type: eventType,
          previous_tier: previousTier,
          new_tier: newTier,
          icp_score: leadData.icp_score || 0,
          timestamp: event.timestamp || new Date().toISOString(),
          campaign_id: event.campaign_id,
          campaign_name: event.campaign_name
        }
        progressions.push(progression)

        // Log progression
        await logProgression(progression)

        // Trigger campaign if qualified to Warm or Hot
        if (newTier === 'warm' || newTier === 'hot') {
          await triggerCampaign(email, newTier, leadData)
        }
      }
    }

    return NextResponse.json({
      success: true,
      events_processed: eventArray.length,
      progressions: progressions.length,
      progression_details: progressions
    })

  } catch (error: any) {
    console.error('MoEngage webhook error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * Map MoEngage event names to engagement types
 */
function mapEventType(eventName: string): LeadProgressionEvent['event_type'] | null {
  const nameLower = eventName.toLowerCase()

  if (nameLower.includes('opened') || nameLower.includes('open')) {
    return 'email_opened'
  }
  if (nameLower.includes('clicked') || nameLower.includes('click')) {
    return 'email_clicked'
  }
  if (nameLower.includes('replied') || nameLower.includes('reply') || nameLower.includes('response')) {
    return 'email_replied'
  }
  if (nameLower.includes('booked') || nameLower.includes('booking') || nameLower.includes('call')) {
    return 'call_booked'
  }

  // Ignore non-engagement events (delivered, bounced, etc.)
  return null
}

/**
 * Calculate new tier based on engagement event
 *
 * Progression rules:
 * - Cold + (Open or Click) → Warm
 * - Cold + (Reply or Booking) → Hot
 * - Warm + (Reply or Booking) → Hot
 * - Hot stays Hot (no downgrade)
 */
function calculateNewTier(
  currentTier: 'cold' | 'warm' | 'hot',
  eventType: LeadProgressionEvent['event_type']
): 'cold' | 'warm' | 'hot' {
  if (currentTier === 'hot') return 'hot' // Hot leads stay hot

  if (eventType === 'email_replied' || eventType === 'call_booked') {
    return 'hot' // High engagement → Hot
  }

  if (eventType === 'email_opened' || eventType === 'email_clicked') {
    if (currentTier === 'cold') return 'warm' // Medium engagement → Warm
  }

  return currentTier // No change
}

/**
 * Load lead data from file system (temporary storage)
 * TODO: Replace with database query in production
 */
async function loadLeadData(email: string): Promise<any> {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'leads')

    // Check all segment lead files
    const segments = ['partners', 'hni', 'uhni', 'mass_affluent']

    for (const segment of segments) {
      const filePath = path.join(dataDir, `${segment}_leads.json`)

      try {
        const data = await fs.readFile(filePath, 'utf-8')
        const leads = JSON.parse(data)

        const lead = leads.find((l: any) => l.email === email)
        if (lead) return lead
      } catch (err) {
        // File doesn't exist or invalid JSON, continue to next segment
        continue
      }
    }

    return null // Lead not found
  } catch (error) {
    console.error('Error loading lead data:', error)
    return null
  }
}

/**
 * Update lead tier in storage
 * TODO: Replace with database update in production
 */
async function updateLeadTier(email: string, newTier: 'cold' | 'warm' | 'hot'): Promise<void> {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'leads')
    const segments = ['partners', 'hni', 'uhni', 'mass_affluent']

    for (const segment of segments) {
      const filePath = path.join(dataDir, `${segment}_leads.json`)

      try {
        const data = await fs.readFile(filePath, 'utf-8')
        const leads = JSON.parse(data)

        const leadIndex = leads.findIndex((l: any) => l.email === email)
        if (leadIndex !== -1) {
          // Update tier
          leads[leadIndex].tier = newTier
          leads[leadIndex].tier_updated_at = new Date().toISOString()

          // Write back to file
          await fs.writeFile(filePath, JSON.stringify(leads, null, 2))
          console.log(`Updated ${email} tier to ${newTier} in ${segment}_leads.json`)
          return
        }
      } catch (err) {
        continue
      }
    }
  } catch (error) {
    console.error('Error updating lead tier:', error)
  }
}

/**
 * Log progression event to file
 * TODO: Replace with database insert in production
 */
async function logProgression(progression: LeadProgressionEvent): Promise<void> {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'progressions')
    await fs.mkdir(dataDir, { recursive: true })

    const logFile = path.join(dataDir, 'lead_progressions.json')

    let progressions: LeadProgressionEvent[] = []
    try {
      const data = await fs.readFile(logFile, 'utf-8')
      progressions = JSON.parse(data)
    } catch (err) {
      // File doesn't exist yet
    }

    progressions.push(progression)

    await fs.writeFile(logFile, JSON.stringify(progressions, null, 2))
    console.log('Logged progression:', progression.email, progression.previous_tier, '→', progression.new_tier)
  } catch (error) {
    console.error('Error logging progression:', error)
  }
}

/**
 * Trigger automated campaign based on tier qualification
 * TODO: Implement actual campaign triggering via MoEngage API
 */
async function triggerCampaign(
  email: string,
  tier: 'warm' | 'hot',
  leadData: any
): Promise<void> {
  try {
    console.log(`🎯 Triggering ${tier.toUpperCase()} campaign for ${email}`)

    // Load MoEngage client
    const automationEnginePath = path.resolve(process.cwd(), '..', 'automation-engine')
    const moengageClientPath = path.join(automationEnginePath, 'services', 'moengage-client.js')
    const { getMoengageClient } = await import(`file://${moengageClientPath}`)

    const client = getMoengageClient()

    // Get campaign template for tier
    const campaignName = tier === 'warm'
      ? `Auto-Warm Campaign - ${leadData.segment || 'Generic'}`
      : `Auto-Hot Campaign - ${leadData.segment || 'Generic'}`

    // Create or trigger campaign
    // This is a placeholder - actual implementation depends on MoEngage API
    console.log(`Campaign trigger: ${campaignName} for ${email}`)

    // TODO: Implement actual MoEngage campaign API call
    // await client.triggerCampaign(campaignName, { email, tier, ...leadData })

  } catch (error) {
    console.error('Error triggering campaign:', error)
  }
}

/**
 * GET endpoint to view recent progressions
 */
export async function GET(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'progressions')
    const logFile = path.join(dataDir, 'lead_progressions.json')

    try {
      const data = await fs.readFile(logFile, 'utf-8')
      const progressions = JSON.parse(data)

      // Get query params for filtering
      const searchParams = request.nextUrl.searchParams
      const limit = parseInt(searchParams.get('limit') || '50')
      const tier = searchParams.get('tier') // Filter by new_tier

      let filtered = progressions
      if (tier) {
        filtered = progressions.filter((p: LeadProgressionEvent) => p.new_tier === tier)
      }

      // Return most recent first
      const recent = filtered.reverse().slice(0, limit)

      return NextResponse.json({
        success: true,
        progressions: recent,
        total: filtered.length
      })
    } catch (err) {
      // No progressions yet
      return NextResponse.json({
        success: true,
        progressions: [],
        total: 0
      })
    }

  } catch (error: any) {
    console.error('Error fetching progressions:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
