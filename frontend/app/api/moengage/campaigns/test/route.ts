import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

    // Import MoEngage client from automation-engine
    const automationEnginePath = path.resolve(__dirname, '../../../../../automation-engine')
    const moengageClientPath = path.join(automationEnginePath, 'services', 'moengage-client.js')
    const { getMoengageClient } = await import(`file://${moengageClientPath}`)

    const client = getMoengageClient()

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

