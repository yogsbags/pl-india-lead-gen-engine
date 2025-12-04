'use client'

import { useState } from 'react'

interface LeadConfigPanelProps {
  onExecute: (config: LeadGenConfig) => void
  isExecuting?: boolean
}

export interface LeadGenConfig {
  segment: string
  leadCount: number
  outreachModes: string[]
}

const SEGMENT_OPTIONS = [
  {
    group: 'Partners',
    options: [
      { value: 'partners-mega', label: '🤝 Mega Partners', description: '500+ clients, ₹1,000+ Cr AUM' },
      { value: 'partners-large', label: '🤝 Large Partners', description: '200-500 clients, ₹500-1,000 Cr AUM' },
      { value: 'partners-medium', label: '🤝 Medium Partners', description: '100-200 clients, ₹200-500 Cr AUM' },
      { value: 'partners-small', label: '🤝 Small Partners', description: '50-100 clients, ₹100-200 Cr AUM' },
      { value: 'partners-micro', label: '🤝 Micro Partners', description: '<50 clients, <₹100 Cr AUM' }
    ]
  },
  {
    group: 'Clients',
    options: [
      { value: 'uhni', label: '👔 Ultra HNI (UHNI)', description: '>₹7 Cr net worth' },
      { value: 'hni', label: '💼 High Net Worth (HNI)', description: '₹2-7 Cr net worth' },
      { value: 'mass-affluent', label: '💰 Mass Affluent', description: '₹50L-2Cr net worth' }
    ]
  }
]

const OUTREACH_MODES = [
  { value: 'email', label: '✉️ Email', description: 'Personalized email campaigns' },
  { value: 'linkedin', label: '🔗 LinkedIn', description: 'Connection requests + messaging', disabled: true },
  { value: 'whatsapp', label: '💬 WhatsApp', description: 'WhatsApp Business messages', disabled: true },
  { value: 'video', label: '🎥 Video', description: 'HeyGen personalized videos', disabled: true }
]

export default function LeadConfigPanel({ onExecute, isExecuting = false }: LeadConfigPanelProps) {
  const [segment, setSegment] = useState<string>('partners-mega')
  const [leadCount, setLeadCount] = useState<number>(25)
  const [outreachModes, setOutreachModes] = useState<string[]>(['email'])

  const selectedSegmentInfo = SEGMENT_OPTIONS
    .flatMap(g => g.options)
    .find(opt => opt.value === segment)

  const handleOutreachModeToggle = (mode: string) => {
    if (outreachModes.includes(mode)) {
      // Don't allow deselecting email (at least one mode required)
      if (mode === 'email' && outreachModes.length === 1) return
      setOutreachModes(outreachModes.filter(m => m !== mode))
    } else {
      setOutreachModes([...outreachModes, mode])
    }
  }

  const handleExecute = () => {
    onExecute({
      segment,
      leadCount,
      outreachModes
    })
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl p-8 border border-blue-500/30 backdrop-blur-sm shadow-2xl">
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="text-4xl">⚙️</span>
        Lead Generation Configuration
      </h2>

      {/* Segment Selection */}
      <div className="mb-6">
        <label className="block text-blue-200 font-semibold mb-3 text-lg">
          Target Segment
        </label>
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          disabled={isExecuting}
          className="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {SEGMENT_OPTIONS.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selectedSegmentInfo && (
          <p className="mt-2 text-blue-300/70 text-sm">{selectedSegmentInfo.description}</p>
        )}
      </div>

      {/* Lead Count Slider */}
      <div className="mb-6">
        <label className="block text-blue-200 font-semibold mb-3 text-lg">
          Number of Leads: <span className="text-blue-400 font-bold">{leadCount}</span>
        </label>
        <input
          type="range"
          min="10"
          max="50"
          step="5"
          value={leadCount}
          onChange={(e) => setLeadCount(parseInt(e.target.value))}
          disabled={isExecuting}
          className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer range-slider disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-blue-300/50 text-sm mt-2">
          <span>10 leads</span>
          <span>50 leads (max)</span>
        </div>
      </div>

      {/* Outreach Mode Selection */}
      <div className="mb-6">
        <label className="block text-blue-200 font-semibold mb-3 text-lg">
          Outreach Channels
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {OUTREACH_MODES.map((mode) => (
            <div
              key={mode.value}
              onClick={() => !mode.disabled && !isExecuting && handleOutreachModeToggle(mode.value)}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${outreachModes.includes(mode.value)
                  ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800/30 border-slate-600/30 hover:border-blue-500/50'
                }
                ${mode.disabled || isExecuting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
              `}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={outreachModes.includes(mode.value)}
                  disabled={mode.disabled || isExecuting}
                  onChange={() => {}} // Handled by div onClick
                  className="w-5 h-5 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-white font-semibold flex items-center gap-2">
                    {mode.label}
                    {mode.disabled && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <div className="text-blue-300/60 text-sm">{mode.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Execute Button */}
      <button
        onClick={handleExecute}
        disabled={isExecuting}
        className={`
          w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200
          ${isExecuting
            ? 'bg-slate-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105'
          }
          text-white flex items-center justify-center gap-3
        `}
      >
        {isExecuting ? (
          <>
            <span className="animate-spin">⏳</span>
            Executing Workflow...
          </>
        ) : (
          <>
            <span>🚀</span>
            Start Lead Generation
          </>
        )}
      </button>

      {/* Execution Summary */}
      <div className="mt-6 p-4 bg-slate-800/20 rounded-lg border border-blue-500/20">
        <div className="text-blue-200 text-sm space-y-1">
          <div className="flex justify-between">
            <span>Target Segment:</span>
            <span className="font-semibold text-white">{selectedSegmentInfo?.label}</span>
          </div>
          <div className="flex justify-between">
            <span>Lead Count:</span>
            <span className="font-semibold text-white">{leadCount} leads</span>
          </div>
          <div className="flex justify-between">
            <span>Outreach Channels:</span>
            <span className="font-semibold text-white">
              {outreachModes.map(m => OUTREACH_MODES.find(om => om.value === m)?.label).join(', ')}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .range-slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        .range-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          border: none;
        }

        .range-slider::-webkit-slider-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }

        .range-slider::-moz-range-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  )
}
