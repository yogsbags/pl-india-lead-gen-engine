import { NextRequest, NextResponse } from 'next/server'
import { getMoengageClientInstance } from '../client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const templateId = searchParams.get('templateId')
    const name = searchParams.get('name')

    const client = await getMoengageClientInstance()

    let result

    if (templateId) {
      // Get specific template
      result = await client.getEmailTemplate(templateId)
    } else {
      // Search templates
      const filters: Record<string, string> = {}
      if (name) filters.name = name
      result = await client.searchEmailTemplates(filters)
    }

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('MoEngage template error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const template = await request.json()

    const client = await getMoengageClientInstance()

    const result = await client.createEmailTemplate(template)

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('MoEngage template creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId required' },
        { status: 400 }
      )
    }

    const updates = await request.json()

    const client = await getMoengageClientInstance()

    const result = await client.updateEmailTemplate(templateId, updates)

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('MoEngage template update error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId required' },
        { status: 400 }
      )
    }

    const client = await getMoengageClientInstance()

    const result = await client.deleteEmailTemplate(templateId)

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('MoEngage template deletion error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
