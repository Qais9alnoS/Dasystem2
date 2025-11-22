import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'accent' | 'secondary' | 'success' | 'warning' | 'danger';
  subtitle?: string;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  subtitle,
  loading = false
}) => {
  const colorClasses = {
    primary: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    accent: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    secondary: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800',
    success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
    danger: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
  };

  const iconColorClasses = {
    primary: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    accent: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
    secondary: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    danger: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={colorClasses[color]}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      +{trend.value}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {trend.value}%
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${iconColorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
