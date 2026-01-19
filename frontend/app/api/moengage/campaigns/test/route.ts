import { NextRequest, NextResponse } from 'next/server'
import { getMoengageClientInstance } from '../../client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId required' },
        { status: 400 }
      )
    }

    const { testEmails } = await request.json()

    if (!testEmails || !Array.isArray(testEmails) || testEmails.length === 0) {
      return NextResponse.json(
        { error: 'testEmails array required' },
        { status: 400 }
      )
    }

    const client = await getMoengageClientInstance()

    const result = await client.testEmailCampaign(campaignId, {
      test_emails: testEmails
    })

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('MoEngage campaign test error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
