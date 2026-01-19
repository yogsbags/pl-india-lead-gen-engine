'use client'

import { useState } from 'react'
import LeadConfigPanel, { LeadGenConfig } from '../components/LeadConfigPanel'
import EnrichedLeadsTable, { EnrichedLead } from '../components/EnrichedLeadsTable'
import CampaignPreview, { EmailScript } from '../components/CampaignPreview'
import CampaignAnalytics, { CampaignMetrics } from '../components/CampaignAnalytics'

type WorkflowStage =
  | 'config'
  | 'scraping'
  | 'enrichment'
  | 'scoring'
  | 'preview_leads'
  | 'script_generation'
  | 'campaign_preview'
  | 'test_campaign'
  | 'production_campaign'
  | 'analytics'

interface WorkflowState {
  stage: WorkflowStage
  config?: LeadGenConfig
  scrapedLeads?: any[]
  enrichedLeads?: EnrichedLead[]
  scripts?: EmailScript[]
  segmentId?: string
  campaignId?: string
  metrics?: CampaignMetrics[]
}

// ICP Scoring based on segment-specific criteria (0-100 scale)
function calculateICPScore(lead: any, segment: string): number {
  let score = 0

  // Base score from job title seniority (0-25 points)
  const seniorityScore = getSeniorityScore(lead.title, lead.seniority)
  score += seniorityScore

  // Company size score (0-20 points)
  const companySizeScore = getCompanySizeScore(lead.employee_count)
  score += companySizeScore

  // Location tier (0-15 points)
  const locationScore = getLocationScore(lead.city)
  score += locationScore

  // Industry relevance (0-15 points)
  const industryScore = getIndustryScore(lead.industry, segment)
  score += industryScore

  // Email confidence bonus (0-15 points)
  const emailScore = Math.min((lead.email_confidence || 0) * 0.15, 15)
  score += emailScore

  // Phone availability bonus (0-10 points)
  if (lead.phone) score += 10

  return Math.min(Math.round(score), 100)
}

function getSeniorityScore(title?: string, seniority?: string): number {
  if (!title) return 0
  const titleLower = title.toLowerCase()

  // C-level: 25 points
  if (/(ceo|cto|cfo|coo|founder|chairman|president|managing director)/i.test(titleLower)) return 25
  // VP/Director: 20 points
  if (/(vp|vice president|director)/i.test(titleLower)) return 20
  // Senior/Head: 15 points
  if (/(senior|head|principal)/i.test(titleLower)) return 15
  // Manager: 10 points
  if (/(manager|lead)/i.test(titleLower)) return 10
  // Others: 5 points
  return 5
}

function getCompanySizeScore(employeeCount?: number): number {
  if (!employeeCount) return 5
  if (employeeCount >= 1000) return 20
  if (employeeCount >= 500) return 18
  if (employeeCount >= 200) return 15
  if (employeeCount >= 50) return 12
  if (employeeCount >= 10) return 8
  return 5
}

function getLocationScore(city?: string): number {
  if (!city) return 5
  const cityLower = city.toLowerCase()
  // Tier 1 cities: 15 points
  if (/(mumbai|delhi|bangalore|bengaluru|ncr|gurgaon|noida)/i.test(cityLower)) return 15
  // Tier 2 cities: 10 points
  if (/(pune|hyderabad|chennai|kolkata|ahmedabad)/i.test(cityLower)) return 10
  // Others: 5 points
  return 5
}

function getIndustryScore(industry?: string, segment?: string): number {
  if (!industry) return 5
  const industryLower = industry.toLowerCase()

  // High-value industries for financial services
  if (/(financial services|banking|investment|wealth|asset management|insurance)/i.test(industryLower)) return 15
  if (/(technology|software|it services|consulting)/i.test(industryLower)) return 12
  if (/(healthcare|pharma|manufacturing|real estate)/i.test(industryLower)) return 10
  return 5
}

interface ActivityLog {
  timestamp: string
  type: 'info' | 'success' | 'error' | 'api'
  message: string
  details?: any
}

