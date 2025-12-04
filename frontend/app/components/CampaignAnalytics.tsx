'use client'

import { useState, useEffect } from 'react'

export interface CampaignMetrics {
  campaign_id: string
  campaign_name: string
  segment: string
  tier: 'hot' | 'warm' | 'cold'

  // Email metrics
  sent: number
  delivered: number
  opened: number
  clicked: number
  replied: number
  booked: number

  // Rates
  delivery_rate: number
  open_rate: number
  click_rate: number
  reply_rate: number
  booking_rate: number

  // Subject line analysis
  subject_line: string
  subject_length: number

  // Timing
  sent_at: string

  // Best performers
  best_performing_leads?: Array<{
    name: string
    action: string
    timestamp: string
  }>
}

export interface AIOptimizationInsights {
  overall_performance: 'excellent' | 'good' | 'average' | 'poor'
  recommendations: string[]
  subject_line_suggestions: string[]
  optimal_send_time: string
  content_improvements: string[]
  predicted_improvement: number // % improvement if recommendations applied
}

interface CampaignAnalyticsProps {
  metrics: CampaignMetrics[]
  onRefresh: () => void
  isLoading?: boolean
}

export default function CampaignAnalytics({
  metrics,
  onRefresh,
  isLoading = false
}: CampaignAnalyticsProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [aiInsights, setAIInsights] = useState<AIOptimizationInsights | null>(null)

  useEffect(() => {
    if (metrics.length > 0 && !selectedCampaign) {
      setSelectedCampaign(metrics[0].campaign_id)
    }
  }, [metrics, selectedCampaign])

  useEffect(() => {
    if (selectedCampaign) {
      // Simulate AI insights generation (in production, call Gemini API)
      generateAIInsights(metrics.find(m => m.campaign_id === selectedCampaign)!)
    }
  }, [selectedCampaign, metrics])

  const generateAIInsights = (campaignMetrics: CampaignMetrics) => {
    // Simulate AI analysis (replace with actual Gemini API call)
    const insights: AIOptimizationInsights = {
      overall_performance: campaignMetrics.open_rate > 40 ? 'excellent' :
                          campaignMetrics.open_rate > 30 ? 'good' :
                          campaignMetrics.open_rate > 20 ? 'average' : 'poor',
      recommendations: [],
      subject_line_suggestions: [],
      optimal_send_time: '9:00 AM - 11:00 AM IST (Tuesday-Thursday)',
      content_improvements: [],
      predicted_improvement: 0
    }

    // Generate recommendations based on metrics
    if (campaignMetrics.open_rate < 35) {
      insights.recommendations.push('Subject lines need improvement - consider adding curiosity hooks')
      insights.subject_line_suggestions.push(`${campaignMetrics.tier === 'hot' ? 'Exclusive' : 'Question-based'} subject lines perform 23% better`)
      insights.predicted_improvement += 12
    }

    if (campaignMetrics.click_rate < 10) {
      insights.recommendations.push('Add more compelling CTAs earlier in the email body')
      insights.content_improvements.push('Move primary CTA to after 2nd paragraph (currently at end)')
      insights.predicted_improvement += 8
    }

    if (campaignMetrics.reply_rate < 8) {
      insights.recommendations.push('Personalize the opening line further - reference specific company achievements')
      insights.content_improvements.push('Add question at the end to encourage replies')
      insights.predicted_improvement += 15
    }

    if (campaignMetrics.subject_length > 50) {
      insights.recommendations.push('Subject line too long - mobile truncation at 50 chars')
      insights.subject_line_suggestions.push('Shorten to 35-45 characters for mobile visibility')
      insights.predicted_improvement += 5
    }

    insights.content_improvements.push('A/B test: Include 76% return stat in subject line vs body')
    insights.content_improvements.push('Consider adding a PS with social proof (client testimonial)')

    setAIInsights(insights)
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl p-8 border border-blue-500/30 backdrop-blur-sm shadow-2xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">📊</div>
            <div className="text-blue-200 text-lg">Loading campaign analytics...</div>
          </div>
        </div>
      </div>
    )
  }

  if (metrics.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl p-8 border border-blue-500/30 backdrop-blur-sm shadow-2xl">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-blue-200 text-lg">No campaign analytics yet</div>
          <div className="text-blue-300/60 text-sm mt-2">Publish a campaign to see performance metrics here</div>
        </div>
      </div>
    )
  }

  const currentMetrics = metrics.find(m => m.campaign_id === selectedCampaign) || metrics[0]

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl p-8 border border-blue-500/30 backdrop-blur-sm shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="text-4xl">📊</span>
          Campaign Analytics
        </h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
        >
          <span>🔄</span>
          Refresh
        </button>
      </div>

      {/* Campaign Selector */}
      <div className="mb-6">
        <label className="block text-blue-200 font-semibold mb-3">
          Select Campaign:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {metrics.map((metric) => (
            <button
              key={metric.campaign_id}
              onClick={() => setSelectedCampaign(metric.campaign_id)}
              className={`
                p-4 rounded-lg font-semibold transition-all duration-200 text-left border-2
                ${selectedCampaign === metric.campaign_id
                  ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800/30 border-slate-600/30 hover:border-blue-500/50'
                }
              `}
            >
              <div className="text-white font-bold truncate">{metric.campaign_name}</div>
              <div className="text-blue-300/60 text-sm">{metric.segment} - {metric.tier.toUpperCase()}</div>
              <div className="text-blue-300/60 text-xs mt-1">{new Date(metric.sent_at).toLocaleString()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Performance Funnel */}
      <div className="mb-6">
        <h3 className="text-blue-200 font-bold text-xl mb-4">Conversion Funnel</h3>
        <div className="space-y-3">
          {[
            { label: 'Sent', value: currentMetrics.sent, rate: 100, color: 'blue' },
            { label: 'Delivered', value: currentMetrics.delivered, rate: currentMetrics.delivery_rate, color: 'green' },
            { label: 'Opened', value: currentMetrics.opened, rate: currentMetrics.open_rate, color: 'yellow' },
            { label: 'Clicked', value: currentMetrics.clicked, rate: currentMetrics.click_rate, color: 'orange' },
            { label: 'Replied', value: currentMetrics.replied, rate: currentMetrics.reply_rate, color: 'purple' },
            { label: 'Booked Call', value: currentMetrics.booked, rate: currentMetrics.booking_rate, color: 'red' }
          ].map((stage) => (
            <div key={stage.label} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-200 font-semibold">{stage.label}</span>
                <span className="text-white font-bold">{stage.value} ({stage.rate.toFixed(1)}%)</span>
              </div>
              <div className="h-8 bg-slate-800/40 rounded-lg overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r from-${stage.color}-500 to-${stage.color}-600 transition-all duration-500 flex items-center justify-end px-4`}
                  style={{ width: `${stage.rate}%` }}
                >
                  <span className="text-white text-sm font-semibold">{stage.rate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
          <div className="text-green-300/70 text-sm">Open Rate</div>
          <div className="text-white text-3xl font-bold">{currentMetrics.open_rate.toFixed(1)}%</div>
          <div className="text-green-300/60 text-xs mt-1">Industry avg: 35%</div>
        </div>
        <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/30">
          <div className="text-orange-300/70 text-sm">Click Rate</div>
          <div className="text-white text-3xl font-bold">{currentMetrics.click_rate.toFixed(1)}%</div>
          <div className="text-orange-300/60 text-xs mt-1">Industry avg: 10%</div>
        </div>
        <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/30">
          <div className="text-purple-300/70 text-sm">Reply Rate</div>
          <div className="text-white text-3xl font-bold">{currentMetrics.reply_rate.toFixed(1)}%</div>
          <div className="text-purple-300/60 text-xs mt-1">Industry avg: 8%</div>
        </div>
        <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
          <div className="text-red-300/70 text-sm">Booking Rate</div>
          <div className="text-white text-3xl font-bold">{currentMetrics.booking_rate.toFixed(1)}%</div>
          <div className="text-red-300/60 text-xs mt-1">Target: 5%</div>
        </div>
      </div>

      {/* AI Optimization Insights */}
      {aiInsights && (
        <div className="bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-purple-500/30 mb-6">
          <h3 className="text-purple-200 font-bold text-2xl mb-4 flex items-center gap-2">
            <span>🤖</span>
            AI Optimization Insights
          </h3>

          {/* Performance Rating */}
          <div className="mb-6 p-4 bg-slate-800/40 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-200 font-semibold">Overall Performance:</span>
              <span className={`
                px-4 py-2 rounded-lg font-bold text-lg
                ${aiInsights.overall_performance === 'excellent' ? 'bg-green-500/20 text-green-300' :
                  aiInsights.overall_performance === 'good' ? 'bg-blue-500/20 text-blue-300' :
                  aiInsights.overall_performance === 'average' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-red-500/20 text-red-300'}
              `}>
                {aiInsights.overall_performance.toUpperCase()}
              </span>
            </div>
            {aiInsights.predicted_improvement > 0 && (
              <div className="mt-2 text-green-300 text-sm">
                ⬆️ Potential improvement: +{aiInsights.predicted_improvement}% if recommendations applied
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="mb-4">
            <h4 className="text-purple-200 font-semibold mb-3 flex items-center gap-2">
              <span>💡</span>
              Key Recommendations:
            </h4>
            <div className="space-y-2">
              {aiInsights.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 bg-slate-800/30 p-3 rounded-lg">
                  <span className="text-blue-400 text-xl">→</span>
                  <span className="text-blue-200">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Line Suggestions */}
          {aiInsights.subject_line_suggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-purple-200 font-semibold mb-3 flex items-center gap-2">
                <span>✍️</span>
                Subject Line Improvements:
              </h4>
              <div className="space-y-2">
                {aiInsights.subject_line_suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 bg-slate-800/30 p-3 rounded-lg">
                    <span className="text-yellow-400 text-xl">✨</span>
                    <span className="text-blue-200">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Improvements */}
          {aiInsights.content_improvements.length > 0 && (
            <div className="mb-4">
              <h4 className="text-purple-200 font-semibold mb-3 flex items-center gap-2">
                <span>📝</span>
                Content Improvements:
              </h4>
              <div className="space-y-2">
                {aiInsights.content_improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start gap-3 bg-slate-800/30 p-3 rounded-lg">
                    <span className="text-green-400 text-xl">✓</span>
                    <span className="text-blue-200">{improvement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimal Send Time */}
          <div className="bg-slate-800/30 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-200 font-semibold">Optimal Send Time:</span>
              <span className="text-green-300 font-bold">{aiInsights.optimal_send_time}</span>
            </div>
          </div>
        </div>
      )}

      {/* Best Performers */}
      {currentMetrics.best_performing_leads && currentMetrics.best_performing_leads.length > 0 && (
        <div className="bg-slate-800/40 rounded-lg p-6 border border-green-500/30">
          <h3 className="text-green-200 font-bold text-xl mb-4 flex items-center gap-2">
            <span>⭐</span>
            Best Performing Leads
          </h3>
          <div className="space-y-3">
            {currentMetrics.best_performing_leads.map((lead, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-700/30 p-3 rounded-lg">
                <div>
                  <div className="text-white font-semibold">{lead.name}</div>
                  <div className="text-blue-300/60 text-sm">{lead.action}</div>
                </div>
                <div className="text-green-300 text-sm">{new Date(lead.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
