import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const segment = searchParams.get('segment') || 'hni'

  try {
    const backendRoot = path.join(process.cwd(), '..', 'automation-engine')

    // Read execution summary
    const executionsFile = path.join(backendRoot, 'data', 'executions.json')
    const leadsFile = path.join(backendRoot, 'data', 'leads', `${segment}_leads.json`)

    let executionData = null
    let leadsData = null

    // Read executions.json if exists
    if (fs.existsSync(executionsFile)) {
      const content = fs.readFileSync(executionsFile, 'utf-8')
      const executions = JSON.parse(content)
      // Get latest execution for this segment
      const segmentExecutions = executions.filter((e: any) => e.segment === segment)
      if (segmentExecutions.length > 0) {
        executionData = segmentExecutions[segmentExecutions.length - 1]
      }
    }

    // Read segment leads file if exists
    if (fs.existsSync(leadsFile)) {
      const content = fs.readFileSync(leadsFile, 'utf-8')
      leadsData = JSON.parse(content)
    }

    // Build response data
    const responseData: any = {}

    if (leadsData && Array.isArray(leadsData)) {
      // Stage 2: Scraping
      responseData.scraping = {
        total: leadsData.length,
        withEmail: leadsData.filter((l: any) => l.email).length,
        withLinkedIn: leadsData.filter((l: any) => l.linkedinUrl).length,
      }

      // Stage 3: Processing
      const hot = leadsData.filter((l: any) => l.score >= 80).length
      const warm = leadsData.filter((l: any) => l.score >= 60 && l.score < 80).length
      const cold = leadsData.filter((l: any) => l.score < 60).length

      responseData.processing = {
        total: leadsData.length,
        hot,
        warm,
        cold,
        qualityScore: 95,  // Mock data
        duplicatesRemoved: 5,  // Mock data
        averageScore: Math.round(leadsData.reduce((sum: number, l: any) => sum + (l.score || 0), 0) / leadsData.length),
        distribution: {
          '0-40': leadsData.filter((l: any) => l.score < 40).length,
          '40-60': leadsData.filter((l: any) => l.score >= 40 && l.score < 60).length,
          '60-80': leadsData.filter((l: any) => l.score >= 60 && l.score < 80).length,
          '80-100': leadsData.filter((l: any) => l.score >= 80).length,
        }
      }

      // Stage 5: Outreach
      responseData.outreach = {
        email: {
          queued: hot + warm,
          sent: 0,
          opened: 0,
          replied: 0,
          templates: ['E-01', 'E-02', 'E-03']
        },
        linkedin: {
          connectionsRequested: hot,
          connectionsAccepted: 0,
          messagesScheduled: hot + warm
        },
        video: hot > 0 ? {
          generated: 0,
          hotLeads: hot,
          heygenJobId: ''
        } : undefined,
        newsletter: cold > 0 ? {
          subscribed: cold,
          campaign: 'The Quant Edge'
        } : undefined
      }
    }

    // Add execution summary if available
    if (executionData) {
      responseData.execution = executionData
    }

    return NextResponse.json({
      data: responseData,
      summary: {
        segment,
        timestamp: new Date().toISOString(),
        hasData: !!leadsData
      }
    })

  } catch (error: any) {
    console.error('Error fetching workflow data:', error)
    return NextResponse.json({
      data: null,
      summary: {
        error: error.message
      }
    }, { status: 500 })
  }
}
