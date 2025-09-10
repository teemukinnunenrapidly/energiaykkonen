/**
 * Widget Form Submission Hook
 * Handles form data collection and submission for the widget
 */

import { useState, useCallback, useMemo } from 'react';
import { FormDataCollector, type SubmissionPayload, type WidgetFormData } from '../data/FormDataCollector';

export interface SubmissionState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  response: any | null;
}

export interface UseWidgetFormSubmissionProps {
  formData: Record<string, any>;
  sessionId: string;
  widgetId?: string;
  widgetMode?: 'shadow' | 'namespace';
  apiEndpoint?: string;
}

export interface UseWidgetFormSubmissionReturn {
  // Collected data
  collectedFormData: WidgetFormData;
  submissionPayload: SubmissionPayload;
  
  // Validation
  isFormValid: boolean;
  validationErrors: string[];
  requiredFieldsMissing: string[];
  
  // Submission state
  submissionState: SubmissionState;
  
  // Actions
  submitForm: () => Promise<boolean>;
  resetSubmission: () => void;
  
  // Debug info
  getDebugInfo: () => any;
}

export function useWidgetFormSubmission({
  formData,
  sessionId,
  widgetId,
  widgetMode = 'namespace',
  apiEndpoint
}: UseWidgetFormSubmissionProps): UseWidgetFormSubmissionReturn {
  
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    response: null
  });

  // Create form data collector
  const collector = useMemo(() => {
    return new FormDataCollector(formData, sessionId, widgetId, widgetMode);
  }, [formData, sessionId, widgetId, widgetMode]);

  // Collect form data
  const collectedFormData = useMemo(() => {
    return collector.collectFormData();
  }, [collector]);

  // Create submission payload
  const submissionPayload = useMemo(() => {
    return collector.createSubmissionPayload();
  }, [collector]);

  // Validate form
  const validation = useMemo(() => {
    return collector.validateForSubmission();
  }, [collector]);

  const submitForm = useCallback(async (): Promise<boolean> => {
    console.log('🚀 Widget Form Submission: Starting submission process');
    
    // Reset previous state
    setSubmissionState({
      isSubmitting: true,
      isSuccess: false,
      error: null,
      response: null
    });

    try {
      // Final validation before submission
      if (!validation.isValid) {
        throw new Error(`Form validation failed: ${validation.errors.join(', ')}`);
      }

      // Get endpoint URL
      const endpoint = getSubmissionEndpoint(apiEndpoint);
      if (!endpoint) {
        throw new Error('No submission endpoint configured');
      }

      console.log('📤 Widget Form Submission: Submitting to endpoint', {
        endpoint,
        payloadSize: JSON.stringify(submissionPayload).length,
        formDataFields: Object.keys(submissionPayload.formData).length
      });

      // Submit data
      const response = await submitToEndpoint(endpoint, submissionPayload);

      // Handle success
      setSubmissionState({
        isSubmitting: false,
        isSuccess: true,
        error: null,
        response
      });

      console.log('✅ Widget Form Submission: Submission successful', response);
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setSubmissionState({
        isSubmitting: false,
        isSuccess: false,
        error: errorMessage,
        response: null
      });

      console.error('❌ Widget Form Submission: Submission failed', {
        error: errorMessage,
        originalError: error
      });
      return false;
    }
  }, [validation, submissionPayload, apiEndpoint]);

  const resetSubmission = useCallback(() => {
    setSubmissionState({
      isSubmitting: false,
      isSuccess: false,
      error: null,
      response: null
    });
  }, []);

  const getDebugInfo = useCallback(() => {
    return {
      formDataSummary: collector.getFieldSummary(),
      submissionPayload,
      validation,
      submissionState,
      collector: {
        sessionId,
        widgetId,
        widgetMode
      }
    };
  }, [collector, submissionPayload, validation, submissionState, sessionId, widgetId, widgetMode]);

  return {
    collectedFormData,
    submissionPayload,
    isFormValid: validation.isValid,
    validationErrors: validation.errors,
    requiredFieldsMissing: validation.requiredFields,
    submissionState,
    submitForm,
    resetSubmission,
    getDebugInfo
  };
}

// Helper functions

