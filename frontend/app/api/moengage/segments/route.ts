import { NextRequest, NextResponse } from 'next/server'
import { getMoengageClientInstance } from '../client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface EnrichedLead {
  id: string
  name: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  title?: string
  company?: string
  industry?: string
  city?: string
  icp_score?: number
  tier?: 'hot' | 'warm' | 'cold'
}

interface CreateSegmentRequest {
  name: string
  description?: string
  segment_type?: 'static' | 'dynamic'
  leads: EnrichedLead[]
}

interface UploadLeadsRequest {
  segment_id: string
  leads: EnrichedLead[]
}

/**
 * MoEngage Segment Management API Route
 *
 * Handles segment creation and lead upload to MoEngage
 * Supports test segments (2-3 leads) and production segments
 */

// GET: List all segments
export async function GET(request: NextRequest) {
  try {
    // Get segments from MoEngage
    const client = await getMoengageClientInstance()
    const segments = await client.listSegments()

    return NextResponse.json({
      success: true,
      segments
    })

  } catch (error: any) {
    console.error('MoEngage list segments error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST: Create new segment
export async function POST(request: NextRequest) {
  try {
    const body: CreateSegmentRequest = await request.json()
    const { name, description, segment_type = 'static', leads } = body

    // Validate input
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      )
    }

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'leads array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Create segment in MoEngage
    const client = await getMoengageClientInstance()

    // Step 1: Create segment
    const segment = await client.createSegment({
      name,
      description: description || `Lead generation segment - ${new Date().toLocaleDateString()}`,
      type: segment_type
    })

    // Step 2: Upload leads to segment
    const moengageUsers = leads.map(lead => ({
      email: lead.email,
      attributes: {
        first_name: lead.first_name,
        last_name: lead.last_name,
        name: lead.name,
        phone: lead.phone,
        title: lead.title,
        company: lead.company,
        industry: lead.industry,
        city: lead.city,
        icp_score: lead.icp_score,
        tier: lead.tier,
        segment_id: segment.id,
        uploaded_at: new Date().toISOString()
      }
    }))

    await client.uploadUsersToSegment(segment.id, moengageUsers)

    return NextResponse.json({
      success: true,
      segment: {
        id: segment.id,
        name: segment.name,
        description: segment.description,
        type: segment.type,
        lead_count: leads.length,
        created_at: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('MoEngage create segment error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT: Upload additional leads to existing segment
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const segmentId = searchParams.get('segmentId')

    if (!segmentId) {
      return NextResponse.json(
        { error: 'segmentId required' },
        { status: 400 }
      )
    }

    const body: UploadLeadsRequest = await request.json()
    const { leads } = body

    // Validate input
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'leads array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Upload leads to existing segment
    const client = await getMoengageClientInstance()

    const moengageUsers = leads.map(lead => ({
      email: lead.email,
      attributes: {
        first_name: lead.first_name,
        last_name: lead.last_name,
        name: lead.name,
        phone: lead.phone,
        title: lead.title,
        company: lead.company,
        industry: lead.industry,
        city: lead.city,
        icp_score: lead.icp_score,
        tier: lead.tier,
        segment_id: segmentId,
        uploaded_at: new Date().toISOString()
      }
    }))

    await client.uploadUsersToSegment(segmentId, moengageUsers)

    return NextResponse.json({
      success: true,
      segment_id: segmentId,
      uploaded_count: leads.length
    })

  } catch (error: any) {
    console.error('MoEngage upload leads error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Delete segment
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const segmentId = searchParams.get('segmentId')

    if (!segmentId) {
      return NextResponse.json(
        { error: 'segmentId required' },
        { status: 400 }
      )
    }

    // Delete segment from MoEngage
    const client = await getMoengageClientInstance()
    await client.deleteSegment(segmentId)

    return NextResponse.json({
      success: true,
      segment_id: segmentId,
      message: `Segment ${segmentId} deleted successfully`
    })

  } catch (error: any) {
    console.error('MoEngage delete segment error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
