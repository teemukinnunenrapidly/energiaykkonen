import { Lead } from './supabase';
import { flattenLeadData } from './lead-helpers';

/**
 * CSV Export utility for leads data
 */

export interface CSVExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: 'ISO' | 'Finnish';
}

/**
 * Escape CSV field values to handle special characters
 */
function escapeCSVField(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Format date for CSV export
 */
function formatDateForCSV(
  dateString: string,
  format: 'ISO' | 'Finnish' = 'Finnish'
): string {
  try {
    const date = new Date(dateString);

    if (format === 'Finnish') {
      return new Intl.DateTimeFormat('fi-FI', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }

    return date.toISOString();
  } catch {
    return dateString;
  }
}

/**
 * Format currency for CSV export
 */
function formatCurrencyForCSV(amount: number): string {
  return new Intl.NumberFormat('fi-FI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generate CSV headers
 */
function getCSVHeaders(): string[] {
  return [
    // Contact Information
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Street Address',
    'City',
    'Contact Preference',

    // Property Details
    'Square Meters',
    'Ceiling Height (m)',
    'Construction Year',
    'Floors',
    'Residents',
    'Hot Water Usage',

    // Current Heating
    'Heating Type',
    'Current Heating Cost (€)',
    'Current Energy Consumption (kWh)',

    // Heat Pump Calculations
    'Annual Energy Need (kWh)',
    'Heat Pump Consumption (kWh)',
    'Heat Pump Annual Cost (€)',
    'Annual Savings (€)',
    'Five Year Savings (€)',
    'Ten Year Savings (€)',
    'Payback Period (years)',
    'CO₂ Reduction (kg/year)',

    // Lead Management
    'Status',
    'Notes',
    'Message',

    // Metadata
    'Created At',
    'Updated At',
    'IP Address',
    'User Agent',
    'Source Page',
  ];
}

/**
 * Convert a lead object to CSV row data
 */
function leadToCSVRow(
  lead: Lead,
  dateFormat: 'ISO' | 'Finnish' = 'Finnish'
): string[] {
  // Flatten lead data to access JSONB fields
  const flatLead = flattenLeadData(lead);
  return [
    // Contact Information
    flatLead.first_name || '',
    flatLead.last_name || '',
    flatLead.sahkoposti || '',
    flatLead.puhelinnumero || '',
    flatLead.osoite || '',
    flatLead.paikkakunta || '',
    flatLead.valittutukimuoto || '',

    // Property Details
    flatLead.neliot?.toString() || '',
    flatLead.huonekorkeus?.toString() || '',
    flatLead.rakennusvuosi || '',
    flatLead.floors?.toString() || '',
    flatLead.henkilomaara?.toString() || '',
    flatLead.hot_water_usage || '',

    // Current Heating
    flatLead.lammitysmuoto || '',
    formatCurrencyForCSV(flatLead.vesikiertoinen || 0),
    flatLead.current_energy_consumption?.toLocaleString('fi-FI') || '',

    // Heat Pump Calculations
    flatLead.annual_energy_need?.toLocaleString('fi-FI') || '',
    flatLead.heat_pump_consumption?.toLocaleString('fi-FI') || '',
    formatCurrencyForCSV(flatLead.heat_pump_cost_annual || 0),
    formatCurrencyForCSV(flatLead.annual_savings || 0),
    formatCurrencyForCSV(flatLead.five_year_savings || 0),
    formatCurrencyForCSV(flatLead.ten_year_savings || 0),
    flatLead.payback_period?.toFixed(1) || '',
    flatLead.co2_reduction?.toLocaleString('fi-FI') || '',

    // Lead Management
    flatLead.status || '',
    flatLead.notes || '',
    flatLead.message || '',

    // Metadata
    formatDateForCSV(flatLead.created_at, dateFormat),
    formatDateForCSV(flatLead.updated_at, dateFormat),
    flatLead.ip_address || '',
    flatLead.user_agent || '',
    flatLead.source_page || '',
  ];
}

/**
 * Generate CSV content from leads data
 */
export function generateCSV(
  leads: Lead[],
  options: CSVExportOptions = {}
): string {
  const { includeHeaders = true, dateFormat = 'Finnish' } = options;

  const rows: string[] = [];

  // Add headers if requested
  if (includeHeaders) {
    const headers = getCSVHeaders();
    rows.push(headers.map(escapeCSVField).join(','));
  }

  // Add data rows
  leads.forEach(lead => {
    const rowData = leadToCSVRow(lead, dateFormat);
    rows.push(rowData.map(escapeCSVField).join(','));
  });

  return rows.join('\n');
}

/**
 * Generate filename for CSV export
 */
export function generateCSVFilename(
  totalLeads: number,
  filters?: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): string {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
  const baseFilename = `leads-export-${timestamp}`;

  const parts = [baseFilename];

  // Add filter info to filename
  if (filters?.search) {
    parts.push(`search-${filters.search.substring(0, 10)}`);
  }
  if (filters?.status) {
    parts.push(`status-${filters.status}`);
  }
  if (filters?.dateFrom || filters?.dateTo) {
    const from = filters.dateFrom ? filters.dateFrom.slice(0, 10) : 'any';
    const to = filters.dateTo ? filters.dateTo.slice(0, 10) : 'any';
    parts.push(`dates-${from}-to-${to}`);
  }

  parts.push(`(${totalLeads}-leads)`);

  return `${parts.join('-').replace(/[^a-zA-Z0-9\-()]/g, '')}.csv`;
}

/**
 * Download CSV file in the browser
 */
export function downloadCSV(csvContent: string, filename: string): void {
  try {
    // Create blob with BOM for proper Excel encoding
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading CSV:', error);
    throw new Error('Failed to download CSV file');
  }
}

/**
 * Export leads to CSV with full workflow
 */
export async function exportLeadsToCSV(
  leads: Lead[],
  options: CSVExportOptions & {
    filters?: {
      search?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    };
  } = {}
): Promise<void> {
  try {
    const { filters, ...csvOptions } = options;

    // Generate CSV content
    const csvContent = generateCSV(leads, csvOptions);

    // Generate filename
    const filename =
      csvOptions.filename || generateCSVFilename(leads.length, filters);

    // Download file
    downloadCSV(csvContent, filename);
  } catch (error) {
    console.error('CSV export failed:', error);
    throw error;
  }
}

/**
 * Get CSV export summary for user feedback
 */
export function getExportSummary(
  leads: Lead[],
  filters?: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): string {
  const totalLeads = leads.length;
  const filterSummary = [];

  if (filters?.search) {
    filterSummary.push(`search: "${filters.search}"`);
  }
  if (filters?.status) {
    filterSummary.push(`status: ${filters.status}`);
  }
  if (filters?.dateFrom || filters?.dateTo) {
    const dateRange = `${filters.dateFrom || '∞'} - ${filters.dateTo || '∞'}`;
    filterSummary.push(`dates: ${dateRange}`);
  }

  let summary = `Exporting ${totalLeads} lead${totalLeads !== 1 ? 's' : ''}`;

  if (filterSummary.length > 0) {
    summary += ` (filtered by ${filterSummary.join(', ')})`;
  }

  return summary;
}
