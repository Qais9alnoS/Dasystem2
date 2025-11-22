import React from 'react';
import { Sun, Moon, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type SessionFilter = 'morning' | 'evening' | 'both';
export type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface DashboardFilterBarProps {
  sessionFilter: SessionFilter;
  periodFilter: PeriodFilter;
  onSessionChange: (session: SessionFilter) => void;
  onPeriodChange: (period: PeriodFilter) => void;
  onRefresh?: () => void;
  lastUpdated?: Date;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  sessionFilter,
  periodFilter,
  onSessionChange,
  onPeriodChange,
  onRefresh,
  lastUpdated
}) => {
  const sessionOptions: { value: SessionFilter; label: string; icon: React.ReactNode }[] = [
    { value: 'morning', label: 'صباحي', icon: <Sun className="h-4 w-4" /> },
    { value: 'evening', label: 'مسائي', icon: <Moon className="h-4 w-4" /> },
    { value: 'both', label: 'كلاهما', icon: <BarChart3 className="h-4 w-4" /> }
  ];

  const periodOptions: { value: PeriodFilter; label: string }[] = [
    { value: 'daily', label: 'يومي' },
    { value: 'weekly', label: 'أسبوعي' },
    { value: 'monthly', label: 'شهري' },
    { value: 'yearly', label: 'سنوي' }
  ];

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg shadow-sm">
      {/* Session Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">الفترة:</span>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {sessionOptions.map((option) => (
            <Button
              key={option.value}
              variant={sessionFilter === option.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onSessionChange(option.value)}
              className="gap-1.5"
            >
              {option.icon}
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">الفترة الزمنية:</span>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {periodOptions.map((option) => (
            <Button
              key={option.value}
              variant={periodFilter === option.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onPeriodChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Refresh & Last Updated */}
      {onRefresh && (
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              آخر تحديث: {new Date(lastUpdated).toLocaleTimeString('ar-SY')}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={onRefresh}>
            تحديث
          </Button>
        </div>
      )}
    </div>
  );
};
