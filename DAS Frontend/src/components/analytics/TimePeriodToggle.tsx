import React from 'react';
import { Button } from '@/components/ui/button';

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface TimePeriodToggleProps {
  value: PeriodType;
  onChange: (period: PeriodType) => void;
  className?: string;
}

const TimePeriodToggle: React.FC<TimePeriodToggleProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const periods: { value: PeriodType; label: string }[] = [
    { value: 'daily', label: 'يومي' },
    { value: 'weekly', label: 'أسبوعي' },
    { value: 'monthly', label: 'شهري' },
    { value: 'yearly', label: 'سنوي' }
  ];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={value === period.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(period.value)}
          className="min-w-[70px]"
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
};

export default TimePeriodToggle;
