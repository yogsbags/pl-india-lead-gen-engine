import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const campaignId = searchParams.get('campaignId')
    const meta = searchParams.get('meta') === 'true'

    // Import MoEngage client from automation-engine
    const automationEnginePath = path.resolve(__dirname, '../../../../automation-engine')
    const moengageClientPath = path.join(automationEnginePath, 'services', 'moengage-client.js')
    const { getMoengageClient } = await import(`file://${moengageClientPath}`)

    const client = getMoengageClient()

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

    // Import MoEngage client from automation-engine
    const automationEnginePath = path.resolve(__dirname, '../../../../automation-engine')
    const moengageClientPath = path.join(automationEnginePath, 'services', 'moengage-client.js')
    const { getMoengageClient } = await import(`file://${moengageClientPath}`)

    const client = getMoengageClient()

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

    // Import MoEngage client from automation-engine
    const automationEnginePath = path.resolve(__dirname, '../../../../automation-engine')
    const moengageClientPath = path.join(automationEnginePath, 'services', 'moengage-client.js')
    const { getMoengageClient } = await import(`file://${moengageClientPath}`)

    const client = getMoengageClient()

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

