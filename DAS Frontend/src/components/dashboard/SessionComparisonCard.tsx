import React from 'react';
import { Sun, Moon, Users, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PieChart from '@/components/analytics/PieChart';

interface SessionData {
  students: number;
  teachers: number;
  classes: number;
}

interface SessionComparisonCardProps {
  morning: SessionData;
  evening: SessionData;
  sessionFilter: 'morning' | 'evening' | 'both';
  loading?: boolean;
}

export const SessionComparisonCard: React.FC<SessionComparisonCardProps> = ({
  morning,
  evening,
  sessionFilter,
  loading = false
}) => {
  // Show comparison only when "both" is selected
  if (sessionFilter === 'morning') {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            إحصائيات الفترة الصباحية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <StatItem
              icon={Users}
              label="طلاب"
              value={morning.students}
              color="blue"
              loading={loading}
            />
            <StatItem
              icon={GraduationCap}
              label="معلمين"
              value={morning.teachers}
              color="blue"
              loading={loading}
            />
            <StatItem
              icon={Users}
              label="صفوف"
              value={morning.classes}
              color="blue"
              loading={loading}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessionFilter === 'evening') {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            إحصائيات الفترة المسائية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <StatItem
              icon={Users}
              label="طلاب"
              value={evening.students}
              color="amber"
              loading={loading}
            />
            <StatItem
              icon={GraduationCap}
              label="معلمين"
              value={evening.teachers}
              color="amber"
              loading={loading}
            />
            <StatItem
              icon={Users}
              label="صفوف"
              value={evening.classes}
              color="amber"
              loading={loading}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if there's any data to show
  const hasData = morning.students > 0 || morning.teachers > 0 || morning.classes > 0 ||
                  evening.students > 0 || evening.teachers > 0 || evening.classes > 0;

  // Both - Show comparison
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <Moon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          مقارنة الفترات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData && !loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">لا توجد بيانات للمقارنة</p>
          </div>
        ) : (
        <div className="space-y-4">
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Morning */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 justify-center">
                <Sun className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">صباحي</span>
              </div>
              <div className="space-y-2">
                <ComparisonItem label="طلاب" value={morning.students} color="blue" loading={loading} />
                <ComparisonItem label="معلمين" value={morning.teachers} color="blue" loading={loading} />
                <ComparisonItem label="صفوف" value={morning.classes} color="blue" loading={loading} />
              </div>
            </div>

            {/* Evening */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 justify-center">
                <Moon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">مسائي</span>
              </div>
              <div className="space-y-2">
                <ComparisonItem label="طلاب" value={evening.students} color="amber" loading={loading} />
                <ComparisonItem label="معلمين" value={evening.teachers} color="amber" loading={loading} />
                <ComparisonItem label="صفوف" value={evening.classes} color="amber" loading={loading} />
              </div>
            </div>
          </div>

          {/* Pie Charts - Only show if there's data */}
          {hasData && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              {(morning.students > 0 || evening.students > 0) && (
                <div>
                  <p className="text-xs font-semibold text-center mb-2 text-muted-foreground">توزيع الطلاب</p>
                  <PieChart
                    data={[
                      { name: 'صباحي', value: morning.students },
                      { name: 'مسائي', value: evening.students }
                    ]}
                    height="140px"
                    loading={loading}
                  />
                </div>
              )}
              {(morning.teachers > 0 || evening.teachers > 0) && (
                <div>
                  <p className="text-xs font-semibold text-center mb-2 text-muted-foreground">توزيع المعلمين</p>
                  <PieChart
                    data={[
                      { name: 'صباحي', value: morning.teachers },
                      { name: 'مسائي', value: evening.teachers }
                    ]}
                    height="140px"
                    donut
                    loading={loading}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper Components
const StatItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'blue' | 'amber';
  loading?: boolean;
}> = ({ icon: Icon, label, value, color, loading }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300',
    amber: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300'
  };

  if (loading) {
    return (
      <div className="p-3 rounded-lg border bg-muted animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]} text-center`}>
      <div className="flex items-center justify-center gap-1 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold">{value.toLocaleString('ar-SY')}</p>
    </div>
  );
};

const ComparisonItem: React.FC<{
  label: string;
  value: number;
  color: 'blue' | 'amber';
  loading?: boolean;
}> = ({ label, value, color, loading }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950',
    amber: 'bg-amber-50 dark:bg-amber-950'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-between p-2 rounded-lg bg-muted animate-pulse">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-2 rounded-lg ${colorClasses[color]}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-bold">{value.toLocaleString('ar-SY')}</span>
    </div>
  );
};
