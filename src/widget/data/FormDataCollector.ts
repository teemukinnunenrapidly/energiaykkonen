/**
 * Widget Form Data Collector
 * Collects all user input from cards and prepares it for submission
 */

export interface WidgetFormData {
  // Property Information
  neliot?: number;
  huonekorkeus?: number;
  rakennusvuosi?: string;
  floors?: number;
  henkilomaara?: number;
  
  // Current Heating System
  lammitysmuoto?: string;
  vesikiertoinen?: number;
  current_energy_consumption?: number;
  
  // Contact Information
  nimi?: string;
  sahkoposti?: string;
  puhelinnumero?: string;
  osoite?: string;
  paikkakunta?: string;
  
  // Additional fields (dynamic)
  [key: string]: any;
}

export interface SubmissionPayload {
  // Form data from all cards
  formData: WidgetFormData;
  
  // Metadata
  sessionId: string;
  source: 'widget';
  timestamp: string;
  widget_version: string;
  
  // Widget-specific info
  widget_id?: string;
  widget_mode: 'shadow' | 'namespace';
  
  // Tracking
  user_agent?: string;
  referrer?: string;
}

export class FormDataCollector {
  private formData: Record<string, any>;
  private sessionId: string;
  private widgetId?: string;
  private widgetMode: 'shadow' | 'namespace';

  constructor(
    formData: Record<string, any>, 
    sessionId: string, 
    widgetId?: string,
    widgetMode: 'shadow' | 'namespace' = 'namespace'
  ) {
    this.formData = { ...formData }; // Make a copy to avoid mutations
    this.sessionId = sessionId;
    this.widgetId = widgetId;
    this.widgetMode = widgetMode;
  }

  /**
   * Collect all form data from cards
   */
  public collectFormData(): WidgetFormData {
    console.log('📋 FormDataCollector: Collecting form data from all cards', {
      availableFields: Object.keys(this.formData),
      totalFields: Object.keys(this.formData).length
    });

    // Filter out empty, null, or undefined values
    const cleanedData: WidgetFormData = {};
    
    Object.entries(this.formData).forEach(([key, value]) => {
      if (this.isValidValue(value)) {
        // Convert string numbers to actual numbers where appropriate
        cleanedData[key] = this.convertValue(key, value);
      }
    });

    console.log('✅ FormDataCollector: Cleaned form data collected', {
      cleanedFields: Object.keys(cleanedData),
      cleanedCount: Object.keys(cleanedData).length,
      data: cleanedData
    });

    return cleanedData;
  }

  /**
   * Create complete submission payload
   */
  public createSubmissionPayload(): SubmissionPayload {
    const formData = this.collectFormData();
    
    const payload: SubmissionPayload = {
      formData,
      sessionId: this.sessionId,
      source: 'widget' as const,
      timestamp: new Date().toISOString(),
      widget_version: this.getWidgetVersion(),
      widget_mode: this.widgetMode,
      
      // Optional fields
      ...(this.widgetId && { widget_id: this.widgetId }),
      
      // Browser metadata
      user_agent: this.getUserAgent(),
      referrer: this.getReferrer()
    };

    console.log('📦 FormDataCollector: Created submission payload', {
      formDataFields: Object.keys(payload.formData).length,
      payloadSize: JSON.stringify(payload).length,
      sessionId: payload.sessionId
    });

    return payload;
  }

  /**
   * Validate form data for submission
   */
  public validateForSubmission(): { 
    isValid: boolean; 
    errors: string[]; 
    requiredFields: string[]; 
  } {
    const errors: string[] = [];
    const requiredFields: string[] = [];
    
    // Define required fields for submission
    const REQUIRED_FIELDS = ['neliot', 'sahkoposti'];
    const formData = this.collectFormData();

    REQUIRED_FIELDS.forEach(field => {
      if (!formData[field] || formData[field] === '') {
        requiredFields.push(field);
        errors.push(`Field '${field}' is required for submission`);
      }
    });

    // Additional validation
    if (formData.sahkoposti && !this.isValidEmail(formData.sahkoposti as string)) {
      errors.push('Invalid email format');
    }

    if (formData.neliot && (typeof formData.neliot !== 'number' || formData.neliot <= 0)) {
      errors.push('Square meters must be a positive number');
    }

    const isValid = errors.length === 0;

    console.log('🔍 FormDataCollector: Validation result', {
      isValid,
      errorCount: errors.length,
      errors,
      requiredFieldsMissing: requiredFields
    });

    return { isValid, errors, requiredFields };
  }

  /**
   * Get field summary for debugging
   */
  public getFieldSummary(): Record<string, any> {
    const formData = this.collectFormData();
    
    return {
      totalFields: Object.keys(formData).length,
      fieldsByType: this.categorizeFields(formData),
      emptyFields: this.getEmptyFields(),
      validationStatus: this.validateForSubmission()
    };
  }

  // Private helper methods

  private isValidValue(value: any): boolean {
    return value !== null && 
           value !== undefined && 
           value !== '' && 
           !(Array.isArray(value) && value.length === 0);
  }

  private convertValue(key: string, value: any): any {
    // Convert string numbers to numbers for specific fields
    const numericFields = ['neliot', 'huonekorkeus', 'henkilomaara', 'vesikiertoinen', 'floors'];
    
    if (numericFields.includes(key) && typeof value === 'string') {
      const numValue = parseFloat(value);
      return !isNaN(numValue) ? numValue : value;
    }
    
    return value;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  }

  private getReferrer(): string {
    return typeof document !== 'undefined' ? document.referrer : '';
  }

  private getWidgetVersion(): string {
    // Try to get version from global widget config
    if (typeof window !== 'undefined') {
      const widgetData = (window as any).__E1_WIDGET_DATA;
      if (widgetData?.version) {
        return widgetData.version;
      }
    }
    return 'unknown';
  }

  private categorizeFields(data: WidgetFormData): Record<string, string[]> {
    const categories = {
      property: ['neliot', 'huonekorkeus', 'rakennusvuosi', 'floors', 'henkilomaara'],
      heating: ['lammitysmuoto', 'vesikiertoinen', 'current_energy_consumption'],
      contact: ['nimi', 'sahkoposti', 'puhelinnumero', 'osoite', 'paikkakunta'],
      other: [] as string[]
    };

    Object.keys(data).forEach(key => {
      let categorized = false;
      for (const [categoryName, fields] of Object.entries(categories)) {
        if (fields.includes(key)) {
          categorized = true;
          break;
        }
      }
      if (!categorized) {
        categories.other.push(key);
      }
    });

    return categories;
  }

  private getEmptyFields(): string[] {
    return Object.entries(this.formData)
      .filter(([_, value]) => !this.isValidValue(value))
      .map(([key, _]) => key);
  }
}

/**
 * Helper function to create form data collector from widget state
 */
export function createFormDataCollector(
  formData: Record<string, any>,
  sessionId: string,
  widgetId?: string,
  widgetMode: 'shadow' | 'namespace' = 'namespace'
): FormDataCollector {
  return new FormDataCollector(formData, sessionId, widgetId, widgetMode);
}

/**
 * Quick collection function for immediate use
 */
export function collectWidgetFormData(
  formData: Record<string, any>
): WidgetFormData {
  const collector = new FormDataCollector(formData, 'temp-session');
  return collector.collectFormData();
}