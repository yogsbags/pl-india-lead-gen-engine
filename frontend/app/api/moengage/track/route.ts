import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type MoengageTrackPayload = {
  type: 'event' | 'customer'
  customer_id: string
  actions?: Array<{
    action: string
    timestamp: number
    attributes: Record<string, any>
  }>
  attributes?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as MoengageTrackPayload

    // Import MoEngage client from automation-engine (relative to frontend)
    const automationEnginePath = path.resolve(__dirname, '../../../../automation-engine')
    const moengageClientPath = path.join(automationEnginePath, 'services', 'moengage-client.js')
    const { getMoengageClient } = await import(`file://${moengageClientPath}`)

    const client = getMoengageClient()

    const result = await client.track(payload)

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('MoEngage track error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

