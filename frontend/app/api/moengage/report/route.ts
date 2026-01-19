import { NextRequest, NextResponse } from 'next/server'
import { getMoengageClientInstance } from '../client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const kind = searchParams.get('kind') || 'campaign'
    const campaignId = searchParams.get('campaignId')
    const catalogId = searchParams.get('catalogId')
    const reportId = searchParams.get('reportId')

    const client = await getMoengageClientInstance()

    let result

    switch (kind) {
      case 'campaign':
        if (!campaignId) {
          return NextResponse.json(
            { error: 'campaignId required for campaign report' },
            { status: 400 }
          )
        }
        result = await client.getCampaignReport(campaignId)
        break

      case 'business-events':
        const params: Record<string, string> = {}
        searchParams.forEach((value, key) => {
          if (key !== 'kind') params[key] = value
        })
        result = await client.getBusinessEvents(params)
        break

      case 'custom-templates':
        result = await client.getCustomTemplates()
        break

      case 'catalog':
        if (!catalogId) {
          return NextResponse.json(
            { error: 'catalogId required for catalog report' },
            { status: 400 }
          )
        }
        result = await client.getCatalog(catalogId)
        break

      case 'inform':
        if (!reportId) {
          return NextResponse.json(
            { error: 'reportId required for inform report' },
            { status: 400 }
          )
        }
        result = await client.getInformReport(reportId)
        break

      default:
        return NextResponse.json(
          { error: `Unknown report kind: ${kind}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('MoEngage report error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
