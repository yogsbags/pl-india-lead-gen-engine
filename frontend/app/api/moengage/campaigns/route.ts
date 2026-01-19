import { NextRequest, NextResponse } from 'next/server'
import { getMoengageClientInstance } from '../client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const campaignId = searchParams.get('campaignId')
    const meta = searchParams.get('meta') === 'true'

    const client = await getMoengageClientInstance()

    let result

    if (campaignId) {
      if (meta) {
        // Get campaign meta and reachability
        result = await client.getCampaignMeta(campaignId)
      } else {
        // Get campaign details
        result = await client.getEmailCampaign(campaignId)
      }
    } else {
      // List all campaigns
      const filters: Record<string, string> = {}
      searchParams.forEach((value, key) => {
        if (key !== 'meta') filters[key] = value
      })
      result = await client.listEmailCampaigns(filters)
    }

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('MoEngage campaign error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const campaign = await request.json()

    const client = await getMoengageClientInstance()

    const result = await client.createEmailCampaign(campaign)

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('MoEngage campaign creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId required' },
        { status: 400 }
      )
    }

    const updates = await request.json()

    const client = await getMoengageClientInstance()

    const result = await client.updateEmailCampaign(campaignId, updates)

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('MoEngage campaign update error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
