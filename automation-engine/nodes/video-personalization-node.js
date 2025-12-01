import WorkflowNode from './workflow-node.js';
import HeyGenClient from '../services/heygen-client.js';

export default class VideoPersonalizationNode extends WorkflowNode {
  async execute(input = []) {
    // Skip if HeyGen video is disabled (gracefully handle missing outreach config)
    if (!this.context.segment.outreach?.heygenVideo) {
      this.log('HeyGen video personalization disabled for segment');
      return input;
    }

    // Apply filter if configured (e.g., "signal_tier:Hot Signal AND icp_score:>=80")
    let filteredLeads = input;
    if (this.config.filter) {
      filteredLeads = this.applyComplexFilter(input, this.config.filter);
      this.log(`Filtered ${input.length} leads → ${filteredLeads.length} match filter: ${this.config.filter}`);
    } else {
      // Default: only hot leads
      filteredLeads = input.filter((lead) => lead.lead_tier === 'Hot');
    }

    if (!filteredLeads.length) {
      this.log('No leads qualified for HeyGen video');
      return input;
    }

    if (this.shouldSimulate() || !process.env.HEYGEN_API_KEY) {
      filteredLeads.forEach((lead) => {
        lead.video_asset = {
          provider: 'HeyGen',
          status: 'simulated',
          template: this.config.video_template || 'default',
          url: `https://videos.plcapital.ai/${lead.lead_id}.mp4`
        };
      });
      this.log('Generated simulated HeyGen videos', { count: filteredLeads.length });
      this.context.metrics.videos = filteredLeads.length;
      return input;
    }

    // Live HeyGen video generation
    return await this.generateRealVideos(filteredLeads, input);
  }

  async generateRealVideos(filteredLeads, allLeads) {
    const heygenClient = new HeyGenClient({
      apiKey: process.env.HEYGEN_API_KEY,
      simulate: false,
      logger: { log: (msg) => this.log(msg) }
    });

    this.log(`Generating ${filteredLeads.length} HeyGen personalized videos...`);

    for (const lead of filteredLeads) {
      try {
        // Generate personalized script
        const script = this.generatePersonalizedScript(lead);

        // HeyGen video configuration
        const videoConfig = {
          avatarId: process.env.HEYGEN_AVATAR_ID || 'Vanessa-inskirt-20220820',
          voiceId: process.env.HEYGEN_VOICE_ID || '1bd001e7e50f421d891986aad5158bc8', // Professional female voice
          scriptText: script,
          title: `PL Capital - ${lead.name}`,
          aspectRatio: '16:9',
          background: '#0f172a', // Dark blue background
          captionLanguage: 'en',
          testMode: false
        };

        this.log(`Requesting HeyGen video for ${lead.name}...`);

        const result = await heygenClient.generateVideo(videoConfig);

        lead.video_asset = {
          provider: 'HeyGen',
          videoId: result.videoId,
          status: result.status,
          url: result.downloadUrl,
          template: this.config.video_template || 'default',
          generatedAt: new Date().toISOString()
        };

        this.log(`✅ HeyGen video requested for ${lead.name} (ID: ${result.videoId})`);

        // Wait 2 seconds between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        this.error(`Failed to generate video for ${lead.name}: ${error.message}`);
        lead.video_asset = {
          provider: 'HeyGen',
          status: 'failed',
          error: error.message
        };
      }
    }

    this.context.metrics.videos = filteredLeads.length;
    this.log(`HeyGen video generation complete: ${filteredLeads.length} videos requested`);

    return allLeads;
  }

  generatePersonalizedScript(lead) {
    const name = lead.first_name || lead.name.split(' ')[0];
    const company = lead.company || 'your company';
    const title = lead.title || 'leader';

    return `Hi ${name}, this is a personalized message from PL Capital.

As a ${title} at ${company}, you understand the importance of strategic portfolio management.

PL Capital specializes in helping high net worth individuals like you achieve exceptional returns through our research-driven Portfolio Management Services.

Our factor-based investing approach has consistently delivered alpha, with our flagship fund outperforming benchmark indices by over 12% annually.

I'd love to share our latest market insights and discuss how we can help you achieve your financial goals.

Looking forward to connecting with you soon.`;
  }

  /**
   * Apply complex filter (supports AND, OR, comparison operators)
   * Example: "signal_tier:Hot Signal AND icp_score:>=80"
   */
  applyComplexFilter(leads, filter) {
    // For now, simple implementation supporting AND
    const conditions = filter.split(' AND ').map(c => c.trim());

    return leads.filter(lead => {
      return conditions.every(condition => {
        // Handle comparison operators (>=, <=, >, <, =)
        if (condition.includes('>=')) {
          const [field, value] = condition.split('>=').map(s => s.trim().replace(':', ''));
          return lead[field] >= parseFloat(value);
        } else if (condition.includes('<=')) {
          const [field, value] = condition.split('<=').map(s => s.trim().replace(':', ''));
          return lead[field] <= parseFloat(value);
        } else if (condition.includes('>')) {
          const [field, value] = condition.split('>').map(s => s.trim().replace(':', ''));
          return lead[field] > parseFloat(value);
        } else if (condition.includes('<')) {
          const [field, value] = condition.split('<').map(s => s.trim().replace(':', ''));
          return lead[field] < parseFloat(value);
        } else {
          // Simple equality check (field:value)
          const [field, value] = condition.split(':');
          return lead[field] === value;
        }
      });
    });
  }
}
