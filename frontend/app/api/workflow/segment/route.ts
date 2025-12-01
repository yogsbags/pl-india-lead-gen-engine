import { NextRequest } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const segment = searchParams.get('segment') || 'hni'
  const stage = searchParams.get('stage') || '1'
  const live = searchParams.get('live') === 'true'
  const maxResults = searchParams.get('maxResults') || '100'

  // Stage mapping
  const stageCommands: Record<string, string[]> = {
    '1': ['init'],  // Configuration
    '2': ['run', '--segment', segment],  // Scraping (full run for now)
    '3': ['run', '--segment', segment],  // Processing
    '4': ['run', '--segment', segment],  // CRM
    '5': ['run', '--segment', segment],  // Outreach
    '6': ['status'],  // Analytics
  }

  // Create SSE response
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const backendRoot = path.join(process.cwd(), '..', 'automation-engine')
        const mainScript = path.join(backendRoot, 'main.js')

        const command = stageCommands[stage] || ['status']
        const args = [mainScript, ...command]
        if (live && stage !== '1' && stage !== '6') args.push('--live')

        send({ type: 'stage_start', stage: parseInt(stage), message: `Executing stage ${stage}` })

        const backendProcess = spawn('node', args, {
          cwd: backendRoot,
          env: { ...process.env, MAX_RESULTS: maxResults }
        })

        backendProcess.stdout.on('data', (data) => {
          const output = data.toString()
          console.log(output)
          send({ type: 'stage_progress', stage: parseInt(stage), message: output.trim() })
        })

        backendProcess.stderr.on('data', (data) => {
          const error = data.toString()
          console.error(error)
          send({ type: 'stage_error', stage: parseInt(stage), message: error.trim() })
        })

        backendProcess.on('close', (code) => {
          if (code === 0) {
            send({ type: 'stage_complete', stage: parseInt(stage), message: `Stage ${stage} complete` })
            send({ type: 'workflow_complete', message: 'Stage execution completed' })
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
