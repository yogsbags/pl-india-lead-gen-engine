// Shared MoEngage client loader for API routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Import from local lib instead of automation-engine for build compatibility
import { getMoengageClient } from './lib/client'

export function getMoengageClientInstance() {
  return getMoengageClient()
}
