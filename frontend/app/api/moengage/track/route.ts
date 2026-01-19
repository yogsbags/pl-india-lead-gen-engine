import { NextRequest, NextResponse } from 'next/server'
import { getMoengageClientInstance } from '../client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    const client = await getMoengageClientInstance()

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
