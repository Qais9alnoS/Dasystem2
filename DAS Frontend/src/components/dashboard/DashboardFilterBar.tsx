import React, { useRef, useState, useEffect } from 'react';
import { Sun, Moon, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SessionFilter = 'morning' | 'evening' | 'both';
export type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface DashboardFilterBarProps {
  sessionFilter: SessionFilter;
  periodFilter: PeriodFilter;
  onSessionChange: (session: SessionFilter) => void;
  onPeriodChange: (period: PeriodFilter) => void;
  onRefresh?: () => void;
  lastUpdated?: Date;
  sessionFilterDisabled?: boolean;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  sessionFilter,
  periodFilter: _periodFilter,
  onSessionChange,
  onPeriodChange: _onPeriodChange,
  onRefresh,
  lastUpdated,
  sessionFilterDisabled = false
}) => {
  const sessionOptions: { value: SessionFilter; label: string; icon: React.ReactNode }[] = [
    { value: 'morning', label: 'صباحي', icon: <Sun className="h-4 w-4" /> },
    { value: 'evening', label: 'مسائي', icon: <Moon className="h-4 w-4" /> },
    { value: 'both', label: 'كلاهما', icon: <BarChart3 className="h-4 w-4" /> }
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const updateIndicator = () => {
      if (!containerRef.current) return;

      const activeButton = containerRef.current.querySelector(`[data-session="${sessionFilter}"]`) as HTMLElement;
      if (activeButton) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const activeRect = activeButton.getBoundingClientRect();

        setIndicatorStyle({
          left: `${activeRect.left - containerRect.left}px`,
          width: `${activeRect.width}px`,
          opacity: 1,
        });

        if (!isInitialized) {
          setIsInitialized(true);
        }
      }
    };

    // Initial update
    updateIndicator();

    // Update on window resize
    window.addEventListener('resize', updateIndicator);

    return () => {
      window.removeEventListener('resize', updateIndicator);
    };
  }, [sessionFilter, isInitialized]);

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg shadow-sm">
      {/* Session Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">الفترة:</span>
        <div ref={containerRef} className="relative flex gap-1 bg-muted p-1 rounded-lg">
          {/* Animated indicator blob */}
          <div
            className="absolute h-[calc(100%-8px)] top-1 rounded-md bg-primary shadow-sm transition-all duration-300 ease-out pointer-events-none z-0"
            style={{
              ...indicatorStyle,
              opacity: isInitialized ? indicatorStyle.opacity : 0,
            }}
          />
          {sessionOptions.map((option) => (
            <Button
              key={option.value}
              data-session={option.value}
              variant="ghost"
              size="sm"
              onClick={() => onSessionChange(option.value)}
              className={cn(
                "relative gap-1.5 transition-colors duration-200 z-10 hover:bg-transparent",
                sessionFilter === option.value
                  ? "text-primary-foreground hover:text-primary-foreground/90"
                  : "text-muted-foreground hover:text-foreground"
              )}
              disabled={sessionFilterDisabled && sessionFilter !== option.value}
            >
              {option.icon}
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
