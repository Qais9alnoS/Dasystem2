import React from 'react';
import { Users, GraduationCap, School, Trophy, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatData {
  morning?: number;
  evening?: number;
  total: number;
}

interface QuickStatsGridProps {
  students: StatData;
  teachers: StatData;
  classes: StatData;
  activities: number;
  netProfit: number;
  attendanceRate: number;
  sessionFilter: 'morning' | 'evening' | 'both';
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'primary' | 'accent' | 'secondary' | 'success' | 'warning' | 'danger';
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, color, loading }) => {
  const colorClasses = {
    primary: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800',
    accent: 'from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800',
    secondary: 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800',
    success: 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800',
    warning: 'from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800',
    danger: 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'
  };

  const iconColorClasses = {
    primary: 'bg-blue-500 dark:bg-blue-600',
    accent: 'bg-amber-500 dark:bg-amber-600',
    secondary: 'bg-orange-500 dark:bg-orange-600',
    success: 'bg-green-500 dark:bg-green-600',
    warning: 'bg-yellow-500 dark:bg-yellow-600',
    danger: 'bg-red-500 dark:bg-red-600'
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-5 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden border bg-gradient-to-br ${colorClasses[color]} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
              {typeof value === 'number' ? value.toLocaleString('ar-SY') : value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconColorClasses[color]} text-white shadow-lg`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({
  students,
  teachers,
  classes,
  activities,
  netProfit,
  attendanceRate,
  sessionFilter,
  loading = false
}) => {
  const getDisplayValue = (data: StatData): string => {
    if (sessionFilter === 'morning') {
      return data.morning?.toLocaleString('ar-SY') || '0';
    } else if (sessionFilter === 'evening') {
      return data.evening?.toLocaleString('ar-SY') || '0';
    }
    return data.total.toLocaleString('ar-SY');
  };

  const getSubtitle = (data: StatData): string | undefined => {
    if (sessionFilter === 'both' && data.morning !== undefined && data.evening !== undefined) {
      return `صباحي: ${data.morning.toLocaleString('ar-SY')} | مسائي: ${data.evening.toLocaleString('ar-SY')}`;
    }
    return undefined;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <StatCard
        title="إجمالي الطلاب"
        value={getDisplayValue(students)}
        subtitle={getSubtitle(students)}
        icon={Users}
        color="primary"
        loading={loading}
      />
      <StatCard
        title="إجمالي المعلمين"
        value={getDisplayValue(teachers)}
        subtitle={getSubtitle(teachers)}
        icon={GraduationCap}
        color="accent"
        loading={loading}
      />
      <StatCard
        title="الصفوف"
        value={getDisplayValue(classes)}
        subtitle={getSubtitle(classes)}
        icon={School}
        color="secondary"
        loading={loading}
      />
      <StatCard
        title="الأنشطة"
        value={activities.toLocaleString('ar-SY')}
        icon={Trophy}
        color="warning"
        loading={loading}
      />
      <StatCard
        title="صافي الربح"
        value={`${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString('ar-SY')}`}
        subtitle="ل.س"
        icon={DollarSign}
        color={netProfit >= 0 ? 'success' : 'danger'}
        loading={loading}
      />
      <StatCard
        title="معدل الحضور"
        value={`${attendanceRate.toFixed(1)}%`}
        icon={Calendar}
        color={attendanceRate >= 90 ? 'success' : attendanceRate >= 75 ? 'warning' : 'danger'}
        loading={loading}
      />
    </div>
  );
};
