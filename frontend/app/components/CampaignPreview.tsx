'use client'

import { useState } from 'react'

export interface EmailScript {
  lead_id: string
  lead_name: string
  subject: string
  body: string
  personalization_factors: string[]
}

interface CampaignPreviewProps {
  scripts: EmailScript[]
  onSendTest: (testEmails: string[]) => void
  onPublish: () => void
  onEdit: (leadId: string, subject: string, body: string) => void
  isProcessing?: boolean
}

export default function CampaignPreview({
  scripts,
  onSendTest,
  onPublish,
  onEdit,
  isProcessing = false
}: CampaignPreviewProps) {
  const [selectedScriptIndex, setSelectedScriptIndex] = useState<number>(0)
  const [editMode, setEditMode] = useState<boolean>(false)
  const [editedSubject, setEditedSubject] = useState<string>('')
  const [editedBody, setEditedBody] = useState<string>('')
  const [testEmails, setTestEmails] = useState<string>('')

  if (scripts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl p-8 border border-blue-500/30 backdrop-blur-sm shadow-2xl">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✉️</div>
          <div className="text-blue-200 text-lg">No email scripts generated yet</div>
          <div className="text-blue-300/60 text-sm mt-2">Generate AI scripts from enriched leads first</div>
        </div>
      </div>
    )
  }

  const currentScript = scripts[selectedScriptIndex]

  const handleEditToggle = () => {
    if (editMode) {
      // Save changes
      onEdit(currentScript.lead_id, editedSubject, editedBody)
    } else {
      // Enter edit mode
      setEditedSubject(currentScript.subject)
      setEditedBody(currentScript.body)
    }
    setEditMode(!editMode)
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setEditedSubject('')
    setEditedBody('')
  }

  const handleSendTest = () => {
    const emails = testEmails.split(',').map(e => e.trim()).filter(e => e)
    if (emails.length > 0) {
      onSendTest(emails)
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl p-8 border border-blue-500/30 backdrop-blur-sm shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="text-4xl">✉️</span>
          Campaign Preview ({scripts.length} emails)
        </h2>
        <div className="flex gap-3">
          <button
            onClick={handleEditToggle}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
          >
            <span>{editMode ? '💾' : '✏️'}</span>
            {editMode ? 'Save Changes' : 'Edit'}
          </button>
          {editMode && (
            <button
              onClick={handleCancelEdit}
              disabled={isProcessing}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-semibold transition-all duration-200"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Script Selector */}
      <div className="mb-6">
        <label className="block text-blue-200 font-semibold mb-3 text-lg">
          Select Lead to Preview:
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-2 bg-slate-800/20 rounded-lg">
          {scripts.map((script, index) => (
            <button
              key={script.lead_id}
              onClick={() => {
                setSelectedScriptIndex(index)
                setEditMode(false)
              }}
              className={`
                px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-left
                ${selectedScriptIndex === index
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-800/40 text-blue-300 hover:bg-slate-700/40'
                }
              `}
            >
              <div className="truncate">{script.lead_name}</div>
              <div className="text-xs opacity-60">#{index + 1}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Email Preview */}
      <div className="bg-slate-800/40 rounded-lg p-6 border border-blue-500/20 mb-6">
        <div className="mb-4 pb-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-300/70 text-sm">To:</div>
            <div className="text-white font-semibold">{currentScript.lead_name}</div>
          </div>
          <div className="flex items-start justify-between">
            <div className="text-blue-300/70 text-sm">Subject:</div>
            {editMode ? (
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="flex-1 ml-4 bg-slate-700/50 border border-blue-500/30 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email subject..."
              />
            ) : (
              <div className="flex-1 ml-4 text-white font-semibold">{currentScript.subject}</div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-blue-300/70 text-sm mb-2">Message:</div>
          {editMode ? (
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={15}
              className="w-full bg-slate-700/50 border border-blue-500/30 rounded px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              placeholder="Email body..."
            />
          ) : (
            <div className="bg-slate-700/30 rounded px-4 py-3 text-blue-100 font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {currentScript.body}
            </div>
          )}
        </div>

        {/* Personalization Factors */}
        <div className="mb-4">
          <div className="text-blue-300/70 text-sm mb-2">Personalization Factors:</div>
          <div className="flex flex-wrap gap-2">
            {currentScript.personalization_factors.map((factor, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm border border-purple-500/30"
              >
                ✨ {factor}
              </span>
            ))}
          </div>
        </div>

        {/* Email Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/50">
          <div className="text-center">
            <div className="text-blue-300/70 text-xs">Subject Length</div>
            <div className="text-white font-bold text-lg">
              {editMode ? editedSubject.length : currentScript.subject.length} chars
            </div>
          </div>
          <div className="text-center">
            <div className="text-blue-300/70 text-xs">Body Length</div>
            <div className="text-white font-bold text-lg">
              {editMode ? editedBody.split(/\s+/).length : currentScript.body.split(/\s+/).length} words
            </div>
          </div>
          <div className="text-center">
            <div className="text-blue-300/70 text-xs">Estimated Read Time</div>
            <div className="text-white font-bold text-lg">
              {Math.ceil((editMode ? editedBody.split(/\s+/).length : currentScript.body.split(/\s+/).length) / 200)} min
            </div>
          </div>
        </div>
      </div>

      {/* Test Campaign Section */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
        <h3 className="text-yellow-300 font-bold text-xl mb-4 flex items-center gap-2">
          <span>🧪</span>
          Test Campaign First
        </h3>
        <div className="mb-4">
          <label className="block text-yellow-200 font-semibold mb-2">
            Test Email Addresses (comma-separated):
          </label>
          <input
            type="text"
            value={testEmails}
            onChange={(e) => setTestEmails(e.target.value)}
            placeholder="test1@example.com, test2@example.com"
            disabled={isProcessing}
            className="w-full bg-slate-800/50 border border-yellow-500/30 rounded-lg px-4 py-3 text-white placeholder-yellow-300/40 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
          />
          <p className="text-yellow-300/60 text-sm mt-2">
            Send test emails to 2-3 internal email addresses to verify deliverability and formatting
          </p>
        </div>
        <button
          onClick={handleSendTest}
          disabled={!testEmails.trim() || isProcessing}
          className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/30 hover:scale-105 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <span className="animate-spin">⏳</span>
              Sending Test...
            </>
          ) : (
            <>
              <span>🧪</span>
              Send Test Campaign
            </>
          )}
        </button>
      </div>

      {/* Publish Campaign Section */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
        <h3 className="text-green-300 font-bold text-xl mb-4 flex items-center gap-2">
          <span>🚀</span>
          Publish Production Campaign
        </h3>
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-green-200">
            <span className="text-green-400">✓</span>
            <span>All {scripts.length} email scripts are personalized</span>
          </div>
          <div className="flex items-center gap-2 text-green-200">
            <span className="text-green-400">✓</span>
            <span>Leads will be uploaded to MoEngage segment</span>
          </div>
          <div className="flex items-center gap-2 text-green-200">
            <span className="text-green-400">✓</span>
            <span>Campaign will be sent to production segment</span>
          </div>
          <div className="flex items-center gap-2 text-yellow-300">
            <span className="text-yellow-400">⚠️</span>
            <span>Please test campaign first before publishing to production</span>
          </div>
        </div>
        <button
          onClick={onPublish}
          disabled={isProcessing}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-green-500/30 hover:scale-105 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <span className="animate-spin">⏳</span>
              Publishing Campaign...
            </>
          ) : (
            <>
              <span>🚀</span>
              Publish to Production
            </>
          )}
        </button>
      </div>
    </div>
  )
}
