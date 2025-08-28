/**
 * Analytics API Route
 * Stores analytics events in Supabase for detailed tracking and analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { AnalyticsEventData } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const eventData: AnalyticsEventData = await request.json();

    // Validate required fields
    if (!eventData.event || !eventData.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: event, timestamp' },
        { status: 400 }
      );
    }

    // Get client IP for analytics (optional)
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded?.split(',')[0] || 'unknown';

    // Prepare analytics data for Supabase
    const analyticsRecord = {
      event_name: eventData.event,
      event_step: eventData.step || null,
      device_type: eventData.deviceType || 'unknown',
      source_page: eventData.source || null,
      current_page: eventData.page || null,
      session_id: eventData.sessionId || null,
      user_id: eventData.userId || null,
      event_value: eventData.value || null,
      error_message: eventData.error || null,
      metadata: eventData.metadata || {},
      ip_address: clientIp,
      user_agent: request.headers.get('user-agent') || null,
      timestamp: new Date(eventData.timestamp),
      created_at: new Date(),
    };

    // Insert into Supabase analytics table
    const { error: insertError } = await supabase
      .from('analytics')
      .insert([analyticsRecord]);

    if (insertError) {
      console.error('Supabase analytics insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to store analytics event' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Analytics event stored successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event = searchParams.get('event');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('analytics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    // Filter by event type if specified
    if (event) {
      query = query.eq('event_name', event);
    }

    // Filter by date range if specified
    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase analytics query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Analytics GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
