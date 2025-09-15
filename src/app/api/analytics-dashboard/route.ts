/**
 * Analytics Dashboard API Route
 * Provides aggregated analytics data for the admin dashboard
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get time ranges for analysis
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch analytics summary
    const { data: summaryData, error: summaryError } = await supabase
      .from('analytics_daily_summary')
      .select('*')
      .gte('event_date', last7Days.toISOString().split('T')[0])
      .order('event_date', { ascending: false });

    if (summaryError) {
      throw summaryError;
    }

    // Fetch device breakdown
    const { data: deviceData, error: deviceError } = await supabase
      .from('analytics_device_breakdown')
      .select('*');

    if (deviceError) {
      throw deviceError;
    }

    // Fetch form funnel data
    const { data: funnelData, error: funnelError } = await supabase
      .from('analytics_form_funnel')
      .select('*')
      .order('event_step');

    if (funnelError) {
      throw funnelError;
    }

    // Fetch recent activity
    const { data: recentActivity, error: activityError } = await supabase
      .from('analytics_recent_activity')
      .select('*')
      .limit(50);

    if (activityError) {
      throw activityError;
    }

    // Calculate summary metrics
    const totalEvents =
      summaryData?.reduce((sum, day) => sum + (day.event_count || 0), 0) || 0;
    const uniqueSessions =
      summaryData?.reduce((sum, day) => sum + (day.unique_sessions || 0), 0) ||
      0;

    // Count form completions from recent events
    const formCompletions =
      summaryData
        ?.filter(day => day.event_name === 'form_submitted')
        ?.reduce((sum, day) => sum + (day.event_count || 0), 0) || 0;

    // Calculate conversion rate
    const formStarts =
      summaryData
        ?.filter(day => day.event_name === 'form_started')
        ?.reduce((sum, day) => sum + (day.event_count || 0), 0) || 0;

    const conversionRate =
      formStarts > 0 ? (formCompletions / formStarts) * 100 : 0;

    // Calculate abandonment rate
    const abandonments =
      summaryData
        ?.filter(day => day.event_name === 'form_abandoned')
        ?.reduce((sum, day) => sum + (day.event_count || 0), 0) || 0;

    const abandonmentRate =
      formStarts > 0 ? (abandonments / formStarts) * 100 : 0;

    // Process device breakdown
    const deviceBreakdown = {
      mobile: deviceData?.find(d => d.device_type === 'mobile') || {
        unique_sessions: 0,
        form_submissions: 0,
        conversion_rate: 0,
      },
      tablet: deviceData?.find(d => d.device_type === 'tablet') || {
        unique_sessions: 0,
        form_submissions: 0,
        conversion_rate: 0,
      },
      desktop: deviceData?.find(d => d.device_type === 'desktop') || {
        unique_sessions: 0,
        form_submissions: 0,
        conversion_rate: 0,
      },
    };

    // Format device data
    const formattedDeviceBreakdown = {
      mobile: {
        sessions: deviceBreakdown.mobile.unique_sessions || 0,
        conversions: deviceBreakdown.mobile.form_submissions || 0,
        rate: deviceBreakdown.mobile.conversion_rate || 0,
      },
      tablet: {
        sessions: deviceBreakdown.tablet.unique_sessions || 0,
        conversions: deviceBreakdown.tablet.form_submissions || 0,
        rate: deviceBreakdown.tablet.conversion_rate || 0,
      },
      desktop: {
        sessions: deviceBreakdown.desktop.unique_sessions || 0,
        conversions: deviceBreakdown.desktop.form_submissions || 0,
        rate: deviceBreakdown.desktop.conversion_rate || 0,
      },
    };

    // Format funnel data
    const formFunnel = (funnelData || []).map(step => ({
      step: step.event_step || 'unknown',
      views: step.step_views || 0,
      completions: step.step_completions || 0,
      errors: step.step_errors || 0,
      abandonments: step.step_abandonments || 0,
      completionRate: step.completion_rate || 0,
    }));

    // Format recent activity
    const formattedRecentActivity = (recentActivity || []).map(activity => ({
      timestamp: activity.timestamp || new Date().toISOString(),
      eventName: activity.event_name || 'unknown',
      eventStep: activity.event_step || undefined,
      deviceType: activity.device_type || 'unknown',
      sessionId: activity.session_id || 'unknown',
      eventDetails: activity.event_details || 'No details available',
    }));

    // Estimate average time on site (placeholder calculation)
    const averageTimeOnSite = 120000; // 2 minutes in milliseconds

    // Calculate daily trends
    const dailyTrends =
      summaryData
        ?.filter(day => day.event_date)
        ?.map(day => ({
          date: day.event_date,
          events: day.event_count || 0,
          conversions:
            day.event_name === 'form_submitted' ? day.event_count || 0 : 0,
        })) || [];

    const response = {
      summary: {
        totalEvents,
        uniqueSessions,
        formCompletions,
        averageTimeOnSite,
        conversionRate,
        abandonmentRate,
      },
      deviceBreakdown: formattedDeviceBreakdown,
      formFunnel,
      recentActivity: formattedRecentActivity,
      trends: {
        daily: dailyTrends,
        hourly: [], // Placeholder for hourly trends
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
