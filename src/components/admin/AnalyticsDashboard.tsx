'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MousePointer,
  Smartphone,
  Monitor,
  Tablet,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Eye,
  UserX,
  RefreshCw,
} from 'lucide-react';

// Types for analytics data
interface AnalyticsData {
  summary: {
    totalEvents: number;
    uniqueSessions: number;
    formCompletions: number;
    averageTimeOnSite: number;
    conversionRate: number;
    abandonmentRate: number;
  };
  deviceBreakdown: {
    mobile: { sessions: number; conversions: number; rate: number };
    tablet: { sessions: number; conversions: number; rate: number };
    desktop: { sessions: number; conversions: number; rate: number };
  };
  formFunnel: Array<{
    step: string;
    views: number;
    completions: number;
    errors: number;
    abandonments: number;
    completionRate: number;
  }>;
  recentActivity: Array<{
    timestamp: string;
    eventName: string;
    eventStep?: string;
    deviceType: string;
    sessionId: string;
    eventDetails: string;
  }>;
  trends: {
    daily: { date: string; events: number; conversions: number }[];
    hourly: { hour: number; events: number }[];
  };
}

interface AnalyticsDashboardProps {
  className?: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
    gray: 'text-gray-600 bg-gray-50',
  };

  const getTrendIcon = () => {
    if (trend === undefined) {
      return null;
    }
    return trend >= 0 ? (
      <TrendingUp className="w-3 h-3 text-green-500" />
    ) : (
      <TrendingDown className="w-3 h-3 text-red-500" />
    );
  };

  const getTrendColor = () => {
    if (trend === undefined) {
      return 'text-gray-500';
    }
    return trend >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`p-1 rounded-md ${colorClasses[color]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-gray-600">{title}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {subtitle && (
            <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
          )}
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 mt-2 text-xs ${getTrendColor()}`}
            >
              {getTrendIcon()}
              <span>
                {trend > 0 ? '+' : ''}
                {trend} {trendLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function DeviceCard({
  device,
  data,
}: {
  device: string;
  data: { sessions: number; conversions: number; rate: number };
}) {
  const getIcon = () => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      case 'desktop':
        return Monitor;
      default:
        return Monitor;
    }
  };

  const Icon = getIcon();

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900 capitalize">{device}</h4>
          <p className="text-sm text-gray-600">{data.sessions} sessions</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Conversions</span>
          <span className="font-medium">{data.conversions}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Conversion Rate</span>
          <Badge variant={data.rate > 5 ? 'default' : 'secondary'}>
            {data.rate.toFixed(1)}%
          </Badge>
        </div>
      </div>
    </Card>
  );
}

function FormFunnelCard({
  funnelData,
}: {
  funnelData: AnalyticsData['formFunnel'];
}) {
  return (
    <Card className="p-6">
      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Form Conversion Funnel
      </h4>
      <div className="space-y-4">
        {funnelData.map((step, index) => (
          <div key={step.step} className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <span className="font-medium text-gray-900 capitalize">
                  {step.step.replace('-', ' ')}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {step.completions}/{step.views}
                </div>
                <div className="text-xs text-gray-500">
                  {step.completionRate.toFixed(1)}% complete
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${step.completionRate}%` }}
              />
            </div>

            {/* Error and abandonment indicators */}
            <div className="flex justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {step.errors} errors
              </div>
              <div className="flex items-center gap-1">
                <UserX className="w-3 h-3" />
                {step.abandonments} abandoned
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecentActivityCard({
  activities,
}: {
  activities: AnalyticsData['recentActivity'];
}) {
  const getEventIcon = (eventName: string) => {
    switch (eventName) {
      case 'form_started':
        return MousePointer;
      case 'step_completed':
        return CheckCircle;
      case 'step_error':
        return AlertCircle;
      case 'form_submitted':
        return CheckCircle;
      case 'form_abandoned':
        return UserX;
      default:
        return Eye;
    }
  };

  const getEventColor = (eventName: string) => {
    switch (eventName) {
      case 'form_started':
        return 'text-blue-600';
      case 'step_completed':
        return 'text-green-600';
      case 'step_error':
        return 'text-red-600';
      case 'form_submitted':
        return 'text-purple-600';
      case 'form_abandoned':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="p-6">
      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Recent Activity (Last 24h)
      </h4>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.map((activity, index) => {
          const Icon = getEventIcon(activity.eventName);
          const colorClass = getEventColor(activity.eventName);

          return (
            <div
              key={index}
              className="flex items-start gap-3 p-2 rounded-lg bg-gray-50"
            >
              <div className={`p-1 rounded ${colorClass}`}>
                <Icon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {activity.eventName.replace('_', ' ')}
                  </span>
                  {activity.eventStep && (
                    <Badge variant="outline" className="text-xs">
                      {activity.eventStep}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {activity.deviceType}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {activity.eventDetails}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function AnalyticsDashboard({
  className = '',
}: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analytics-dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Analytics Dashboard
          </h3>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Analytics Dashboard
          </h3>
          <Button
            onClick={fetchAnalyticsData}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
        <Card className="p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h4 className="font-medium text-gray-900 mb-2">
              Failed to Load Analytics
            </h4>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Analytics Dashboard
        </h3>
        <Button
          onClick={fetchAnalyticsData}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={analyticsData.summary.totalEvents.toLocaleString()}
          subtitle="All tracked events"
          icon={Eye}
          color="blue"
        />
        <StatCard
          title="Unique Sessions"
          value={analyticsData.summary.uniqueSessions.toLocaleString()}
          subtitle="Distinct user sessions"
          icon={Users}
          color="green"
        />
        <StatCard
          title="Form Completions"
          value={analyticsData.summary.formCompletions}
          subtitle="Successful submissions"
          icon={CheckCircle}
          color="purple"
        />
        <StatCard
          title="Conversion Rate"
          value={`${analyticsData.summary.conversionRate.toFixed(1)}%`}
          subtitle="Sessions to conversions"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Device Breakdown */}
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Device Performance</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DeviceCard
            device="mobile"
            data={analyticsData.deviceBreakdown.mobile}
          />
          <DeviceCard
            device="tablet"
            data={analyticsData.deviceBreakdown.tablet}
          />
          <DeviceCard
            device="desktop"
            data={analyticsData.deviceBreakdown.desktop}
          />
        </div>
      </div>

      {/* Form Funnel and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FormFunnelCard funnelData={analyticsData.formFunnel} />
        <RecentActivityCard activities={analyticsData.recentActivity} />
      </div>

      {/* Performance Insights */}
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Performance Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            title="Avg. Time on Site"
            value={`${Math.round(analyticsData.summary.averageTimeOnSite / 1000)}s`}
            subtitle="Session duration"
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Abandonment Rate"
            value={`${analyticsData.summary.abandonmentRate.toFixed(1)}%`}
            subtitle="Users leaving mid-form"
            icon={UserX}
            color="red"
          />
        </div>
      </div>
    </div>
  );
}
