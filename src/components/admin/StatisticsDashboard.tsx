'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
} from 'lucide-react';

interface LeadStats {
  // Basic counts
  total: number;
  today: number;
  thisWeek: number;

  // Financial metrics
  averageSavings: number;

  // Growth trends
  trends: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

interface StatisticsDashboardProps {
  stats: LeadStats;
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function StatisticsDashboard({
  stats,
  className = '',
}: StatisticsDashboardProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Primary Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Leads"
            value={stats.total}
            subtitle="All time"
            icon={Users}
            trend={stats.trends.monthly}
            trendLabel="this month"
            color="blue"
          />
          <StatCard
            title="Today"
            value={stats.today}
            subtitle="New leads today"
            icon={Calendar}
            trend={stats.trends.daily}
            trendLabel="vs yesterday"
            color="green"
          />
          <StatCard
            title="This Week"
            value={stats.thisWeek}
            subtitle="New leads this week"
            icon={BarChart3}
            trend={stats.trends.weekly}
            trendLabel="vs last week"
            color="purple"
          />
          <StatCard
            title="Average Savings"
            value={formatCurrency(stats.averageSavings)}
            subtitle="Per lead annually"
            icon={DollarSign}
            color="orange"
          />
        </div>
      </div>
    </div>
  );
}
