import { URL, URLSearchParams } from 'url';

/**
 * Minimal API client for HeyGen avatar endpoints.
 * Reference: https://docs.heygen.com/reference/video-generate
 */
export default class HeyGenClient {
  constructor({ apiKey, baseUrl = 'https://api.heygen.com/v1', simulate = false, logger = console } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.baseUrlV2 = 'https://api.heygen.com/v2';
    this.simulate = simulate || !apiKey;
    this.logger = logger;
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async ensureFetchAvailable() {
    if (typeof fetch === 'undefined') {
      throw new Error('Global fetch API is unavailable. Run on Node.js 18+ or provide a fetch polyfill.');
    }
  }

  buildHeaders() {
    if (!this.apiKey && !this.simulate) {
      throw new Error('HEYGEN_API_KEY missing. Set the key or enable simulate mode.');
    }
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }
    return headers;
  }

  buildPayloadV1({ avatarId, voiceId, scriptText, title, aspectRatio, background, webhookUrl, voiceStyle, speed, emotion, captionLanguage, testMode }) {
    const payload = {
      avatar_id: avatarId,
      voice_id: voiceId,
      input_text: scriptText,
      video_title: title,
      ratio: aspectRatio || '16:9'
    };

    if (background && typeof background === 'object') {
      payload.background = background;
    } else if (background) {
      payload.background = { type: 'color', value: background };
    }

    if (voiceStyle) {
      payload.voice_style = voiceStyle;
    }
    if (speed) {
      payload.speed = speed;
    }
    if (emotion) {
      payload.emotion = emotion;
    }
    if (captionLanguage) {
      payload.caption = { enabled: true, language: captionLanguage };
    }
    if (webhookUrl) {
      payload.webhook = { url: webhookUrl };
    }
    if (testMode) {
      payload.test = true;
    }

    return payload;
  }

