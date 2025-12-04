'use client'

import { useState, useMemo } from 'react'

export interface EnrichedLead {
  id: string
  name: string
  first_name: string
  last_name: string
  email: string
  email_confidence: number
  phone?: string
  title?: string
  company?: string
  industry?: string
  employee_count?: number
  city?: string
  state?: string
  country?: string
  icp_score?: number
  tier?: 'hot' | 'warm' | 'cold'
}

interface EnrichedLeadsTableProps {
  leads: EnrichedLead[]
  onDownloadCSV: () => void
  onCreateCampaign: (leads: EnrichedLead[]) => void
  isLoading?: boolean
}

type FilterTier = 'all' | 'hot' | 'warm' | 'cold'

export default function EnrichedLeadsTable({
  leads,
  onDownloadCSV,
  onCreateCampaign,
  isLoading = false
}: EnrichedLeadsTableProps) {
  const [filter, setFilter] = useState<FilterTier>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())

  // Filter leads by tier and search
  const filteredLeads = useMemo(() => {
    let result = leads

    // Filter by tier
    if (filter !== 'all') {
      result = result.filter(lead => lead.tier === filter)
    }

    // Filter by search query (name, email, company)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(lead =>
        lead.name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        (lead.company && lead.company.toLowerCase().includes(query))
      )
    }

    return result
  }, [leads, filter, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    const hot = leads.filter(l => l.tier === 'hot').length
    const warm = leads.filter(l => l.tier === 'warm').length
    const cold = leads.filter(l => l.tier === 'cold').length
    const avgConfidence = leads.reduce((sum, l) => sum + l.email_confidence, 0) / leads.length
    const withPhone = leads.filter(l => l.phone).length

    return {
      total: leads.length,
      hot,
      warm,
      cold,
      avgConfidence: Math.round(avgConfidence * 10) / 10,
      withPhone,
      withPhonePercent: Math.round((withPhone / leads.length) * 100)
    }
  }, [leads])

  const getScoreBadge = (score?: number, tier?: string) => {
    if (!score || !tier) return null

    const colors = {
      hot: 'bg-red-500/20 text-red-300 border-red-500/30',
      warm: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      cold: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }

    const icons = {
      hot: '🔴',
      warm: '🟡',
      cold: '🔵'
    }

    return (
      <span className={`px-3 py-1 rounded-lg border text-sm font-semibold inline-flex items-center gap-1 ${colors[tier as keyof typeof colors]}`}>
        {icons[tier as keyof typeof icons]} {tier.toUpperCase()} ({score})
      </span>
    )
  }

  const toggleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeads(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)))
    }
  }

  const handleCreateCampaign = () => {
    const selectedLeadObjects = leads.filter(l => selectedLeads.has(l.id))
    onCreateCampaign(selectedLeadObjects)
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl p-8 border border-blue-500/30 backdrop-blur-sm shadow-2xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">⏳</div>
            <div className="text-blue-200 text-lg">Loading enriched leads...</div>
          </div>
        </div>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl p-8 border border-blue-500/30 backdrop-blur-sm shadow-2xl">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-blue-200 text-lg">No enriched leads yet</div>
          <div className="text-blue-300/60 text-sm mt-2">Start lead generation to see results here</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl p-8 border border-blue-500/30 backdrop-blur-sm shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="text-4xl">📊</span>
          Enriched Leads ({filteredLeads.length})
        </h2>
        <div className="flex gap-3">
          <button
            onClick={onDownloadCSV}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-green-500/30 hover:scale-105 flex items-center gap-2"
          >
            <span>📥</span>
            Download CSV
          </button>
          <button
            onClick={handleCreateCampaign}
            disabled={selectedLeads.size === 0}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 flex items-center gap-2"
          >
            <span>✉️</span>
            Create Campaign ({selectedLeads.size})
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-slate-800/40 p-4 rounded-lg border border-blue-500/20">
          <div className="text-blue-300/70 text-sm">Total Leads</div>
          <div className="text-white text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
          <div className="text-red-300/70 text-sm flex items-center gap-1">
            <span>🔴</span> Hot Leads
          </div>
          <div className="text-white text-2xl font-bold">{stats.hot}</div>
        </div>
        <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
          <div className="text-yellow-300/70 text-sm flex items-center gap-1">
            <span>🟡</span> Warm Leads
          </div>
          <div className="text-white text-2xl font-bold">{stats.warm}</div>
        </div>
        <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
          <div className="text-blue-300/70 text-sm flex items-center gap-1">
            <span>🔵</span> Cold Leads
          </div>
          <div className="text-white text-2xl font-bold">{stats.cold}</div>
        </div>
        <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
          <div className="text-green-300/70 text-sm">Avg Email Confidence</div>
          <div className="text-white text-2xl font-bold">{stats.avgConfidence}%</div>
        </div>
        <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/30">
          <div className="text-purple-300/70 text-sm">With Phone</div>
          <div className="text-white text-2xl font-bold">{stats.withPhonePercent}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Tier Filter */}
        <div className="flex gap-2">
          {(['all', 'hot', 'warm', 'cold'] as FilterTier[]).map((tierFilter) => (
            <button
              key={tierFilter}
              onClick={() => setFilter(tierFilter)}
              className={`
                px-4 py-2 rounded-lg font-semibold transition-all duration-200
                ${filter === tierFilter
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-800/40 text-blue-300 hover:bg-slate-700/40'
                }
              `}
            >
              {tierFilter === 'all' ? 'All Leads' : tierFilter === 'hot' ? '🔴 Hot' : tierFilter === 'warm' ? '🟡 Warm' : '🔵 Cold'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-blue-500/20">
        <table className="w-full">
          <thead className="bg-slate-800/60">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-blue-200 font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-blue-200 font-semibold">Title</th>
              <th className="px-4 py-3 text-left text-blue-200 font-semibold">Company</th>
              <th className="px-4 py-3 text-left text-blue-200 font-semibold">Email</th>
              <th className="px-4 py-3 text-left text-blue-200 font-semibold">Phone</th>
              <th className="px-4 py-3 text-left text-blue-200 font-semibold">ICP Score</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800/20 divide-y divide-slate-700/50">
            {filteredLeads.map((lead) => (
              <tr
                key={lead.id}
                className={`hover:bg-slate-700/30 transition-colors ${selectedLeads.has(lead.id) ? 'bg-blue-500/10' : ''}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedLeads.has(lead.id)}
                    onChange={() => toggleSelectLead(lead.id)}
                    className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="text-white font-semibold">{lead.name}</div>
                  <div className="text-blue-300/60 text-sm">{lead.city}</div>
                </td>
                <td className="px-4 py-3 text-blue-200">{lead.title || '-'}</td>
                <td className="px-4 py-3">
                  <div className="text-blue-200">{lead.company || '-'}</div>
                  <div className="text-blue-300/60 text-sm">{lead.industry || ''}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-blue-200">{lead.email}</div>
                  <div className="text-green-300/60 text-xs">✓ {lead.email_confidence}% confidence</div>
                </td>
                <td className="px-4 py-3 text-blue-200">{lead.phone || '-'}</td>
                <td className="px-4 py-3">{getScoreBadge(lead.icp_score, lead.tier)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-8 text-blue-300/60">
          No leads match the current filters
        </div>
      )}
    </div>
  )
}