function getSubmissionEndpoint(providedEndpoint?: string): string | null {
  // 1. Use provided endpoint
  if (providedEndpoint) {
    return providedEndpoint;
  }

  // 2. Try to get leadApiUrl from config.json (PRIMARY for Vercel API)
  if (typeof window !== 'undefined') {
    const widgetData = (window as any).__E1_WIDGET_DATA;
    if (widgetData?.settings?.leadApiUrl) {
      console.log('🎯 Using leadApiUrl from config.json:', widgetData.settings.leadApiUrl);
      return widgetData.settings.leadApiUrl;
    }
  }

  // 3. Try to get from widget config (WordPress integration)
  if (typeof window !== 'undefined') {
    const widgetConfig = (window as any).e1_widget_config;
    if (widgetConfig?.api_url) {
      console.log('🔗 Using api_url from WordPress config:', widgetConfig.api_url);
      return widgetConfig.api_url;
    }

    // 4. Try WordPress AJAX endpoint as fallback
    if (widgetConfig?.ajax_url) {
      console.log('📋 Falling back to WordPress AJAX:', widgetConfig.ajax_url);
      return widgetConfig.ajax_url;
    }
  }

  // 5. Try to get from data attribute (set by WordPress plugin)
  if (typeof document !== 'undefined') {
    const widgetContainer = document.querySelector('[id^="e1-calculator-widget"]');
    if (widgetContainer) {
      const apiUrl = widgetContainer.getAttribute('data-api-url');
      if (apiUrl) {
        console.log('📍 Using data-api-url attribute:', apiUrl);
        return apiUrl;
      }
    }
  }

  console.warn('⚠️ No submission endpoint found - checked leadApiUrl, widget config, and data attributes');
  return null;
}

async function submitToEndpoint(endpoint: string, payload: SubmissionPayload): Promise<any> {
  // Check if this is a WordPress AJAX endpoint
  if (endpoint.includes('admin-ajax.php')) {
    return submitToWordPress(endpoint, payload);
  } else {
    return submitToAPI(endpoint, payload);
  }
}

async function submitToWordPress(ajaxUrl: string, payload: SubmissionPayload): Promise<any> {
  // Get WordPress nonce
  const wpConfig = (window as any).e1_widget_config;
  if (!wpConfig?.nonce) {
    throw new Error('WordPress nonce not available');
  }

  const formData = new FormData();
  formData.append('action', 'e1_widget_submit_form');
  formData.append('nonce', wpConfig.nonce);
  formData.append('formData', JSON.stringify(payload.formData));
  formData.append('metadata', JSON.stringify({
    sessionId: payload.sessionId,
    source: payload.source,
    timestamp: payload.timestamp,
    widget_version: payload.widget_version,
    widget_mode: payload.widget_mode,
    widget_id: payload.widget_id,
    user_agent: payload.user_agent,
    referrer: payload.referrer
  }));

  const response = await fetch(ajaxUrl, {
    method: 'POST',
    credentials: 'same-origin',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`WordPress AJAX request failed: ${response.status}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.data?.message || 'WordPress submission failed');
  }

  return result.data;
}

async function submitToAPI(apiUrl: string, payload: SubmissionPayload): Promise<any> {
  console.log('📡 Submitting to Vercel API:', {
    endpoint: apiUrl,
    payloadSize: JSON.stringify(payload).length,
    formDataFields: Object.keys(payload.formData).length
  });

  // Convert widget payload to Next.js API format
  const nextjsPayload = {
    // Core form fields expected by Next.js API
    ...payload.formData,
    
    // Add session metadata
    sessionId: payload.sessionId,
    
    // Source tracking
    source: 'widget',
    widget_version: payload.widget_version,
    widget_mode: payload.widget_mode,
    timestamp: payload.timestamp
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Add origin header if available
        ...(typeof window !== 'undefined' && window.location.origin && {
          'Origin': window.location.origin
        })
      },
      // Include credentials for CORS if needed
      credentials: 'omit',
      body: JSON.stringify(nextjsPayload)
    });

    console.log('📥 API Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      
      try {
        const errorText = await response.text();
        if (errorText) {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorText;
        }
      } catch (parseError) {
        // Use original error if can't parse response
        console.warn('Could not parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    console.log('✅ API submission successful:', {
      leadId: result.leadId,
      calculations: result.calculations ? Object.keys(result.calculations) : 'none',
      emailResults: result.emailResults
    });

    return result;

  } catch (error) {
    // Enhanced error handling for different types of failures
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Could not reach the API. Please check your internet connection.');
    } else if (error instanceof Error && error.message.includes('CORS')) {
      throw new Error('CORS error: The widget is not allowed to submit to this API from this domain.');
    } else {
      throw error;
    }
  }
}