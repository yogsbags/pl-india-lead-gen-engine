import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface EnrichedLead {
  id: string
  name: string
  first_name: string
  last_name: string
  email: string
  title?: string
  company?: string
  industry?: string
  employee_count?: number
  city?: string
  seniority?: string
  icp_score?: number
  tier?: 'hot' | 'warm' | 'cold'
}

interface HistoricalData {
  best_subject?: string
  best_subject_open_rate?: number
  optimal_length?: number
  best_cta?: string
  avg_reply_rate?: number
  top_performing_themes?: string[]
}

interface GenerateScriptsRequest {
  leads: EnrichedLead[]
  segment: string
  tier?: 'hot' | 'warm' | 'cold'
  historicalData?: HistoricalData
}

interface EmailScript {
  lead_id: string
  lead_name: string
  subject: string
  body: string
  personalization_factors: string[]
}

/**
 * Gemini AI Script Generator API Route
 *
 * Generates personalized email scripts using Google Gemini 1.5 Pro
 * Optimizes based on historical campaign performance
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateScriptsRequest = await request.json()
    const { leads, segment, tier, historicalData } = body

    // Validate input
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'leads array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (!segment) {
      return NextResponse.json(
        { success: false, error: 'segment is required' },
        { status: 400 }
      )
    }

    // Call Gemini API
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    const scripts: EmailScript[] = []

    // Generate personalized script for each lead
    for (const lead of leads) {
      try {
        const prompt = buildPersonalizedPrompt(lead, segment, tier, historicalData)
        const result = await model.generateContent(prompt)
        const generatedText = result.response.text()

        // Parse generated text (expected format: Subject line followed by body)
        const lines = generatedText.split('\n').filter(line => line.trim())
        const subjectLine = lines[0]?.replace(/^(Subject:|SUBJECT:)\s*/i, '').trim() || 'Explore AQUA Fund Opportunity'
        const bodyLines = lines.slice(1)
        const body = bodyLines.join('\n\n').trim()

        // Extract personalization factors used
        const personalizationFactors: string[] = []
        if (lead.company) personalizationFactors.push('Company name')
        if (lead.title) personalizationFactors.push('Job title')
        if (lead.industry) personalizationFactors.push('Industry')
        if (lead.city) personalizationFactors.push('Location')
        if (lead.seniority) personalizationFactors.push('Seniority level')
        if (lead.icp_score) personalizationFactors.push('ICP score')

        scripts.push({
          lead_id: lead.id,
          lead_name: lead.name,
          subject: subjectLine,
          body,
          personalization_factors: personalizationFactors
        })

        // Rate limiting: Sleep 1 second between requests to avoid quota issues
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error: any) {
        console.error(`Gemini generation failed for ${lead.name}:`, error.message)
        // Fallback: Generate simple template-based script
        scripts.push(generateFallbackScript(lead, segment, tier))
      }
    }

    return NextResponse.json({
      success: true,
      segment,
      tier,
      scripts,
      count: scripts.length
    })

  } catch (error: any) {
    console.error('Gemini script generation error:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate scripts'
      },
      { status: 500 }
    )
  }
}

/**
 * Build personalized prompt for Gemini based on lead profile
 */
