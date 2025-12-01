'use client'

interface LeadScoringProps {
  data: {
    total: number
    hot: number
    warm: number
    cold: number
    qualityScore: number
    duplicatesRemoved: number
    averageScore: number
    distribution?: {
      '0-40': number
      '40-60': number
      '60-80': number
      '80-100': number
    }
  }
}

export default function LeadScoringDashboard({ data }: LeadScoringProps) {
  const hotPercentage = (data.hot / data.total) * 100
  const warmPercentage = (data.warm / data.total) * 100
  const coldPercentage = (data.cold / data.total) * 100

  return (
    <div className="mt-4 space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-red-400">{data.hot}</div>
          <div className="text-sm text-red-300">🔥 Hot Leads</div>
          <div className="text-xs text-red-200 mt-1">{hotPercentage.toFixed(1)}%</div>
        </div>
        <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-yellow-400">{data.warm}</div>
          <div className="text-sm text-yellow-300">⚡ Warm Leads</div>
          <div className="text-xs text-yellow-200 mt-1">{warmPercentage.toFixed(1)}%</div>
        </div>
        <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-blue-400">{data.cold}</div>
          <div className="text-sm text-blue-300">❄️ Cold Leads</div>
          <div className="text-xs text-blue-200 mt-1">{coldPercentage.toFixed(1)}%</div>
        </div>
        <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-400">{data.total}</div>
          <div className="text-sm text-green-300">✓ Total Processed</div>
          <div className="text-xs text-green-200 mt-1">100%</div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="bg-white/5 rounded-xl p-4">
        <h4 className="text-white font-bold mb-3">📊 Quality Metrics</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{data.qualityScore}%</div>
            <div className="text-sm text-blue-200">Data Quality</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{data.averageScore}</div>
            <div className="text-sm text-blue-200">Avg ICP Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{data.duplicatesRemoved}</div>
            <div className="text-sm text-blue-200">Duplicates Removed</div>
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      {data.distribution && (
        <div className="bg-white/5 rounded-xl p-4">
          <h4 className="text-white font-bold mb-3">📈 Score Distribution</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-blue-200">0-40 (Cold)</div>
              <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-blue-500 h-full flex items-center justify-end px-2 text-xs text-white font-bold"
                  style={{ width: `${(data.distribution['0-40'] / data.total) * 100}%` }}
                >
                  {data.distribution['0-40']}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-blue-200">40-60</div>
              <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-cyan-500 h-full flex items-center justify-end px-2 text-xs text-white font-bold"
                  style={{ width: `${(data.distribution['40-60'] / data.total) * 100}%` }}
                >
                  {data.distribution['40-60']}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-blue-200">60-80 (Warm)</div>
              <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-yellow-500 h-full flex items-center justify-end px-2 text-xs text-white font-bold"
                  style={{ width: `${(data.distribution['60-80'] / data.total) * 100}%` }}
                >
                  {data.distribution['60-80']}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-blue-200">80-100 (Hot)</div>
              <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-red-500 h-full flex items-center justify-end px-2 text-xs text-white font-bold"
                  style={{ width: `${(data.distribution['80-100'] / data.total) * 100}%` }}
                >
                  {data.distribution['80-100']}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ICP Scoring Weights */}
      <div className="bg-white/5 rounded-xl p-4">
        <h4 className="text-white font-bold mb-2">⚖️ ICP Scoring Model</h4>
        <p className="text-sm text-blue-200">
          Leads are scored 0-100 using segment-specific weights for factors like net worth signals,
          role seniority, digital presence, and engagement patterns.
        </p>
      </div>
    </div>
  )
}