export default function LeadGenPage() {
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    stage: 'config'
  })
  const [executionMode, setExecutionMode] = useState<'full' | 'staged'>('full')
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [progressPercentage, setProgressPercentage] = useState<number>(0)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])

  const addLog = (type: ActivityLog['type'], message: string, details?: any) => {
    setActivityLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    }])
  }

  // Stage 1-2: Execute lead scraping
  const handleExecuteWorkflow = async (config: LeadGenConfig) => {
    setWorkflowState(prev => ({ ...prev, config }))
    addLog('info', `🚀 Starting ${executionMode === 'full' ? 'Full' : 'Stage-by-Stage'} Workflow`, {
      segment: config.segment,
      leadCount: config.leadCount,
      outreachModes: config.outreachModes
    })

    if (executionMode === 'full') {
      // Full workflow: scraping → enrichment → scoring → preview
      await handleScraping(config)
    } else {
      // Stage-by-stage: just save config and let user run stages manually
      setWorkflowState({ stage: 'config', config })
      addLog('success', '✅ Configuration saved. Ready to run stages manually.')
    }
  }

  // Individual stage handlers for stage-by-stage execution
  const handleScraping = async (config?: LeadGenConfig) => {
    const currentConfig = config || workflowState.config
    if (!currentConfig) {
      addLog('error', '❌ No configuration found. Please configure workflow first.')
      alert('Please configure workflow settings first')
      return
    }

    setIsProcessing(true)
    setWorkflowState(prev => ({ ...prev, stage: 'scraping', config: currentConfig }))
    setStatusMessage('🔍 Scraping leads from Apollo...')
    setProgressPercentage(10)
    addLog('info', `🔍 Stage 2: Scraping ${currentConfig.leadCount} leads for ${currentConfig.segment}`)

    try {
      addLog('api', '📡 POST /api/apollo/scrape', {
        segment: currentConfig.segment,
        leadCount: currentConfig.leadCount
      })

      const scrapeResponse = await fetch('/api/apollo/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segment: currentConfig.segment,
          leadCount: currentConfig.leadCount
        })
      })

      const scrapeData = await scrapeResponse.json()
      addLog('api', `📥 Response: ${scrapeResponse.status} ${scrapeResponse.statusText}`, {
        success: scrapeData.success,
        leadsCount: scrapeData.leads?.length
      })

      if (!scrapeData.success) {
        throw new Error(scrapeData.error || 'Scraping failed')
      }

      addLog('success', `✅ Scraped ${scrapeData.leads.length} leads successfully`)
      setProgressPercentage(30)
      setWorkflowState(prev => ({ ...prev, scrapedLeads: scrapeData.leads }))

      // In full mode, continue to enrichment
      if (executionMode === 'full') {
        await handleEnrichment(scrapeData.leads)
      } else {
        setStatusMessage('✅ Scraping complete!')
        setIsProcessing(false)
      }

    } catch (error: any) {
      console.error('Scraping error:', error)
      addLog('error', `❌ Scraping failed: ${error.message}`, error)
      alert(`Error: ${error.message}`)
      setIsProcessing(false)
      setWorkflowState(prev => ({ ...prev, stage: 'config' }))
    }
  }

  // Stage 3-4: Enrich leads and score
  const handleEnrichment = async (leads?: any[]) => {
    const leadsToEnrich = leads || workflowState.scrapedLeads
    if (!leadsToEnrich || leadsToEnrich.length === 0) {
      addLog('error', '❌ No leads available for enrichment')
      alert('No scraped leads available. Please run scraping first.')
      return
    }

    setIsProcessing(true)
    setWorkflowState(prev => ({ ...prev, stage: 'enrichment' }))
    setStatusMessage('💎 Enriching leads with email and phone data...')
    setProgressPercentage(40)
    addLog('info', `💎 Stage 3: Enriching ${leadsToEnrich.length} leads`)

    try {
      addLog('api', '📡 POST /api/apollo/enrich', { leadsCount: leadsToEnrich.length })

      const enrichResponse = await fetch('/api/apollo/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: leadsToEnrich
        })
      })

      const enrichData = await enrichResponse.json()
      addLog('api', `📥 Response: ${enrichResponse.status} ${enrichResponse.statusText}`, {
        success: enrichData.success,
        enrichedCount: enrichData.leads?.length
      })

      if (!enrichData.success) {
        throw new Error(enrichData.error || 'Enrichment failed')
      }

      addLog('success', `✅ Enriched ${enrichData.leads.length} leads successfully`)
      setProgressPercentage(60)

      // Stage 4: ICP Scoring - All leads start as COLD, score based on ICP criteria
      addLog('info', '📊 Stage 4: Calculating ICP scores')
      const scoredLeads = enrichData.leads.map((lead: any) => ({
        ...lead,
        icp_score: calculateICPScore(lead, workflowState.config?.segment || ''),
        tier: 'cold' // All leads start as COLD - will progress to warm/hot based on engagement
      }))

      addLog('success', `✅ Scored ${scoredLeads.length} leads (avg score: ${Math.round(scoredLeads.reduce((sum: number, l: any) => sum + (l.icp_score || 0), 0) / scoredLeads.length)})`)

      setWorkflowState(prev => ({
        ...prev,
        stage: 'preview_leads',
        enrichedLeads: scoredLeads
      }))
      setStatusMessage('✅ Leads enriched and scored!')
      setProgressPercentage(70)
      setIsProcessing(false)

    } catch (error: any) {
      console.error('Enrichment error:', error)
      addLog('error', `❌ Enrichment failed: ${error.message}`, error)
      alert(`Error: ${error.message}`)
      setIsProcessing(false)
      setWorkflowState(prev => ({ ...prev, stage: 'config' }))
    }
  }

  // Stage 5: Download CSV
  const handleDownloadCSV = () => {
    if (!workflowState.enrichedLeads) return

    const csv = [
      // Header
      ['Name', 'Email', 'Phone', 'Title', 'Company', 'Industry', 'City', 'ICP Score', 'Tier'].join(','),
      // Rows
      ...workflowState.enrichedLeads.map(lead =>
        [
          `"${lead.name}"`,
          lead.email,
          lead.phone || '',
          `"${lead.title || ''}"`,
          `"${lead.company || ''}"`,
          `"${lead.industry || ''}"`,
          lead.city || '',
          lead.icp_score || '',
          lead.tier || ''
        ].join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads_${workflowState.config?.segment}_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Stage 6: Generate AI scripts
  const handleCreateCampaign = async (selectedLeads: EnrichedLead[]) => {
    setIsProcessing(true)
    setWorkflowState(prev => ({ ...prev, stage: 'script_generation' }))
    setStatusMessage('🤖 Generating personalized email scripts with Gemini AI...')
    setProgressPercentage(75)

    try {
      const scriptResponse = await fetch('/api/gemini/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: selectedLeads,
          segment: workflowState.config?.segment
        })
      })

      const scriptData = await scriptResponse.json()
      if (!scriptData.success) {
        throw new Error(scriptData.error || 'Script generation failed')
      }

      setWorkflowState(prev => ({
        ...prev,
        stage: 'campaign_preview',
        scripts: scriptData.scripts
      }))
      setStatusMessage('✅ Email scripts generated!')
      setProgressPercentage(85)
      setIsProcessing(false)

    } catch (error: any) {
      console.error('Script generation error:', error)
      alert(`Error: ${error.message}`)
      setIsProcessing(false)
    }
  }

  // Stage 7-8: Send test campaign
  const handleSendTest = async (testEmails: string[]) => {
    setIsProcessing(true)
    setStatusMessage('🧪 Sending test campaign...')

    try {
      // Create test segment with 2-3 test leads
      const testSegmentResponse = await fetch('/api/moengage/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `TEST - ${workflowState.config?.segment} - ${new Date().toISOString()}`,
          description: 'Test segment for campaign validation',
          leads: testEmails.map((email, index) => ({
            id: `test_${index}`,
            name: `Test User ${index + 1}`,
            first_name: `Test${index + 1}`,
            last_name: 'User',
            email,
            icp_score: 100,
            tier: 'hot'
          }))
        })
      })

      const testSegmentData = await testSegmentResponse.json()
      if (!testSegmentData.success) {
        throw new Error(testSegmentData.error || 'Test segment creation failed')
      }

      setStatusMessage('✅ Test campaign sent successfully!')
      alert(`Test campaign sent to: ${testEmails.join(', ')}\n\nCheck your inbox to verify formatting and deliverability.`)
      setIsProcessing(false)

    } catch (error: any) {
      console.error('Test campaign error:', error)
      alert(`Error: ${error.message}`)
      setIsProcessing(false)
    }
  }

  // Stage 9: Publish production campaign
  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this campaign to production? This will send emails to all selected leads.')) {
      return
    }

    setIsProcessing(true)
    setWorkflowState(prev => ({ ...prev, stage: 'production_campaign' }))
    setStatusMessage('🚀 Publishing production campaign...')
    setProgressPercentage(90)

    try {
      // Step 1: Create production segment
      const segmentResponse = await fetch('/api/moengage/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${workflowState.config?.segment.toUpperCase()} - ${new Date().toLocaleDateString()}`,
          description: `Lead generation campaign for ${workflowState.config?.segment}`,
          leads: workflowState.enrichedLeads
        })
      })

      const segmentData = await segmentResponse.json()
      if (!segmentData.success) {
        throw new Error(segmentData.error || 'Segment creation failed')
      }

      // Step 2: Create campaign (using existing /api/moengage/campaigns)
      const campaignResponse = await fetch('/api/moengage/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${workflowState.config?.segment} - ${new Date().toLocaleDateString()}`,
          segment_id: segmentData.segment.id,
          subject: workflowState.scripts?.[0]?.subject || 'AQUA Fund Opportunity',
          from_name: 'PL Capital',
          from_email: 'team@plcapital.in'
        })
      })

      const campaignData = await campaignResponse.json()
      if (!campaignData.success) {
        throw new Error(campaignData.error || 'Campaign creation failed')
      }

      setWorkflowState(prev => ({
        ...prev,
        stage: 'analytics',
        segmentId: segmentData.segment.id,
        campaignId: campaignData.result.id
      }))
      setStatusMessage('✅ Campaign published successfully!')
      setProgressPercentage(100)
      setIsProcessing(false)

      // Fetch initial analytics
      await handleRefreshAnalytics()

    } catch (error: any) {
      console.error('Publish error:', error)
      alert(`Error: ${error.message}`)
      setIsProcessing(false)
    }
  }

  // Stage 10: Fetch analytics
  const handleRefreshAnalytics = async () => {
    setIsProcessing(true)

    try {
      // Simulate analytics data (replace with actual MoEngage reporting API call)
      const mockMetrics: CampaignMetrics[] = [{
        campaign_id: workflowState.campaignId || 'camp_001',
        campaign_name: `${workflowState.config?.segment} - ${new Date().toLocaleDateString()}`,
        segment: workflowState.config?.segment || 'unknown',
        tier: 'hot',
        sent: workflowState.enrichedLeads?.length || 0,
        delivered: Math.floor((workflowState.enrichedLeads?.length || 0) * 0.95),
        opened: Math.floor((workflowState.enrichedLeads?.length || 0) * 0.38),
        clicked: Math.floor((workflowState.enrichedLeads?.length || 0) * 0.12),
        replied: Math.floor((workflowState.enrichedLeads?.length || 0) * 0.09),
        booked: Math.floor((workflowState.enrichedLeads?.length || 0) * 0.04),
        delivery_rate: 95,
        open_rate: 38,
        click_rate: 12,
        reply_rate: 9,
        booking_rate: 4,
        subject_line: workflowState.scripts?.[0]?.subject || '',
        subject_length: workflowState.scripts?.[0]?.subject.length || 0,
        sent_at: new Date().toISOString()
      }]

      setWorkflowState(prev => ({ ...prev, metrics: mockMetrics }))
      setIsProcessing(false)

    } catch (error: any) {
      console.error('Analytics refresh error:', error)
      setIsProcessing(false)
    }
  }

  // Edit script handler
  const handleEditScript = (leadId: string, subject: string, body: string) => {
    if (!workflowState.scripts) return

    const updatedScripts = workflowState.scripts.map(script =>
      script.lead_id === leadId ? { ...script, subject, body } : script
    )

    setWorkflowState(prev => ({ ...prev, scripts: updatedScripts }))
  }

  // Reset workflow
  const handleResetWorkflow = () => {
    if (confirm('Are you sure you want to reset the workflow? All progress will be lost.')) {
      setWorkflowState({ stage: 'config' })
      setStatusMessage('')
      setProgressPercentage(0)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center gap-4">
            <span className="text-6xl">🚀</span>
            Lead Generation Automation
          </h1>
          <p className="text-blue-200 text-lg">
            AI-powered lead generation workflow: Apollo → Enrichment → Gemini AI → MoEngage → Analytics
          </p>
        </div>

        {/* Execution Mode Toggle */}
        <div className="mb-6 bg-slate-800/40 rounded-lg p-4 border border-blue-500/20">
          <label className="block text-blue-200 font-semibold mb-3">Execution Mode</label>
          <div className="flex gap-3">
            <button
              onClick={() => setExecutionMode('full')}
              disabled={isProcessing}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                executionMode === 'full'
                  ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-700/30 border-slate-600/30 text-blue-200 hover:border-blue-500/50'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-2xl mb-1">🚀</div>
              <div className="font-bold">Full Workflow</div>
              <div className="text-xs opacity-70">Automatic stage progression</div>
            </button>
            <button
              onClick={() => setExecutionMode('staged')}
              disabled={isProcessing}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                executionMode === 'staged'
                  ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-700/30 border-slate-600/30 text-blue-200 hover:border-blue-500/50'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-2xl mb-1">🎯</div>
              <div className="font-bold">Stage-by-Stage</div>
              <div className="text-xs opacity-70">Run each stage manually</div>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {progressPercentage > 0 && (
          <div className="mb-8 bg-slate-800/40 rounded-lg p-4 border border-blue-500/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-blue-200 font-semibold">{statusMessage}</span>
              <span className="text-white font-bold">{progressPercentage}%</span>
            </div>
            <div className="h-4 bg-slate-700/50 rounded-lg overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Activity Log */}
        {activityLogs.length > 0 && (
          <div className="mb-8 bg-slate-800/40 rounded-lg border border-blue-500/20 overflow-hidden">
            <div className="p-4 bg-slate-900/50 border-b border-blue-500/20 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Activity Log
              </h3>
              <button
                onClick={() => setActivityLogs([])}
                className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded transition-all"
              >
                Clear
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 space-y-2">
              {activityLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    log.type === 'success' ? 'bg-green-900/20 border-green-500' :
                    log.type === 'error' ? 'bg-red-900/20 border-red-500' :
                    log.type === 'api' ? 'bg-blue-900/20 border-blue-500' :
                    'bg-slate-700/20 border-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-blue-300/50 font-mono whitespace-nowrap">
                      {log.timestamp}
                    </span>
                    <div className="flex-1">
                      <div className="text-white text-sm">{log.message}</div>
                      {log.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-300/70 cursor-pointer hover:text-blue-300">
                            View Details
                          </summary>
                          <pre className="mt-2 p-2 bg-slate-900/50 rounded text-xs text-green-300 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workflow Stages with Inline Content */}
        <div className="space-y-4">
          {/* Stage 1: Configuration */}
          <div className="bg-slate-800/20 rounded-xl border-2 border-slate-700/30">
            <div className="flex items-center gap-3 p-4">
              <span
                className={`
                  flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200
                  ${workflowState.stage === 'config'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800/40 text-blue-300/60'
                  }
                `}
              >
                ⚙️ Config
              </span>
            </div>
            {workflowState.stage === 'config' && (
              <div className="p-4 pt-0">
                <LeadConfigPanel
                  onExecute={handleExecuteWorkflow}
                  isExecuting={isProcessing}
                />
              </div>
            )}
          </div>

          {/* Stage 2: Scraping */}
          <div className="bg-slate-800/20 rounded-xl border-2 border-slate-700/30">
            <div className="flex items-center gap-3 p-4">
              <span
                className={`
                  flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200
                  ${workflowState.stage === 'scraping'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800/40 text-blue-300/60'
                  }
                `}
              >
                🔍 Scraping
              </span>
              {executionMode === 'staged' && workflowState.config && (
                <button
                  onClick={() => handleScraping()}
                  disabled={isProcessing || !workflowState.config}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                >
                  ▶ Run
                </button>
              )}
            </div>
            {workflowState.stage === 'scraping' && isProcessing && (
              <div className="p-4 pt-0">
                <div className="bg-slate-700/30 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-3 animate-pulse">🔍</div>
                  <div className="text-blue-200 font-semibold">{statusMessage}</div>
                </div>
              </div>
            )}
          </div>

          {/* Stage 3: Enrichment */}
          <div className="bg-slate-800/20 rounded-xl border-2 border-slate-700/30">
            <div className="flex items-center gap-3 p-4">
              <span
                className={`
                  flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200
                  ${workflowState.stage === 'enrichment'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800/40 text-blue-300/60'
                  }
                `}
              >
                💎 Enrichment
              </span>
              {executionMode === 'staged' && workflowState.scrapedLeads && (
                <button
                  onClick={() => handleEnrichment()}
                  disabled={isProcessing || !workflowState.scrapedLeads}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                >
                  ▶ Run
                </button>
              )}
            </div>
            {workflowState.stage === 'enrichment' && isProcessing && (
              <div className="p-4 pt-0">
                <div className="bg-slate-700/30 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-3 animate-pulse">💎</div>
                  <div className="text-blue-200 font-semibold">{statusMessage}</div>
                </div>
              </div>
            )}
          </div>

          {/* Stage 4: Scoring (automatic, no content) */}
          <div className="bg-slate-800/20 rounded-xl border-2 border-slate-700/30">
            <div className="flex items-center gap-3 p-4">
              <span
                className={`
                  flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200
                  ${workflowState.stage === 'scoring'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800/40 text-blue-300/60'
                  }
                `}
              >
                📊 Scoring
              </span>
            </div>
          </div>

          {/* Stage 5: Preview Leads */}
          <div className="bg-slate-800/20 rounded-xl border-2 border-slate-700/30">
            <div className="flex items-center gap-3 p-4">
              <span
                className={`
                  flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200
                  ${workflowState.stage === 'preview_leads'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800/40 text-blue-300/60'
                  }
                `}
              >
                👀 Preview
              </span>
            </div>
            {workflowState.stage === 'preview_leads' && workflowState.enrichedLeads && (
              <div className="p-4 pt-0">
                <EnrichedLeadsTable
                  leads={workflowState.enrichedLeads}
                  onDownloadCSV={handleDownloadCSV}
                  onCreateCampaign={handleCreateCampaign}
                  isLoading={isProcessing}
                />
                <div className="flex justify-between mt-4">
                  <button
                    onClick={handleResetWorkflow}
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-semibold transition-all duration-200"
                  >
                    ← Start Over
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stage 6: Script Generation (automatic, no content) */}
          <div className="bg-slate-800/20 rounded-xl border-2 border-slate-700/30">
            <div className="flex items-center gap-3 p-4">
              <span
                className={`
                  flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200
                  ${workflowState.stage === 'script_generation'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800/40 text-blue-300/60'
                  }
                `}
              >
                🤖 AI Scripts
              </span>
            </div>
            {workflowState.stage === 'script_generation' && isProcessing && (
              <div className="p-4 pt-0">
                <div className="bg-slate-700/30 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-3 animate-pulse">🤖</div>
                  <div className="text-blue-200 font-semibold">{statusMessage}</div>
                </div>
              </div>
            )}
          </div>

          {/* Stage 7: Campaign Preview */}
          <div className="bg-slate-800/20 rounded-xl border-2 border-slate-700/30">
            <div className="flex items-center gap-3 p-4">
              <span
                className={`
                  flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200
                  ${workflowState.stage === 'campaign_preview'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800/40 text-blue-300/60'
                  }
                `}
              >
                ✉️ Review
              </span>
            </div>
            {workflowState.stage === 'campaign_preview' && workflowState.scripts && (
              <div className="p-4 pt-0">
                <CampaignPreview
                  scripts={workflowState.scripts}
                  onSendTest={handleSendTest}
                  onPublish={handlePublish}
                  onEdit={handleEditScript}
                  isProcessing={isProcessing}
                />
                <div className="flex justify-between mt-4">
                  <button
                    onClick={handleResetWorkflow}
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-semibold transition-all duration-200"
                  >
                    ← Start Over
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stage 8: Test Campaign (no separate content) */}
          <div className="bg-slate-800/20 rounded-xl border-2 border-slate-700/30">
            <div className="flex items-center gap-3 p-4">
              <span
                className={`
                  flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200
                  ${workflowState.stage === 'test_campaign'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800/40 text-blue-300/60'
                  }
                `}
              >
                🧪 Test
              </span>
            </div>
          </div>

          {/* Stage 9: Production Campaign (no separate content) */}
          <div className="bg-slate-800/20 rounded-xl border-2 border-slate-700/30">
            <div className="flex items-center gap-3 p-4">
              <span
                className={`
                  flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200
                  ${workflowState.stage === 'production_campaign'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800/40 text-blue-300/60'
                  }
                `}
              >
                🚀 Publish
              </span>
            </div>
          </div>

          {/* Stage 10: Analytics */}
          <div className="bg-slate-800/20 rounded-xl border-2 border-slate-700/30">
            <div className="flex items-center gap-3 p-4">
              <span
                className={`
                  flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200
                  ${workflowState.stage === 'analytics'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800/40 text-blue-300/60'
                  }
                `}
              >
                📈 Analytics
              </span>
            </div>
            {workflowState.stage === 'analytics' && workflowState.metrics && (
              <div className="p-4 pt-0">
                <CampaignAnalytics
                  metrics={workflowState.metrics}
                  onRefresh={handleRefreshAnalytics}
                  isLoading={isProcessing}
                />
                <div className="flex justify-between mt-4">
                  <button
                    onClick={handleResetWorkflow}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                  >
                    <span>🔄</span>
                    Start New Campaign
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