function buildPersonalizedPrompt(
  lead: EnrichedLead,
  segment: string,
  tier?: string,
  historicalData?: HistoricalData
): string {
  const tierLabel = tier || (lead.icp_score && lead.icp_score >= 80 ? 'Hot' : lead.icp_score && lead.icp_score >= 60 ? 'Warm' : 'Cold')

  let prompt = `You are an expert B2B email copywriter for PL Capital, an Indian Portfolio Management Services (PMS) firm.

Generate a highly personalized cold email for the following lead:

**Lead Profile:**
- Name: ${lead.name}
- Title: ${lead.title || 'Professional'}
- Company: ${lead.company || 'their organization'}
- Industry: ${lead.industry || 'N/A'}
- Company Size: ${lead.employee_count ? `${lead.employee_count} employees` : 'N/A'}
- Location: ${lead.city || 'India'}
- Seniority: ${lead.seniority || 'N/A'}
- ICP Score: ${lead.icp_score || 'N/A'} (${tierLabel} Lead)

**PL Capital's Value Proposition:**
- AQUA Fund: Quantitative investing strategy with 76% annualized returns (2019-2023)
- Data-driven edge: Proprietary quant models, zero human bias
- Minimum investment: ₹50 lakh
- SEBI-registered PMS

**Email Requirements:**
1. **Subject Line**: Personalized, curiosity-driven, max 50 characters (NO emojis, professional tone)
2. **Opening**: Reference their company, role, or industry to show relevance
3. **Value Proposition**: Highlight AQUA's 76% returns and quantitative edge in 1-2 sentences
4. **Credibility**: Mention SEBI registration, data-driven approach
5. **Call-to-Action**: Invite to a 15-minute discovery call (link: https://calendly.com/plcapital/discovery)
6. **Length**: 150-200 words (plain text only, NO HTML)
7. **Tone**: Professional, consultative, not salesy
8. **Compliance**: Include SEBI disclaimer at the end

**SEBI Disclaimer (MUST include at end):**
"Past performance does not guarantee future returns. Investments in PMS are subject to market risks. Minimum investment: ₹50 lakh."
`

  // Add tier-specific guidance
  if (tierLabel === 'Hot') {
    prompt += `\n**For Hot Leads (ICP Score ≥80):**
- Emphasize exclusive access and personalized strategy
- Use stronger, more direct CTA
- Mention willingness to do a custom portfolio analysis`
  } else if (tierLabel === 'Warm') {
    prompt += `\n**For Warm Leads (ICP Score 60-80):**
- Focus on education: explain quant investing benefits
- Softer CTA: "Explore if AQUA is right for you"
- Include a case study or success story reference`
  } else {
    prompt += `\n**For Cold Leads (ICP Score <60):**
- Lead with a question or industry insight
- Build curiosity before pitching
- Lower-pressure CTA: "Learn more about our approach"`
  }

  // Add historical optimization insights
  if (historicalData) {
    prompt += `\n\n**Optimize Based on Historical Performance:**`
    if (historicalData.best_subject) {
      prompt += `\n- Best-performing subject type: "${historicalData.best_subject}" (${historicalData.best_subject_open_rate}% open rate)`
    }
    if (historicalData.optimal_length) {
      prompt += `\n- Optimal email length: ~${historicalData.optimal_length} words`
    }
    if (historicalData.best_cta) {
      prompt += `\n- Best CTA: "${historicalData.best_cta}"`
    }
    if (historicalData.top_performing_themes) {
      prompt += `\n- Top themes: ${historicalData.top_performing_themes.join(', ')}`
    }
  }

  prompt += `\n\n**Output Format (strict):**
Line 1: Subject line (no "Subject:" prefix)
Line 2: <blank>
Lines 3+: Email body (plain text, no HTML)

Generate the email now:`

  return prompt
}

/**
 * Generate fallback script when Gemini fails (template-based)
 */
function generateFallbackScript(
  lead: EnrichedLead,
  segment: string,
  tier?: string
): EmailScript {
  const tierLabel = tier || 'warm'
  const firstName = lead.first_name || lead.name.split(' ')[0] || 'there'

  const subject = `${firstName}, quantitative investing with 76% returns`

  const body = `Hi ${firstName},

I noticed your role at ${lead.company || 'your organization'} and thought you might be interested in how data-driven investing is changing wealth management in India.

PL Capital's AQUA Fund uses proprietary quantitative models to deliver 76% annualized returns (2019-2023)—significantly outperforming traditional approaches.

Unlike discretionary PMS, our strategy eliminates human bias through pure data analysis. We're SEBI-registered with a minimum investment of ₹50 lakh.

Would you be open to a 15-minute call to explore if this approach aligns with your portfolio goals?

Book a time: https://calendly.com/plcapital/discovery

Best regards,
PL Capital Team

---
Past performance does not guarantee future returns. Investments in PMS are subject to market risks. Minimum investment: ₹50 lakh.`

  return {
    lead_id: lead.id,
    lead_name: lead.name,
    subject,
    body,
    personalization_factors: ['First name', 'Company name', 'Fallback template']
  }
}