  buildPayloadV2({ avatarId, voiceId, scriptText, title, aspectRatio, background, webhookUrl, voiceStyle, speed, emotion, captionLanguage, testMode }) {
    const dimension = this.mapAspectRatioToDimension(aspectRatio);

    const payload = {
      title,
      caption: Boolean(captionLanguage),
      caption_language: captionLanguage || undefined,
      callback_url: webhookUrl || undefined,
      test: testMode || undefined,
      dimension,
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: avatarId,
            scale: 1.0,
            offset: { x: 0, y: 0 }
          },
          voice: {
            type: 'text',
            voice_id: voiceId,
            input_text: scriptText
          },
          background: this.buildBackgroundPayload(background)
        }
      ]
    };

    if (voiceStyle || speed || emotion) {
      payload.video_inputs[0].voice.voice_tone = voiceStyle || undefined;
      payload.video_inputs[0].voice.speed = speed || undefined;
      payload.video_inputs[0].voice.emotion = emotion || undefined;
    }

    return JSON.parse(JSON.stringify(payload, (key, value) => value === undefined ? undefined : value));
  }

  buildBackgroundPayload(background) {
    if (!background) {
      return {
        type: 'color',
        value: '#f6f6fc'
      };
    }

    if (typeof background === 'string') {
      if (/^#?[0-9a-f]{6}$/i.test(background)) {
        const value = background.startsWith('#') ? background : `#${background}`;
        return { type: 'color', value };
      }
      return { type: 'image', url: background };
    }

    if (background.type) {
      return background;
    }

    return {
      type: 'color',
      value: '#f6f6fc'
    };
  }

  mapAspectRatioToDimension(aspectRatio) {
    const ratio = aspectRatio || '16:9';
    const presets = {
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      '1:1': { width: 1080, height: 1080 },
      '4:3': { width: 1440, height: 1080 },
      '3:4': { width: 1080, height: 1440 }
    };

    if (presets[ratio]) {
      return presets[ratio];
    }

    // fallback: parse e.g. 1280x720
    if (/^\d+x\d+$/i.test(ratio)) {
      const [width, height] = ratio.toLowerCase().split('x');
      return { width: Number(width), height: Number(height) };
    }

    return presets['16:9'];
  }

  extractVideoResponse(data, fallbackVideoId = null) {
    const wrapper = data?.data || data;
    const videoId = wrapper?.video_id || fallbackVideoId;
    const status = wrapper?.status || wrapper?.task_status || 'queued';
    const downloadUrl = wrapper?.video_url || wrapper?.download_url || null;
    if (!videoId) {
      throw new Error('HeyGen response missing video_id field');
    }
    return { videoId, status, downloadUrl, raw: data };
  }

  async generateVideo(options) {
    const {
      avatarId,
      voiceId,
      scriptText,
      title,
      aspectRatio,
      background,
      webhookUrl,
      voiceStyle,
      speed,
      emotion,
      captionLanguage,
      testMode
    } = options;

    if (!avatarId || !voiceId) {
      throw new Error('avatarId and voiceId are required for HeyGen video generation');
    }

    const payloadV2 = this.buildPayloadV2({
      avatarId,
      voiceId,
      scriptText,
      title,
      aspectRatio,
      background,
      webhookUrl,
      voiceStyle,
      speed,
      emotion,
      captionLanguage,
      testMode
    });

    const payloadV1 = this.buildPayloadV1({
      avatarId,
      voiceId,
      scriptText,
      title,
      aspectRatio,
      background,
      webhookUrl,
      voiceStyle,
      speed,
      emotion,
      captionLanguage,
      testMode
    });

    if (this.simulate) {
      const videoId = `sim-${Date.now()}`;
      this.logger.log(`🧪 HeyGen simulation: generated fake video ${videoId}`);
      return {
        videoId,
        status: 'simulated',
        downloadUrl: `https://videos.heygen-simulated.com/${videoId}.mp4`,
        payload: payloadV2,
        simulated: true
      };
    }

    await this.ensureFetchAvailable();

    const endpoints = [
      { url: `${this.baseUrlV2}/video/generate`, payload: payloadV2 },
      { url: `${this.baseUrl}/video/generate`, payload: payloadV1 },
      { url: `${this.baseUrl}/video.generate`, payload: payloadV1 }
    ];
    let lastErrorBody = '';
    let lastStatusCode = null;

    for (const { url, payload } of endpoints) {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        return this.extractVideoResponse(data);
      }

      lastStatusCode = response.status;
      lastErrorBody = await response.text().catch(() => '');

      // 404/405 likely means endpoint variation mismatch; try next option.
      // 400 might indicate new API field requirements; keep only if first attempt
      if (![400, 401, 404, 405].includes(response.status)) {
        break;
      }
      this.logger.log(`⚠️  HeyGen endpoint ${url} returned ${response.status}. Trying fallback...`);
    }

    throw new Error(`HeyGen video generation failed (${lastStatusCode ?? 'unknown'}): ${lastErrorBody}`);
  }

  async getVideoStatus(videoId) {
    if (!videoId) {
      throw new Error('videoId is required');
    }

    if (this.simulate) {
      return {
        videoId,
        status: 'completed',
        downloadUrl: `https://videos.heygen-simulated.com/${videoId}.mp4`,
        simulated: true
      };
    }

    await this.ensureFetchAvailable();

    const endpoints = [
      { value: `${this.baseUrlV2}/video/status`, method: 'GET', params: { video_id: videoId } },
      { value: `${this.baseUrl}/video/status`, method: 'GET', params: { video_id: videoId } },
      { value: `${this.baseUrl}/video.status`, method: 'GET', params: { video_id: videoId } },
      { value: `${this.baseUrl}/video_status.get`, method: 'GET', params: { video_id: videoId } }
    ];
    let lastErrorBody = '';
    let lastStatusCode = null;

    for (const endpoint of endpoints) {
      const requestUrl = new URL(endpoint.value);
      if (endpoint.params) {
        requestUrl.search = new URLSearchParams(endpoint.params).toString();
      }

      const response = await fetch(requestUrl, {
        method: endpoint.method,
        headers: this.buildHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return this.extractVideoResponse(data, videoId);
      }

      lastStatusCode = response.status;
      lastErrorBody = await response.text().catch(() => '');
      if (![404, 405].includes(response.status)) {
        break;
      }
      this.logger.log(`⚠️  HeyGen endpoint ${endpoint.value} returned ${response.status}. Trying fallback...`);
    }

    throw new Error(`HeyGen video status failed (${lastStatusCode ?? 'unknown'}): ${lastErrorBody}`);
  }

  async waitForCompletion(videoId, { intervalMs = 15000, timeoutMs = 900000 } = {}) {
    if (this.simulate) {
      return {
        videoId,
        status: 'completed',
        downloadUrl: `https://videos.heygen-simulated.com/${videoId}.mp4`,
        simulated: true
      };
    }

    const start = Date.now();
    let lastStatus = null;
    while (Date.now() - start < timeoutMs) {
      const status = await this.getVideoStatus(videoId);
      lastStatus = status;
      if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
        return status;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Timeout waiting for HeyGen video ${videoId} (last status: ${lastStatus?.status || 'unknown'})`);
  }
}
