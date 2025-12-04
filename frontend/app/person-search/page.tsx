'use client'

import { useState } from 'react'

interface SearchResult {
  id: string
  name: string
  first_name: string
  last_name: string
  title: string
  company: string
  email?: string
  phone?: string
  linkedin_url?: string
  city?: string
  state?: string
  employee_count?: number
  industry?: string
  email_confidence?: number
}

export default function PersonSearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedPerson, setSelectedPerson] = useState<SearchResult | null>(null)
  const [enrichedData, setEnrichedData] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)

  // Stage 1: Search for person on Apollo
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a name to search')
      return
    }

    setIsSearching(true)
    setSearchResults([])
    setSelectedPerson(null)
    setEnrichedData(null)

    try {
      const response = await fetch('/api/apollo/search-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Search failed')
      }

      setSearchResults(data.people || [])
      setIsSearching(false)

    } catch (error: any) {
      console.error('Search error:', error)
      alert(`Search failed: ${error.message}`)
      setIsSearching(false)
    }
  }

  // Stage 2: Enrich selected person
  const handleEnrich = async (person: SearchResult) => {
    setIsEnriching(true)
    setSelectedPerson(person)
    setEnrichedData(null)

    try {
      const response = await fetch('/api/apollo/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: [person]
        })
      })

      const data = await response.json()
      if (!data.success || !data.leads || data.leads.length === 0) {
        throw new Error('No enriched data returned')
      }

      setEnrichedData(data.leads[0])
      setIsEnriching(false)

    } catch (error: any) {
      console.error('Enrichment error:', error)
      alert(`Enrichment failed: ${error.message}`)
      setIsEnriching(false)
    }
  }

  // Stage 3: Add to campaign
  const handleAddToCampaign = () => {
    if (!enrichedData) return

    // Store in localStorage for later retrieval in main lead-gen page
    const existingLeads = JSON.parse(localStorage.getItem('manual_leads') || '[]')
    existingLeads.push(enrichedData)
    localStorage.setItem('manual_leads', JSON.stringify(existingLeads))

    alert(`${enrichedData.name} added to manual leads pool!\n\nYou can now go to the main Lead Generation page and include this lead in your next campaign.`)
  }

  // Download enriched data as CSV
  const handleDownloadCSV = () => {
    if (!enrichedData) return

    const csv = [
      ['Name', 'Email', 'Phone', 'Title', 'Company', 'Industry', 'City', 'LinkedIn'].join(','),
      [
        `"${enrichedData.name}"`,
        enrichedData.email || '',
        enrichedData.phone || '',
        `"${enrichedData.title || ''}"`,
        `"${enrichedData.company || ''}"`,
        `"${enrichedData.industry || ''}"`,
        enrichedData.city || '',
        enrichedData.linkedin_url || ''
      ].join(',')
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enriched_${enrichedData.name.replace(/\s+/g, '_')}_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center gap-4">
            <span className="text-6xl">🔍</span>
            Person Search & Enrich
          </h1>
          <p className="text-purple-200 text-lg">
            Search for any person on Apollo → Get enriched contact data → Add to campaign or download
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Search by Name</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g., Rajesh Sharma CEO Mumbai"
              className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                isSearching
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white`}
            >
              {isSearching ? '🔄 Searching...' : '🔍 Search Apollo'}
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-2">
            💡 Tip: Include job title, company, or location for better results
          </p>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Search Results ({searchResults.length})
            </h2>
            <div className="space-y-3">
              {searchResults.map((person) => (
                <div
                  key={person.id}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-purple-500 transition-all cursor-pointer"
                  onClick={() => handleEnrich(person)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white">{person.name}</h3>
                      <p className="text-purple-300">{person.title}</p>
                      <p className="text-slate-400">{person.company}</p>
                      <p className="text-slate-500 text-sm">
                        {person.city}, {person.state}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEnrich(person)
                      }}
                      disabled={isEnriching && selectedPerson?.id === person.id}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
                    >
                      {isEnriching && selectedPerson?.id === person.id
                        ? '⏳ Enriching...'
                        : '💎 Enrich'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enriched Data Display */}
        {enrichedData && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500 mb-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">✅ Enriched Contact Data</h2>
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadCSV}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                >
                  📥 Download CSV
                </button>
                <button
                  onClick={handleAddToCampaign}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                >
                  ✉️ Add to Campaign
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 text-sm">Full Name</label>
                  <p className="text-white font-semibold text-lg">{enrichedData.name}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Job Title</label>
                  <p className="text-white">{enrichedData.title || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Email</label>
                  <p className="text-purple-300 font-mono">{enrichedData.email || 'N/A'}</p>
                  {enrichedData.email_confidence && (
                    <span className="text-green-400 text-xs">
                      ✅ {enrichedData.email_confidence}% confidence
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Phone</label>
                  <p className="text-white font-mono">{enrichedData.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">LinkedIn</label>
                  {enrichedData.linkedin_url ? (
                    <a
                      href={enrichedData.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline block truncate"
                    >
                      {enrichedData.linkedin_url}
                    </a>
                  ) : (
                    <p className="text-slate-400">N/A</p>
                  )}
                </div>
              </div>

              {/* Company Info */}
              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 text-sm">Company</label>
                  <p className="text-white font-semibold">{enrichedData.company || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Industry</label>
                  <p className="text-white">{enrichedData.industry || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Company Size</label>
                  <p className="text-white">
                    {enrichedData.employee_count
                      ? `${enrichedData.employee_count.toLocaleString()} employees`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Location</label>
                  <p className="text-white">
                    {[enrichedData.city, enrichedData.state, enrichedData.country]
                      .filter(Boolean)
                      .join(', ') || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !isSearching && (
          <div className="bg-slate-800/30 rounded-lg p-12 text-center border-2 border-dashed border-slate-600">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">Search for Anyone</h3>
            <p className="text-slate-400 mb-6">
              Find and enrich contact data for any person using Apollo's database
            </p>
            <div className="flex flex-col gap-2 text-left max-w-md mx-auto text-slate-300">
              <p>✓ Search by name, title, company, or location</p>
              <p>✓ Get verified email addresses (>80% confidence)</p>
              <p>✓ Enrich with phone numbers and LinkedIn profiles</p>
              <p>✓ Add to campaigns or download as CSV</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
