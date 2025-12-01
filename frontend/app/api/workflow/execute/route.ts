import { NextRequest } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const segment = searchParams.get('segment') || 'hni'
  const live = searchParams.get('live') === 'true'
  const maxResults = searchParams.get('maxResults') || '100'

  // Create SSE response
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // Backend path
        const backendRoot = path.join(process.cwd(), '..', 'automation-engine')
        const mainScript = path.join(backendRoot, 'main.js')

        // Build command
        const args = [mainScript, 'run', '--segment', segment]
        if (live) args.push('--live')

        send({ type: 'workflow_start', message: `Starting workflow for ${segment}` })

        // Execute backend process
        const backendProcess = spawn('node', args, {
          cwd: backendRoot,
          env: { ...process.env, MAX_RESULTS: maxResults }
        })

        let currentStage = 1
        let stageData: any = {}

        backendProcess.stdout.on('data', (data) => {
          const output = data.toString()
          console.log(output)

          // Parse stage transitions
          if (output.includes('Configuration & Setup')) {
            send({ type: 'stage_start', stage: 1, message: 'Configuration & Setup' })
            currentStage = 1
          } else if (output.includes('Lead Scraping') || output.includes('Apify')) {
            if (currentStage === 1) {
              send({ type: 'stage_complete', stage: 1, message: 'Configuration complete' })
            }
            send({ type: 'stage_start', stage: 2, message: 'Lead Scraping' })
            currentStage = 2
          } else if (output.includes('Data Processing') || output.includes('quality') || output.includes('scoring')) {
            if (currentStage === 2) {
              send({ type: 'stage_complete', stage: 2, message: 'Scraping complete', data: stageData })
              stageData = {}
            }
            send({ type: 'stage_start', stage: 3, message: 'Data Processing' })
            currentStage = 3
          } else if (output.includes('CRM Integration') || output.includes('Google Sheets')) {
            if (currentStage === 3) {
              send({ type: 'stage_complete', stage: 3, message: 'Processing complete', data: stageData })
              stageData = {}
            }
            send({ type: 'stage_start', stage: 4, message: 'CRM Integration' })
            currentStage = 4
          } else if (output.includes('Outreach') || output.includes('email') || output.includes('LinkedIn')) {
            if (currentStage === 4) {
              send({ type: 'stage_complete', stage: 4, message: 'CRM sync complete' })
            }
            send({ type: 'stage_start', stage: 5, message: 'Outreach Campaigns' })
            currentStage = 5
          } else if (output.includes('Analytics') || output.includes('summary')) {
            if (currentStage === 5) {
              send({ type: 'stage_complete', stage: 5, message: 'Outreach queued', data: stageData })
              stageData = {}
            }
            send({ type: 'stage_start', stage: 6, message: 'Analytics & Tracking' })
            currentStage = 6
          }

          // Extract metrics
          const leadMatch = output.match(/(\d+)\s+leads?/i)
          if (leadMatch && currentStage === 2) {
            stageData.total = parseInt(leadMatch[1])
          }

          const hotMatch = output.match(/(\d+)\s+hot/i)
          if (hotMatch && currentStage === 3) {
            stageData.hot = parseInt(hotMatch[1])
          }

          const warmMatch = output.match(/(\d+)\s+warm/i)
          if (warmMatch && currentStage === 3) {
            stageData.warm = parseInt(warmMatch[1])
          }

          // Send progress updates
          send({ type: 'stage_progress', stage: currentStage, message: output.trim() })
        })

        backendProcess.stderr.on('data', (data) => {
          const error = data.toString()
          console.error(error)
          send({ type: 'stage_error', stage: currentStage, message: error.trim() })
        })

        backendProcess.on('close', (code) => {
          if (code === 0) {
            send({ type: 'stage_complete', stage: currentStage, message: 'Workflow complete' })
            send({ type: 'workflow_complete', message: 'All stages completed successfully' })
          } else {
            send({ type: 'workflow_error', message: `Process exited with code ${code}` })
          }
          controller.close()
        })

      } catch (error: any) {
        send({ type: 'workflow_error', message: error.message })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
