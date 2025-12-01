'use client'

interface OutreachCampaignsProps {
  data: {
    email?: {
      queued: number
      sent: number
      opened: number
      replied: number
      templates: string[]
    }
    linkedin?: {
      connectionsRequested: number
      connectionsAccepted: number
      messagesScheduled: number
    }
    video?: {
      generated: number
      hotLeads: number
      heygenJobId?: string
    }
    newsletter?: {
      subscribed: number
      campaign: string
    }
  }
  segment: string
}

export default function OutreachCampaigns({ data, segment }: OutreachCampaignsProps) {
  const getSegmentEmoji = (seg: string) => {
    const map: Record<string, string> = {
      partners: '🤝',
      hni: '💼',
      uhni: '👔',
      mass_affluent: '📈',
      'signals-hni': '🎯',
      'signals-uhni': '🎯',
      'signals-mass-affluent': '🎯',
      'signals-partners': '🎯',
    }
    return map[seg] || '📊'
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Email Campaign */}
      {data.email && (
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📧</span>
            <h4 className="text-white font-bold">Email Campaign</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{data.email.queued}</div>
              <div className="text-xs text-blue-200">Queued</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{data.email.sent}</div>
              <div className="text-xs text-green-200">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{data.email.opened}</div>
              <div className="text-xs text-yellow-200">Opened</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{data.email.replied}</div>
              <div className="text-xs text-purple-200">Replied</div>
            </div>
          </div>
          {data.email.templates && data.email.templates.length > 0 && (
            <div className="mt-3">
              <div className="text-sm text-blue-200 mb-1">Templates Used:</div>
              <div className="flex flex-wrap gap-2">
                {data.email.templates.map(template => (
                  <span
                    key={template}
                    className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded text-xs text-blue-300"
                  >
                    {template}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* LinkedIn Campaign */}
      {data.linkedin && (
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🔗</span>
            <h4 className="text-white font-bold">LinkedIn Outreach</h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{data.linkedin.connectionsRequested}</div>
              <div className="text-xs text-blue-200">Connections Requested</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{data.linkedin.connectionsAccepted}</div>
              <div className="text-xs text-green-200">Accepted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{data.linkedin.messagesScheduled}</div>
              <div className="text-xs text-purple-200">Messages Scheduled</div>
            </div>
          </div>
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
            <div className="text-sm text-yellow-300">
              ⚠️ LinkedIn automation is rate-limited to &lt;100 requests/week for compliance
            </div>
          </div>
        </div>
      )}

      {/* Video Personalization */}
      {data.video && data.video.generated > 0 && (
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🎥</span>
            <h4 className="text-white font-bold">Video Personalization (HeyGen)</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{data.video.hotLeads}</div>
              <div className="text-xs text-red-200">Hot Leads (Score ≥80)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{data.video.generated}</div>
              <div className="text-xs text-green-200">Videos Generated</div>
            </div>
          </div>
          {data.video.heygenJobId && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
              <div className="text-sm text-blue-300">
                HeyGen Job ID: <span className="font-mono">{data.video.heygenJobId}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Newsletter */}
      {data.newsletter && (
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📰</span>
            <h4 className="text-white font-bold">Newsletter Campaign</h4>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">{data.newsletter.subscribed}</div>
            <div className="text-sm text-blue-200">Subscribed to {data.newsletter.campaign}</div>
          </div>
          <div className="mt-3 p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
            <div className="text-sm text-green-300">
              ✓ Cold leads enrolled in nurture campaign: "The Quant Edge"
            </div>
          </div>
        </div>
      )}

      {/* Segment-Specific Strategy */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{getSegmentEmoji(segment)}</span>
          <h4 className="text-white font-bold">Segment Strategy</h4>
        </div>
        <div className="text-sm text-blue-200">
          {segment === 'partners' && (
            <>
              <strong>Partners:</strong> LinkedIn + Email with commission structure focus. Emphasize 80-year legacy and quant edge.
            </>
          )}
          {segment === 'hni' && (
            <>
              <strong>HNIs:</strong> Educational email sequences + personalized videos for hot leads. Focus on AQUA's 76% returns.
            </>
          )}
          {segment === 'uhni' && (
            <>
              <strong>UHNIs:</strong> Executive briefings + personal introductions. Require bespoke proposals and EA coordination.
            </>
          )}
          {segment === 'mass_affluent' && (
            <>
              <strong>Mass Affluent:</strong> Newsletter-first approach with automated sequences. Focus on financial education and quant frameworks.
            </>
          )}
          {segment.startsWith('signals-') && (
            <>
              <strong>Signal-Based:</strong> Intent-driven outreach with immediate follow-up. Leads showing active buying signals.
            </>
          )}
        </div>
      </div>

      {/* Compliance Note */}
      <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">⚖️</span>
          <h4 className="text-red-300 font-bold">Compliance Reminder</h4>
        </div>
        <div className="text-sm text-red-200 space-y-1">
          <div>• All performance claims include SEBI disclaimer</div>
          <div>• Unsubscribe links included in every email</div>
          <div>• LinkedIn rate limits enforced (&lt;100 requests/week)</div>
          <div>• Explicit consent required for WhatsApp messaging</div>
        </div>
      </div>
    </div>
  )
}
