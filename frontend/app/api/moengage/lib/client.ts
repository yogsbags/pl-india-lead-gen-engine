// MoEngage Client for Frontend API routes
// Standalone version to avoid build dependency on automation-engine
// Buffer is available globally in Node.js runtime

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

class MoengageClient {
  workspaceId: string;
  dataApiKey: string;
  reportingApiKey: string;
  baseUrl: string;
  reportsBaseUrl: string;
  dataAuthHeader: string | null;

  constructor(options: {
    workspaceId: string;
    dataApiKey: string;
    reportingApiKey: string;
    baseUrl?: string;
    reportsBaseUrl?: string;
  }) {
    this.workspaceId = options.workspaceId;
    this.dataApiKey = options.dataApiKey;
    this.reportingApiKey = options.reportingApiKey;
    this.baseUrl = options.baseUrl || 'https://api-01.moengage.com';
    this.reportsBaseUrl = options.reportsBaseUrl || 'https://api-01.moengage.com';
    this.dataAuthHeader = this.workspaceId && this.dataApiKey
      ? `Basic ${Buffer.from(`${this.workspaceId}:${this.dataApiKey}`).toString('base64')}`
      : null;
  }

  _assertData() {
    if (!this.workspaceId || !this.dataApiKey) {
      throw new Error('MoEngage Data API credentials are missing (workspaceId/dataApiKey)');
    }
  }

  _assertReporting() {
    if (!this.reportingApiKey) {
      throw new Error('MoEngage reporting API key is missing');
    }
  }

