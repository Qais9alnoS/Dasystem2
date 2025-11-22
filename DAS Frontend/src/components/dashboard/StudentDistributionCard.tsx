import React from 'react';
import { Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PieChart from '@/components/analytics/PieChart';
import BarChart from '@/components/analytics/BarChart';

interface StudentDistributionCardProps {
  distributionData: {
    by_grade?: Array<{ label: string; count: number }>;
    by_gender?: Array<{ gender: string; count: number }>;
    by_transportation?: Array<{ type: string; count: number }>;
    by_section?: Array<{ label: string; count: number }>;
  };
  sessionFilter: 'morning' | 'evening' | 'both';
  loading?: boolean;
}

export const StudentDistributionCard: React.FC<StudentDistributionCardProps> = ({
  distributionData,
  sessionFilter,
  loading = false
}) => {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>توزيع الطلاب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const transportationNames: Record<string, string> = {
    walking: 'مشي',
    full_bus: 'باص كامل',
    half_bus: 'نصف باص'
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          توزيع الطلاب
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Grade */}
          {distributionData.by_grade && distributionData.by_grade.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                حسب المرحلة
              </h4>
              <PieChart
                data={distributionData.by_grade.map((g) => ({
                  name: g.label,
                  value: g.count
                }))}
                height="280px"
                loading={loading}
              />
            </div>
          )}

          {/* By Gender */}
          {distributionData.by_gender && distributionData.by_gender.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                حسب الجنس
              </h4>
              <PieChart
                data={distributionData.by_gender.map((g) => ({
                  name: g.gender === 'male' ? 'ذكر' : 'أنثى',
                  value: g.count
                }))}
                height="280px"
                donut
                loading={loading}
              />
            </div>
          )}

          {/* By Transportation */}
          {distributionData.by_transportation && distributionData.by_transportation.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">توزيع وسائل النقل</h4>
              <BarChart
                data={distributionData.by_transportation.map((t) => ({
                  name: transportationNames[t.type] || t.type,
                  value: t.count
                }))}
                height="280px"
                loading={loading}
              />
            </div>
          )}

          {/* By Section (Top 10) */}
          {distributionData.by_section && distributionData.by_section.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">حسب الشعبة (الأعلى)</h4>
              <BarChart
                data={distributionData.by_section.slice(0, 10).map((s) => ({
                  name: s.label,
                  value: s.count
                }))}
                height="280px"
                horizontal
                loading={loading}
              />
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-border">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              المراحل
            </p>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {distributionData.by_grade?.length || 0}
            </p>
          </div>

          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
              الشعب
            </p>
            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {distributionData.by_section?.length || 0}
            </p>
          </div>

          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
              باص
            </p>
            <p className="text-2xl font-bold text-green-800 dark:text-green-200">
              {distributionData.by_transportation?.filter(t => t.type !== 'walking').reduce((sum, t) => sum + t.count, 0) || 0}
            </p>
          </div>

          <div className="text-center p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
              مشي
            </p>
            <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">
              {distributionData.by_transportation?.find(t => t.type === 'walking')?.count || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
