import React from 'react';
import { Users, GraduationCap, School, Trophy, DollarSign } from 'lucide-react';
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
  const iconColorClasses = {
    primary: 'text-primary',
    accent: 'text-accent',
    secondary: 'text-secondary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500'
  };

  if (loading) {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-5 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-muted rounded w-20"></div>
              <div className="h-7 bg-muted rounded w-16"></div>
              <div className="h-2 bg-muted rounded w-24"></div>
            </div>
            <div className="h-4 w-4 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-foreground">
            {title}
          </p>
          <Icon className={`h-4 w-4 ${iconColorClasses[color]}`} />
        </div>
        <div className="mt-2">
          <p className="text-3xl font-bold text-foreground">
            {typeof value === 'number' ? value.toLocaleString('ar-SY') : value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
    </div>
  );
};
