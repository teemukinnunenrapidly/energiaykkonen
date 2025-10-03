/**
 * Analytics Utility for Heat Pump Calculator
 * Provides unified interface for tracking events across Vercel Analytics and Supabase
 */

import { track } from '@vercel/analytics';
import { getSessionStorageSafe } from './safe-storage';

// Types for analytics events
export type AnalyticsEvent =
  | 'page_view'
  | 'form_started'
  | 'step_completed'
  | 'step_error'
  | 'form_submitted'
  | 'form_abandoned'
  | 'calculation_completed'
  | 'email_requested'
  | 'lead_converted'
  | 'admin_action'
  | 'error_occurred';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type FormStep =
  | 'basic-info'
  | 'property-details'
  | 'current-heating'
  | 'results';

export interface AnalyticsEventData {
  event: AnalyticsEvent;
  step?: FormStep;
  deviceType?: DeviceType;
  source?: string;
  page?: string;
  error?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp?: string;
  sessionId?: string;
  userId?: string;
}

/**
 * Detect device type based on screen size and user agent
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') {
    return 'desktop';
  }

  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();

  // Mobile detection
  if (
    width < 768 ||
    /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  ) {
    return 'mobile';
  }

  // Tablet detection
  if (width < 1024 || /tablet|ipad|kindle|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }

  return 'desktop';
}

/**
 * Generate a session ID for tracking user journeys
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  const ss = getSessionStorageSafe();
  let sessionId = ss.getItem('hpc_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    ss.setItem('hpc_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Get current page source for tracking
 */
export function getPageSource(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }
  return window.location.pathname + window.location.search;
}

/**
 * Main analytics tracking function
 */
export function trackEvent(eventData: Partial<AnalyticsEventData>): void {
  try {
    const enrichedData: AnalyticsEventData = {
      ...eventData,
      event: eventData.event || 'page_view',
      deviceType: eventData.deviceType || detectDeviceType(),
      source: eventData.source || getPageSource(),
      page:
        eventData.page ||
        (typeof window !== 'undefined' ? window.location.pathname : ''),
      timestamp: eventData.timestamp || new Date().toISOString(),
      sessionId: eventData.sessionId || getSessionId(),
    };

    // Send to Vercel Analytics (for high-level metrics)
    track(enrichedData.event, {
      ...(enrichedData.step && { step: enrichedData.step }),
      ...(enrichedData.deviceType && { device: enrichedData.deviceType }),
      ...(enrichedData.source && { source: enrichedData.source }),
      ...(enrichedData.page && { page: enrichedData.page }),
      ...(enrichedData.sessionId && { sessionId: enrichedData.sessionId }),
      ...enrichedData.metadata,
    } as Record<string, string | number | boolean | null>);

    // Log for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', enrichedData);
    }

    // Store detailed events in Supabase for deeper analysis
    if (shouldStoreInSupabase(enrichedData.event)) {
      storeAnalyticsEvent(enrichedData);
    }
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
}

/**
 * Determine if event should be stored in Supabase for detailed analysis
 */
function shouldStoreInSupabase(event: AnalyticsEvent): boolean {
  const supabaseEvents: AnalyticsEvent[] = [
    'form_started',
    'step_completed',
    'step_error',
    'form_submitted',
    'form_abandoned',
    'calculation_completed',
    'email_requested',
    'lead_converted',
    'error_occurred',
  ];

  return supabaseEvents.includes(event);
}

/**
 * Store analytics event in Supabase for detailed tracking
 */
async function storeAnalyticsEvent(
  eventData: AnalyticsEventData
): Promise<void> {
  try {
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      console.warn('Failed to store analytics event:', response.statusText);
    }
  } catch (error) {
    console.warn('Failed to store analytics event in Supabase:', error);
  }
}

// Convenient wrapper functions for common events

export function trackPageView(page?: string): void {
  trackEvent({
    event: 'page_view',
    page:
      page || (typeof window !== 'undefined' ? window.location.pathname : ''),
  });
}

export function trackFormStart(step: FormStep): void {
  trackEvent({
    event: 'form_started',
    step,
  });
}

export function trackStepCompleted(
  step: FormStep,
  metadata?: Record<string, any>
): void {
  trackEvent({
    event: 'step_completed',
    step,
    metadata,
  });
}

export function trackStepError(step: FormStep, error: string): void {
  trackEvent({
    event: 'step_error',
    step,
    error,
  });
}

export function trackFormSubmitted(metadata?: Record<string, any>): void {
  trackEvent({
    event: 'form_submitted',
    metadata,
  });
}

export function trackFormAbandoned(step: FormStep, timeSpent?: number): void {
  trackEvent({
    event: 'form_abandoned',
    step,
    value: timeSpent,
  });
}

export function trackCalculationCompleted(
  calculationData: Record<string, any>
): void {
  trackEvent({
    event: 'calculation_completed',
    metadata: calculationData,
  });
}

export function trackEmailRequested(leadId?: string): void {
  trackEvent({
    event: 'email_requested',
    userId: leadId,
  });
}

export function trackLeadConverted(
  leadId: string,
  metadata?: Record<string, any>
): void {
  trackEvent({
    event: 'lead_converted',
    userId: leadId,
    metadata,
  });
}

export function trackError(error: string, context?: string): void {
  trackEvent({
    event: 'error_occurred',
    error,
    metadata: { context },
  });
}

// Hook for tracking form step progression
export function useFormAnalytics(currentStep: FormStep) {
  const stepStartTime = Date.now();

  const trackStepStart = () => {
    trackEvent({
      event: 'step_completed',
      step: currentStep,
    });
  };

  const trackStepExit = () => {
    const timeSpent = Date.now() - stepStartTime;
    if (timeSpent > 30000) {
      // Only track if spent more than 30 seconds
      trackFormAbandoned(currentStep, timeSpent);
    }
  };

  return {
    trackStepStart,
    trackStepExit,
    trackStepError: (error: string) => trackStepError(currentStep, error),
    trackStepCompleted: (metadata?: Record<string, any>) =>
      trackStepCompleted(currentStep, metadata),
  };
}

// Analytics configuration
export const ANALYTICS_CONFIG = {
  // Events that trigger immediate Supabase storage
  CRITICAL_EVENTS: ['form_submitted', 'lead_converted', 'error_occurred'],

  // Minimum time on page before tracking abandonment
  ABANDONMENT_THRESHOLD: 30000, // 30 seconds

  // Sampling rate for non-critical events (to reduce noise)
  SAMPLING_RATE: 1.0, // 100% for now, can be reduced in production
};
