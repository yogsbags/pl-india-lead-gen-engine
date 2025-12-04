import { NextResponse } from 'next/server'

/**
 * Health Check Endpoint for Railway
 *
 * Returns 200 OK if the application is running
 * Used by Railway to verify the deployment is successful
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'lead-generation-frontend',
    version: '1.0.0'
  })
}
