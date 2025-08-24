'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Target,
  Home,
  Zap,
  MapPin,
  Star,
  Clock,
  BarChart3,
} from 'lucide-react';

interface LeadStats {
  // Basic counts
  total: number;
  today: number;
  yesterday: number;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;

  // Status distribution
  byStatus: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
  };

  // Conversion metrics
  conversionRate: number;
  qualificationRate: number;

  // Financial metrics
  totalSavings: number;
  totalFiveYearSavings: number;
  averageSavings: number;
  medianSavings: number;

  // Property metrics
  averagePropertySize: number;
  averagePaybackPeriod: number;

  // Quality metrics
  highValueLeads: number;
  quickPaybackLeads: number;

  // Growth trends
  trends: {
    daily: number;
    weekly: number;
    monthly: number;
  };

  // Distributions
  heatingTypes: Record<string, number>;
  topCities: Array<{ city: string; count: number }>;
  sources: Record<string, number>;
  contactPreferences: Record<string, number>;
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

function DistributionCard({
  title,
  data,
  icon: Icon,
  total,
  color = 'blue',
}: {
  title: string;
  data: Record<string, number> | Array<{ city: string; count: number }>;
  icon: React.ElementType;
  total: number;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
  };

  // Convert data to consistent format
  const items = Array.isArray(data)
    ? data.map(item => ({ label: item.city, count: item.count }))
    : Object.entries(data).map(([label, count]) => ({ label, count }));

  // Sort by count and take top 5
  const topItems = items.sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-1 rounded-md ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-900">{title}</span>
      </div>

      <div className="space-y-3">
        {topItems.map((item, index) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 truncate">
                    {item.label || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {item.count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      color === 'blue'
                        ? 'bg-blue-500'
                        : color === 'green'
                          ? 'bg-green-500'
                          : color === 'purple'
                            ? 'bg-purple-500'
                            : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
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

function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat('fi-FI', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
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

      {/* Business Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Business Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversionRate.toFixed(1)}%`}
            subtitle={`${stats.byStatus.converted} converted`}
            icon={Target}
            color="green"
          />
          <StatCard
            title="Qualification Rate"
            value={`${stats.qualificationRate.toFixed(1)}%`}
            subtitle={`${stats.byStatus.qualified + stats.byStatus.converted} qualified+`}
            icon={Star}
            color="purple"
          />
          <StatCard
            title="Total Savings Potential"
            value={formatCurrency(stats.totalSavings)}
            subtitle="Annual across all leads"
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Avg. Payback Period"
            value={`${stats.averagePaybackPeriod.toFixed(1)} years`}
            subtitle="Heat pump investment"
            icon={Clock}
            color="blue"
          />
        </div>
      </div>

      {/* Lead Quality Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Lead Quality
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="High-Value Leads"
            value={stats.highValueLeads}
            subtitle="Above avg. savings"
            icon={Star}
            color="orange"
          />
          <StatCard
            title="Quick Payback"
            value={stats.quickPaybackLeads}
            subtitle="≤5 year payback"
            icon={Target}
            color="green"
          />
          <StatCard
            title="Avg. Property Size"
            value={`${formatNumber(stats.averagePropertySize)} m²`}
            subtitle="All properties"
            icon={Home}
            color="blue"
          />
          <StatCard
            title="Median Savings"
            value={formatCurrency(stats.medianSavings)}
            subtitle="Middle value"
            icon={DollarSign}
            color="purple"
          />
        </div>
      </div>

      {/* Lead Status Distribution */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Lead Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.byStatus.new}
              </div>
              <div className="text-sm text-gray-600">New</div>
              <Badge className="mt-2 bg-blue-100 text-blue-800">
                {stats.total > 0
                  ? ((stats.byStatus.new / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </Badge>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.byStatus.contacted}
              </div>
              <div className="text-sm text-gray-600">Contacted</div>
              <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                {stats.total > 0
                  ? ((stats.byStatus.contacted / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </Badge>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.byStatus.qualified}
              </div>
              <div className="text-sm text-gray-600">Qualified</div>
              <Badge className="mt-2 bg-green-100 text-green-800">
                {stats.total > 0
                  ? ((stats.byStatus.qualified / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </Badge>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.byStatus.converted}
              </div>
              <div className="text-sm text-gray-600">Converted</div>
              <Badge className="mt-2 bg-purple-100 text-purple-800">
                {stats.total > 0
                  ? ((stats.byStatus.converted / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* Distribution Analysis */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Distribution Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DistributionCard
            title="Top Cities"
            data={stats.topCities}
            icon={MapPin}
            total={stats.total}
            color="blue"
          />
          <DistributionCard
            title="Heating Types"
            data={stats.heatingTypes}
            icon={Zap}
            total={stats.total}
            color="orange"
          />
          <DistributionCard
            title="Contact Preferences"
            data={stats.contactPreferences}
            icon={Users}
            total={stats.total}
            color="green"
          />
        </div>
      </div>
    </div>
  );
}
