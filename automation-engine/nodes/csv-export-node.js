import WorkflowNode from './workflow-node.js';
import fs from 'fs-extra';
import path from 'path';

/**
 * CSV Export Node
 *
 * Exports enriched leads to CSV format for easy import into CRMs,
 * email tools, or spreadsheet applications.
 *
 * Features:
 * - Exports to data/exports/{segment}_{timestamp}.csv
 * - Customizable column mapping
 * - Handles nested fields (e.g., phone_numbers[0].sanitized_number)
 * - UTF-8 encoding with BOM for Excel compatibility
 * - Optional header row
 */
export default class CsvExportNode extends WorkflowNode {
  async execute(input = []) {
    if (!input.length) {
      this.warn('No leads to export to CSV');
      return input;
    }

    const config = this.config || {};
    const includeHeader = config.includeHeader !== false; // Default: true
    const columns = config.columns || this.getDefaultColumns();
    const exportDir = path.join(this.context.settings.dataDir, 'exports');

    await fs.ensureDir(exportDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `${this.context.segment.id}_leads_${timestamp}.csv`;
    const filepath = path.join(exportDir, filename);

    this.log(`Exporting ${input.length} leads to CSV: ${filename}`);

    try {
      const csvContent = this.generateCsv(input, columns, includeHeader);

      // Write with UTF-8 BOM for Excel compatibility
      await fs.writeFile(filepath, '\uFEFF' + csvContent, 'utf8');

      this.log(`✅ CSV export successful: ${filepath}`, {
        leads: input.length,
        columns: columns.length,
        filepath
      });

      // Store filepath in context for summary report
      this.context.addArtifact('csv_exports', {
        filepath,
        filename,
        leads: input.length,
        timestamp: new Date().toISOString()
      });

      return input;
    } catch (error) {
      this.error('Failed to export CSV', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate CSV content from leads array
   */
  generateCsv(leads, columns, includeHeader) {
    const rows = [];

    // Add header row
    if (includeHeader) {
      const headers = columns.map(col => this.escapeCsvValue(col.label || col.field));
      rows.push(headers.join(','));
    }

    // Add data rows
    for (const lead of leads) {
      const values = columns.map(col => {
        const value = this.getFieldValue(lead, col.field);
        return this.escapeCsvValue(value);
      });
      rows.push(values.join(','));
    }

    return rows.join('\n');
  }

  /**
   * Get nested field value from object
   * Supports dot notation: "organization.name"
   * Supports array access: "phone_numbers[0].sanitized_number"
   */
  getFieldValue(obj, fieldPath) {
    if (!fieldPath) return '';

    const parts = fieldPath.split('.');
    let value = obj;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return '';
      }

      // Handle array access: field[0]
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        value = value[arrayName];
        if (Array.isArray(value)) {
          value = value[parseInt(index)];
        } else {
          return '';
        }
      } else {
        value = value[part];
      }
    }

    // Convert to string, handling null/undefined
    if (value === null || value === undefined) {
      return '';
    }

    // Handle arrays (join with semicolon)
    if (Array.isArray(value)) {
      return value.join('; ');
    }

    // Handle objects (JSON stringify)
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Escape value for CSV format
   * - Wrap in quotes if contains comma, quote, or newline
   * - Escape internal quotes by doubling them
   */
  escapeCsvValue(value) {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // Check if escaping needed
    if (stringValue.includes(',') ||
        stringValue.includes('"') ||
        stringValue.includes('\n') ||
        stringValue.includes('\r')) {
      // Escape quotes by doubling them
      const escaped = stringValue.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    return stringValue;
  }

  /**
   * Default column configuration for lead export
   */
  getDefaultColumns() {
    return [
      // Basic Info
      { field: 'first_name', label: 'First Name' },
      { field: 'last_name', label: 'Last Name' },
      { field: 'name', label: 'Full Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },

      // Professional Info
      { field: 'title', label: 'Job Title' },
      { field: 'company', label: 'Company' },
      { field: 'industry', label: 'Industry' },
      { field: 'seniority', label: 'Seniority' },

      // Location
      { field: 'city', label: 'City' },
      { field: 'state', label: 'State' },
      { field: 'country', label: 'Country' },

      // Social & Web
      { field: 'linkedin_url', label: 'LinkedIn URL' },
      { field: 'website', label: 'Website' },

      // Lead Scoring
      { field: 'lead_score', label: 'Lead Score' },
      { field: 'lead_tier', label: 'Lead Tier' },
      { field: 'lead_status', label: 'Lead Status' },

      // Enrichment Status
      { field: 'enrichment_status', label: 'Enrichment Status' },
      { field: 'data_quality_score', label: 'Data Quality' },

      // Metadata
      { field: 'source', label: 'Source' },
      { field: 'scraped_date', label: 'Scraped Date' },
      { field: 'enriched_date', label: 'Enriched Date' }
    ];
  }

  /**
   * Custom column configurations for different use cases
   */
  static getMinimalColumns() {
    return [
      { field: 'name', label: 'Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'company', label: 'Company' },
      { field: 'linkedin_url', label: 'LinkedIn' }
    ];
  }

  static getEmailOutreachColumns() {
    return [
      { field: 'first_name', label: 'First Name' },
      { field: 'email', label: 'Email' },
      { field: 'title', label: 'Job Title' },
      { field: 'company', label: 'Company' },
      { field: 'city', label: 'City' },
      { field: 'lead_score', label: 'Score' },
      { field: 'linkedin_url', label: 'LinkedIn' }
    ];
  }

  static getCrmImportColumns() {
    return [
      { field: 'first_name', label: 'First Name' },
      { field: 'last_name', label: 'Last Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'title', label: 'Title' },
      { field: 'company', label: 'Company' },
      { field: 'city', label: 'City' },
      { field: 'state', label: 'State' },
      { field: 'country', label: 'Country' },
      { field: 'linkedin_url', label: 'LinkedIn URL' },
      { field: 'website', label: 'Website' },
      { field: 'lead_score', label: 'Lead Score' },
      { field: 'lead_status', label: 'Status' },
      { field: 'source', label: 'Source' }
    ];
  }
}
