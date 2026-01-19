// Shared MoEngage client loader for API routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Use a static import path to avoid webpack dynamic import warnings
export async function getMoengageClientInstance(): Promise<any> {
  const { getMoengageClient } = await import('../../../../automation-engine/services/moengage-client.js')
  return getMoengageClient()
}
