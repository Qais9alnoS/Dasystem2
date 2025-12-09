import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CalendarEvent {
  title: string;
  date: string;
  type: 'exam' | 'event' | 'holiday';
}

interface CalendarWidgetProps {
  events?: CalendarEvent[];
  loading?: boolean;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ events = [], loading = false }) => {
  const today = new Date();

  // Format Arabic date
  const arabicDate = format(today, 'EEEE، dd MMMM yyyy', { locale: ar });

  // Mock events if none provided
  const displayEvents: CalendarEvent[] = events.length > 0 ? events : [
    { title: 'امتحان الرياضيات - الصف السادس', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'exam' },
    { title: 'اجتماع أولياء الأمور', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), type: 'event' },
    { title: 'عطلة رسمية', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), type: 'holiday' }
  ];

  const getEventColor = (type: string) => {
    switch (type) {
      case 'exam':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
      case 'event':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
      case 'holiday':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return <AlertCircle className="h-3 w-3" />;
      case 'event':
        return <Calendar className="h-3 w-3" />;
      case 'holiday':
        return <Clock className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'غداً';
    if (diffDays === 2) return 'بعد يومين';
    return `بعد ${diffDays} يوم`;
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            التقويم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-16 bg-muted rounded-lg"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          التقويم والأحداث
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 overflow-auto">
        {/* Current Date */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-center">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
              اليوم
            </p>
            <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
              {arabicDate}
            </p>
            {/* Hijri date placeholder - would need a library for actual conversion */}
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {/* Add Hijri date here if needed */}
            </p>
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            الأحداث القادمة
          </h4>
          <div className="space-y-2">
            {displayEvents.slice(0, 3).map((event, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getEventColor(event.type)} transition-all hover:shadow-md cursor-pointer`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight mb-1">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-1 text-xs opacity-80">
                      {getEventIcon(event.type)}
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {event.type === 'exam' ? 'امتحان' : event.type === 'event' ? 'حدث' : 'عطلة'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {displayEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground opacity-20 mb-2" />
            <p className="text-sm text-muted-foreground">لا توجد أحداث قادمة</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