  async _requestData(path: string, body: any, method: string = 'POST') {
    this._assertData();

    const response = await fetch(`${this.baseUrl}/v1${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.dataAuthHeader!
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MoEngage Data API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async _requestTemplateAPI(path: string, body: any = null, method: string = 'POST') {
    this._assertData();

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.dataAuthHeader!
      }
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}/v2${path}`, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MoEngage Email Template API error (${response.status}): ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return { success: true };
  }

  async _requestCampaignAPI(path: string, body: any = null, method: string = 'POST') {
    this._assertData();

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.dataAuthHeader!,
        'MOE-APPKEY': this.workspaceId
      }
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}/v2${path}`, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MoEngage Email Campaign API error (${response.status}): ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return { success: true };
  }

  async _requestReporting(path: string, init: RequestInit = {}) {
    this._assertReporting();

    const response = await fetch(`${this.reportsBaseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${this.reportingApiKey}`,
        'Content-Type': 'application/json',
        'MOE-APP-ID': this.workspaceId,
        ...(init.headers || {})
      },
      ...init
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MoEngage Reporting API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async track(payload: any) {
    const path = payload.type === 'customer' ? '/customers' : '/events';
    return this._requestData(path, payload);
  }

  // Email Template API Methods
  async createEmailTemplate(template: any) {
    return this._requestTemplateAPI('/email-templates', template);
  }

  async updateEmailTemplate(templateId: string, updates: any) {
    return this._requestTemplateAPI(`/email-templates/${templateId}`, updates, 'PUT');
  }

  async searchEmailTemplates(filters: any = {}) {
    const query = Object.keys(filters).length > 0
      ? `?${new URLSearchParams(filters).toString()}`
      : '';
    return this._requestTemplateAPI(`/email-templates${query}`, null, 'GET');
  }

  async listEmailTemplates() {
    return this._requestTemplateAPI('/email-templates', null, 'GET');
  }

  async getEmailTemplate(templateId: string) {
    return this._requestTemplateAPI(`/email-templates/${templateId}`, null, 'GET');
  }

  async deleteEmailTemplate(templateId: string) {
    return this._requestTemplateAPI(`/email-templates/${templateId}`, null, 'DELETE');
  }

  async getCampaignReport(campaignId: string) {
    return this._requestReporting(`/v1/campaigns/${campaignId}/report`);
  }

  async getBusinessEvents(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this._requestReporting(`/v1/business-events${query}`);
  }

  async getCustomTemplates() {
    return this._requestReporting('/v1/custom-templates');
  }

  async getCatalog(catalogId: string) {
    return this._requestReporting(`/v1/catalogs/${catalogId}`);
  }

  async getInformReport(reportId: string) {
    return this._requestReporting(`/v1/inform/reports/${reportId}`);
  }

  // Email Campaign API Methods
  async createEmailCampaign(campaign: any) {
    return this._requestCampaignAPI('/email-campaigns', campaign);
  }

  async updateEmailCampaign(campaignId: string, updates: any) {
    return this._requestCampaignAPI(`/email-campaigns/${campaignId}`, updates, 'PUT');
  }

  async getEmailCampaign(campaignId: string) {
    return this._requestCampaignAPI(`/email-campaigns/${campaignId}`, null, 'GET');
  }

  async testEmailCampaign(campaignId: string, testConfig: any) {
    return this._requestCampaignAPI(`/email-campaigns/${campaignId}/test`, testConfig);
  }

  async getCampaignMeta(campaignId: string) {
    return this._requestCampaignAPI(`/email-campaigns/${campaignId}/meta`, null, 'GET');
  }

  async listEmailCampaigns(filters: any = {}) {
    const query = Object.keys(filters).length > 0
      ? `?${new URLSearchParams(filters).toString()}`
      : '';
    return this._requestCampaignAPI(`/email-campaigns${query}`, null, 'GET');
  }

  // Segment API Methods
  async listSegments(filters: any = {}) {
    this._assertData();

    const query = Object.keys(filters).length > 0
      ? `?${new URLSearchParams(filters).toString()}`
      : '';

    const response = await fetch(`${this.baseUrl}/v3/custom-segments${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.dataAuthHeader!,
        'MOE-APPKEY': this.workspaceId
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MoEngage Segments API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async getSegmentByName(segmentName: string) {
    const encodedName = encodeURIComponent(segmentName);
    return this.listSegments({ name: encodedName });
  }

  async createSegment(segment: any) {
    this._assertData();

    const response = await fetch(`${this.baseUrl}/v3/custom-segments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.dataAuthHeader!,
        'MOE-APPKEY': this.workspaceId
      },
      body: JSON.stringify(segment)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MoEngage Create Segment API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async uploadUsersToSegment(segmentId: string, users: any[]) {
    this._assertData();

    const response = await fetch(`${this.baseUrl}/v1/custom-segments/${segmentId}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.dataAuthHeader!
      },
      body: JSON.stringify({ users })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MoEngage Upload Users API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async deleteSegment(segmentId: string) {
    this._assertData();

    const response = await fetch(`${this.baseUrl}/v3/custom-segments/${segmentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.dataAuthHeader!,
        'MOE-APPKEY': this.workspaceId
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MoEngage Delete Segment API error (${response.status}): ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return { success: true };
  }
}

export function getMoengageClient(settings: any = {}): MoengageClient {
  const workspaceId = settings.workspaceId || process.env.MOENGAGE_WORKSPACE_ID;
  const dataApiKey = settings.dataApiKey || process.env.MOENGAGE_DATA_API_KEY;
  const reportingApiKey = settings.reportingApiKey || process.env.MOENGAGE_REPORTING_API_KEY;

  if (!workspaceId || !dataApiKey || !reportingApiKey) {
    throw new Error('MoEngage env vars missing. Set MOENGAGE_WORKSPACE_ID, MOENGAGE_DATA_API_KEY, MOENGAGE_REPORTING_API_KEY.');
  }

  return new MoengageClient({
    workspaceId,
    dataApiKey,
    reportingApiKey,
    baseUrl: settings.baseUrl || process.env.MOENGAGE_BASE_URL,
    reportsBaseUrl: settings.reportsBaseUrl || process.env.MOENGAGE_REPORTS_BASE_URL
  });
}

export { MoengageClient };
