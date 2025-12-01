'use client'

import { useState, useEffect } from 'react'
import LeadScoringDashboard from './components/LeadScoringDashboard'
import OutreachCampaigns from './components/OutreachCampaigns'

type WorkflowStage = {
  id: number
  name: string
  status: 'idle' | 'running' | 'completed' | 'error'
  message: string
}

type ExecutionMode = 'full' | 'staged'
type Segment = 'partners' | 'hni' | 'uhni' | 'mass_affluent' | 'signals-hni' | 'signals-uhni' | 'signals-mass-affluent' | 'signals-partners'

export default function Home() {
  // Workflow state
  const [stages, setStages] = useState<WorkflowStage[]>([
    { id: 1, name: 'Stage 1: Configuration & Setup', status: 'idle', message: '' },
    { id: 2, name: 'Stage 2: Lead Scraping', status: 'idle', message: '' },
    { id: 3, name: 'Stage 3: Data Processing', status: 'idle', message: '' },
    { id: 4, name: 'Stage 4: CRM Integration', status: 'idle', message: '' },
    { id: 5, name: 'Stage 5: Outreach Campaigns', status: 'idle', message: '' },
    { id: 6, name: 'Stage 6: Analytics & Tracking', status: 'idle', message: '' },
  ])

  // Configuration state
  const [segment, setSegment] = useState<Segment>('hni')
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('full')
  const [liveMode, setLiveMode] = useState(false)
  const [maxResults, setMaxResults] = useState(100)
  const [isExecuting, setIsExecuting] = useState(false)

  // Stage data
  const [scrapingData, setScrapingData] = useState<any>(null)
  const [processingData, setProcessingData] = useState<any>(null)
  const [outreachData, setOutreachData] = useState<any>(null)

  // Segments configuration
  const segments = [
    { value: 'partners', label: 'Partners', icon: '🤝', description: 'IFAs & Wealth Managers' },
    { value: 'hni', label: 'HNIs', icon: '💼', description: '₹5-25 Cr Net Worth' },
    { value: 'uhni', label: 'UHNIs', icon: '👔', description: '₹25 Cr+ Net Worth' },
    { value: 'mass_affluent', label: 'Mass Affluent', icon: '📈', description: '₹50 Lakh - ₹5 Cr' },
    { value: 'signals-hni', label: 'HNI Signals', icon: '🎯', description: 'Intent-based HNI' },
    { value: 'signals-uhni', label: 'UHNI Signals', icon: '🎯', description: 'Intent-based UHNI' },
    { value: 'signals-mass-affluent', label: 'Mass Signals', icon: '🎯', description: 'Intent-based Mass' },
    { value: 'signals-partners', label: 'Partner Signals', icon: '🎯', description: 'Intent-based Partners' },
  ]

  // SSE streaming for workflow execution
  const executeWorkflow = async (stageId?: number) => {
    setIsExecuting(true)

    const endpoint = stageId
      ? `/api/workflow/segment?segment=${segment}&stage=${stageId}&live=${liveMode}&maxResults=${maxResults}`
      : `/api/workflow/execute?segment=${segment}&live=${liveMode}&maxResults=${maxResults}`

    const eventSource = new EventSource(endpoint)

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'stage_start') {
        updateStageStatus(data.stage, 'running', `Starting ${data.message}...`)
      } else if (data.type === 'stage_progress') {
        updateStageStatus(data.stage, 'running', data.message)
      } else if (data.type === 'stage_complete') {
        updateStageStatus(data.stage, 'completed', data.message)
        if (data.data) {
          if (data.stage === 2) setScrapingData(data.data)
          if (data.stage === 3) setProcessingData(data.data)
          if (data.stage === 5) setOutreachData(data.data)
        }
      } else if (data.type === 'stage_error') {
        updateStageStatus(data.stage, 'error', data.message)
      } else if (data.type === 'workflow_complete') {
        setIsExecuting(false)
        eventSource.close()
      } else if (data.type === 'workflow_error') {
        setIsExecuting(false)
        eventSource.close()
        alert(`Workflow failed: ${data.message}`)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      setIsExecuting(false)
    }
  }

  const updateStageStatus = (stageId: number, status: WorkflowStage['status'], message: string) => {
    setStages(prev => prev.map(stage =>
      stage.id === stageId ? { ...stage, status, message } : stage
    ))
  }

  const resetWorkflow = () => {
    setStages(prev => prev.map(stage => ({ ...stage, status: 'idle', message: '' })))
    setScrapingData(null)
    setProcessingData(null)
    setOutreachData(null)
  }

  // Fetch workflow data periodically
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/workflow/data?segment=${segment}`)
        const data = await res.json()
        if (data.data) {
          if (data.data.scraping) setScrapingData(data.data.scraping)
          if (data.data.processing) setProcessingData(data.data.processing)
          if (data.data.outreach) setOutreachData(data.data.outreach)
        }
      } catch (error) {
        console.error('Failed to fetch workflow data:', error)
      }
    }

    const interval = setInterval(fetchData, 5000)
    fetchData()

    return () => clearInterval(interval)
  }, [segment])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-2">
            ⚡ PL Capital - Lead Generation Engine
          </h1>
          <p className="text-blue-200">
            Automated lead generation and outreach for Partners, HNIs, UHNIs & Mass Affluent
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">📋 Configuration</h2>

          {/* Segment Selection */}
          <div className="mb-6">
            <label className="block text-blue-200 mb-2 font-medium">Target Segment</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {segments.map(seg => (
                <button
                  key={seg.value}
                  onClick={() => setSegment(seg.value as Segment)}
                  disabled={isExecuting}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    segment === seg.value
                      ? 'bg-blue-500 border-blue-400 text-white'
                      : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
                  } ${isExecuting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="text-3xl mb-2">{seg.icon}</div>
                  <div className="font-bold">{seg.label}</div>
                  <div className="text-xs opacity-70">{seg.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Execution Mode */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-blue-200 mb-2 font-medium">Execution Mode</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setExecutionMode('full')}
                  disabled={isExecuting}
                  className={`flex-1 p-3 rounded-lg border transition-all ${
                    executionMode === 'full'
                      ? 'bg-blue-500 border-blue-400 text-white'
                      : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
                  } ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  🚀 Full Workflow
                </button>
                <button
                  onClick={() => setExecutionMode('staged')}
                  disabled={isExecuting}
                  className={`flex-1 p-3 rounded-lg border transition-all ${
                    executionMode === 'staged'
                      ? 'bg-blue-500 border-blue-400 text-white'
                      : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
                  } ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  🎯 Stage-by-Stage
                </button>
              </div>
            </div>

            <div>
              <label className="block text-blue-200 mb-2 font-medium">Environment</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setLiveMode(false)}
                  disabled={isExecuting}
                  className={`flex-1 p-3 rounded-lg border transition-all ${
                    !liveMode
                      ? 'bg-green-500 border-green-400 text-white'
                      : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
                  } ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  🧪 Simulation
                </button>
                <button
                  onClick={() => setLiveMode(true)}
                  disabled={isExecuting}
                  className={`flex-1 p-3 rounded-lg border transition-all ${
                    liveMode
                      ? 'bg-red-500 border-red-400 text-white'
                      : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
                  } ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ⚡ Live Mode
                </button>
              </div>
            </div>
          </div>

          {/* Max Results */}
          <div className="mb-6">
            <label className="block text-blue-200 mb-2 font-medium">
              Max Leads: {maxResults}
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              disabled={isExecuting}
              className="w-full"
            />
          </div>

          {/* Execute Buttons */}
          <div className="flex gap-3">
            {executionMode === 'full' ? (
              <button
                onClick={() => executeWorkflow()}
                disabled={isExecuting}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isExecuting ? '⏳ Executing...' : '🚀 Execute Full Workflow'}
              </button>
            ) : null}
            <button
              onClick={resetWorkflow}
              disabled={isExecuting}
              className="px-6 py-4 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Workflow Stages */}
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border transition-all ${
                stage.status === 'running' ? 'border-blue-400 animate-pulse-ring' :
                stage.status === 'completed' ? 'border-green-400' :
                stage.status === 'error' ? 'border-red-400' :
                'border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    stage.status === 'completed' ? 'bg-green-500' :
                    stage.status === 'running' ? 'bg-blue-500 animate-pulse' :
                    stage.status === 'error' ? 'bg-red-500' :
                    'bg-white/10'
                  }`}>
                    {stage.status === 'completed' ? '✓' :
                     stage.status === 'running' ? '⏳' :
                     stage.status === 'error' ? '✗' :
                     index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{stage.name}</h3>
                    {stage.message && (
                      <p className="text-sm text-blue-200 mt-1">{stage.message}</p>
                    )}
                  </div>
                </div>

                {executionMode === 'staged' && stage.status === 'idle' && (
                  <button
                    onClick={() => executeWorkflow(stage.id)}
                    disabled={isExecuting || (index > 0 && stages[index - 1].status !== 'completed')}
                    className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▶ Run Stage
                  </button>
                )}
              </div>

              {/* Stage-specific content */}
              {stage.id === 2 && scrapingData && (
                <div className="mt-4 p-4 bg-white/5 rounded-xl">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-white">{scrapingData.total || 0}</div>
                      <div className="text-sm text-blue-200">Leads Scraped</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-white">{scrapingData.withEmail || 0}</div>
                      <div className="text-sm text-blue-200">With Email</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-white">{scrapingData.withLinkedIn || 0}</div>
                      <div className="text-sm text-blue-200">With LinkedIn</div>
                    </div>
                  </div>
                </div>
              )}

              {stage.id === 3 && processingData && (
                <LeadScoringDashboard data={processingData} />
              )}

              {stage.id === 5 && outreachData && (
                <OutreachCampaigns data={outreachData} segment={segment} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
