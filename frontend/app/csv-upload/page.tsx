'use client'

import { useState } from 'react'

interface CSVLead {
  name?: string
  first_name?: string
  last_name?: string
  email?: string
  company?: string
  title?: string
  phone?: string
  city?: string
  linkedin_url?: string
}

interface EnrichedLead extends CSVLead {
  id: string
  email_confidence?: number
  employee_count?: number
  industry?: string
  state?: string
  enrichment_status: 'pending' | 'success' | 'failed'
  enrichment_error?: string
}

export default function CSVUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedLeads, setParsedLeads] = useState<CSVLead[]>([])
  const [enrichedLeads, setEnrichedLeads] = useState<EnrichedLead[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichmentProgress, setEnrichmentProgress] = useState(0)

  // Parse CSV file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setIsUploading(true)
    setParsedLeads([])
    setEnrichedLeads([])

    try {
      const text = await uploadedFile.text()
      const lines = text.split('\n').filter(line => line.trim())

      if (lines.length < 2) {
        alert('CSV file must have at least 2 lines (header + data)')
        setIsUploading(false)
        return
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

      // Parse rows
      const leads: CSVLead[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const lead: CSVLead = {}

        headers.forEach((header, index) => {
          if (values[index]) {
            if (header.includes('name') && !header.includes('first') && !header.includes('last')) {
              lead.name = values[index]
            } else if (header.includes('first')) {
              lead.first_name = values[index]
            } else if (header.includes('last')) {
              lead.last_name = values[index]
            } else if (header.includes('email')) {
              lead.email = values[index]
            } else if (header.includes('company')) {
              lead.company = values[index]
            } else if (header.includes('title') || header.includes('job')) {
              lead.title = values[index]
            } else if (header.includes('phone')) {
              lead.phone = values[index]
            } else if (header.includes('city') || header.includes('location')) {
              lead.city = values[index]
            } else if (header.includes('linkedin')) {
              lead.linkedin_url = values[index]
            }
          }
        })

        // Derive first_name and last_name from name if not provided
        if (lead.name && (!lead.first_name || !lead.last_name)) {
          const nameParts = lead.name.split(' ')
          if (!lead.first_name) lead.first_name = nameParts[0]
          if (!lead.last_name) lead.last_name = nameParts.slice(1).join(' ') || nameParts[0]
        }

        // Only add if we have at least a name or email
        if (lead.name || lead.email || (lead.first_name && lead.last_name)) {
          leads.push(lead)
        }
      }

      setParsedLeads(leads)
      setIsUploading(false)

      alert(`✅ Parsed ${leads.length} leads from CSV.\n\nClick "Enrich Leads" to fetch verified emails and phone numbers.`)

    } catch (error: any) {
      console.error('CSV parsing error:', error)
      alert(`CSV parsing failed: ${error.message}`)
      setIsUploading(false)
    }
  }

  // Enrich all leads via Apollo API (BULK OPTIMIZED)
  const handleEnrichLeads = async () => {
    if (parsedLeads.length === 0) {
      alert('No leads to enrich')
      return
    }

    setIsEnriching(true)
    setEnrichmentProgress(0)

    try {
      // Send all leads in a single batch request for bulk enrichment
      const response = await fetch('/api/apollo/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: parsedLeads })
      })

      setEnrichmentProgress(50) // Halfway through processing

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Enrichment failed')
      }

      // Build enriched leads array with success/failure status
      const enrichedFromApi = data.leads || []
      const failedFromApi = new Set(data.failedLeads || [])

      const enriched: EnrichedLead[] = []

      // Match enriched leads back to original parsed leads
      for (let i = 0; i < parsedLeads.length; i++) {
        const originalLead = parsedLeads[i]
        const leadName = `${originalLead.first_name} ${originalLead.last_name}`

        // Find matching enriched lead
        const enrichedLead = enrichedFromApi.find(
          (e: any) =>
            e.first_name === originalLead.first_name &&
            e.last_name === originalLead.last_name
        )

        if (enrichedLead) {
          enriched.push({
            ...enrichedLead,
            enrichment_status: 'success'
          })
        } else {
          // Check if this lead was marked as failed
          const failureReason = Array.from(failedFromApi).find((f: any) =>
            f.includes(leadName)
          ) as string | undefined

          enriched.push({
            ...originalLead,
            id: `csv-${i}`,
            enrichment_status: 'failed',
            enrichment_error: failureReason || 'No match found'
          })
        }
      }

      setEnrichmentProgress(100)
      setEnrichedLeads(enriched)
      setIsEnriching(false)

      const successCount = enriched.filter(l => l.enrichment_status === 'success').length

      alert(
        `✅ Bulk enrichment complete!\n\n` +
        `${successCount}/${enriched.length} leads enriched successfully.\n\n` +
        `📊 Stats:\n` +
        `• Total: ${data.stats?.total || 0}\n` +
        `• With Email: ${data.stats?.with_email || 0}\n` +
        `• With Phone: ${data.stats?.with_phone || 0}\n` +
        `• Avg Confidence: ${data.stats?.avg_confidence || 0}%\n` +
        `• Bulk API: ${data.stats?.bulk_api_used ? 'Yes ⚡' : 'No'}`
      )

    } catch (error: any) {
      console.error('Bulk enrichment error:', error)
      setIsEnriching(false)
      alert(`❌ Bulk enrichment failed: ${error.message}\n\nPlease try again or contact support.`)
    }
  }

  // Download enriched leads as CSV
  const handleDownloadCSV = () => {
    if (enrichedLeads.length === 0) return

    const headers = ['Name', 'Email', 'Phone', 'Title', 'Company', 'Industry', 'City', 'LinkedIn', 'Email Confidence', 'Status']
    const rows = enrichedLeads.map(lead => [
      `"${lead.name || ''}"`,
      lead.email || '',
      lead.phone || '',
      `"${lead.title || ''}"`,
      `"${lead.company || ''}"`,
      `"${lead.industry || ''}"`,
      lead.city || '',
      lead.linkedin_url || '',
      lead.email_confidence || 0,
      lead.enrichment_status
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enriched_leads_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Add enriched leads to campaign
  const handleAddToCampaign = () => {
    const successLeads = enrichedLeads.filter(l => l.enrichment_status === 'success')
    if (successLeads.length === 0) {
      alert('No successfully enriched leads to add')
      return
    }

    // Store in localStorage for later retrieval in main lead-gen page
    const existingLeads = JSON.parse(localStorage.getItem('manual_leads') || '[]')
    existingLeads.push(...successLeads)
    localStorage.setItem('manual_leads', JSON.stringify(existingLeads))

    alert(`✅ ${successLeads.length} leads added to manual leads pool!\n\nYou can now go to the main Lead Generation page and include these leads in your next campaign.`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center gap-4">
            <span className="text-6xl">📊</span>
            CSV Lead Upload & Enrichment
          </h1>
          <p className="text-purple-200 text-lg">
            Upload CSV file → Enrich via Apollo → Download or add to campaign
          </p>
        </div>

        {/* Upload Box */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Step 1: Upload CSV File</h2>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
            />
            {file && (
              <span className="text-green-400">
                ✅ {file.name} ({parsedLeads.length} leads)
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-2">
            💡 CSV should have columns: name, email, company, title, phone, city, linkedin
          </p>
        </div>

        {/* Parsed Leads Preview */}
        {parsedLeads.length > 0 && enrichedLeads.length === 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">
                Step 2: Preview Parsed Leads ({parsedLeads.length})
              </h2>
              <button
                onClick={handleEnrichLeads}
                disabled={isEnriching}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  isEnriching
                    ? 'bg-slate-600 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white`}
              >
                {isEnriching ? `⏳ Enriching... ${enrichmentProgress}%` : '💎 Enrich Leads'}
              </button>
            </div>
            <div className="bg-slate-900/50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-300">#</th>
                    <th className="px-4 py-3 text-left text-slate-300">Name</th>
                    <th className="px-4 py-3 text-left text-slate-300">Email</th>
                    <th className="px-4 py-3 text-left text-slate-300">Company</th>
                    <th className="px-4 py-3 text-left text-slate-300">Title</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedLeads.slice(0, 10).map((lead, i) => (
                    <tr key={i} className="border-b border-slate-700">
                      <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3 text-white">{lead.name || `${lead.first_name} ${lead.last_name}`}</td>
                      <td className="px-4 py-3 text-purple-300">{lead.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-300">{lead.company || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-300">{lead.title || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedLeads.length > 10 && (
                <p className="text-center text-slate-400 py-3">
                  ... and {parsedLeads.length - 10} more leads
                </p>
              )}
            </div>
          </div>
        )}

        {/* Enriched Leads Table */}
        {enrichedLeads.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                ✅ Enriched Leads ({enrichedLeads.filter(l => l.enrichment_status === 'success').length}/{enrichedLeads.length})
              </h2>
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
                  ✉️ Add to Campaign ({enrichedLeads.filter(l => l.enrichment_status === 'success').length})
                </button>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-300">Status</th>
                      <th className="px-4 py-3 text-left text-slate-300">Name</th>
                      <th className="px-4 py-3 text-left text-slate-300">Email</th>
                      <th className="px-4 py-3 text-left text-slate-300">Confidence</th>
                      <th className="px-4 py-3 text-left text-slate-300">Phone</th>
                      <th className="px-4 py-3 text-left text-slate-300">Title</th>
                      <th className="px-4 py-3 text-left text-slate-300">Company</th>
                      <th className="px-4 py-3 text-left text-slate-300">Industry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedLeads.map((lead, i) => (
                      <tr key={i} className="border-b border-slate-700">
                        <td className="px-4 py-3">
                          {lead.enrichment_status === 'success' ? (
                            <span className="text-green-400">✅</span>
                          ) : (
                            <span className="text-red-400" title={lead.enrichment_error}>❌</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white">{lead.name}</td>
                        <td className="px-4 py-3 text-purple-300 font-mono text-sm">{lead.email || 'N/A'}</td>
                        <td className="px-4 py-3">
                          {lead.email_confidence ? (
                            <span className="text-green-400">{lead.email_confidence}%</span>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white font-mono text-sm">{lead.phone || 'N/A'}</td>
                        <td className="px-4 py-3 text-slate-300">{lead.title || 'N/A'}</td>
                        <td className="px-4 py-3 text-slate-300">{lead.company || 'N/A'}</td>
                        <td className="px-4 py-3 text-slate-300">{lead.industry || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {parsedLeads.length === 0 && !isUploading && (
          <div className="bg-slate-800/30 rounded-lg p-12 text-center border-2 border-dashed border-slate-600">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-white mb-2">Upload Your Lead List</h3>
            <p className="text-slate-400 mb-6">
              Upload a CSV file with your lead data to enrich via Apollo
            </p>
            <div className="flex flex-col gap-2 text-left max-w-md mx-auto text-slate-300">
              <p>✓ Upload CSV with name, email, company, title columns</p>
              <p>✓ Enrich each lead with verified email (>80% confidence)</p>
              <p>✓ Add phone numbers and LinkedIn profiles</p>
              <p>✓ Download enriched CSV or add to campaigns</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
