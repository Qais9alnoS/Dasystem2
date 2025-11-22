import React from 'react';
import { BookOpen, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BarChart from '@/components/analytics/BarChart';
import { Badge } from '@/components/ui/badge';

interface AcademicPerformanceCardProps {
  subjectPerformance: Array<{ subject: string; average: number }>;
  examStatistics: Record<string, { average: number; total_students?: number }>;
  sessionFilter: 'morning' | 'evening' | 'both';
  loading?: boolean;
}

export const AcademicPerformanceCard: React.FC<AcademicPerformanceCardProps> = ({
  subjectPerformance,
  examStatistics,
  sessionFilter,
  loading = false
}) => {
  const getPerformanceColor = (average: number) => {
    if (average >= 90) return 'text-green-600 dark:text-green-400';
    if (average >= 75) return 'text-blue-600 dark:text-blue-400';
    if (average >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceBadge = (average: number) => {
    if (average >= 90) return { label: 'ممتاز', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
    if (average >= 75) return { label: 'جيد جداً', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
    if (average >= 60) return { label: 'جيد', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' };
    return { label: 'يحتاج تحسين', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
  };

  const calculateOverallAverage = (): string => {
    if (!subjectPerformance || subjectPerformance.length === 0) return '0';
    const sum = subjectPerformance.reduce((acc, subj) => acc + subj.average, 0);
    return (sum / subjectPerformance.length).toFixed(1);
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>الأداء الأكاديمي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 animate-pulse">
            <div className="h-80 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          الأداء الأكاديمي
          {sessionFilter !== 'both' && (
            <Badge variant="secondary" className="mr-auto">
              {sessionFilter === 'morning' ? 'صباحي' : 'مسائي'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Performance */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                المعدل العام
              </p>
              <div className="flex items-center gap-3">
                <p className="text-4xl font-bold text-blue-800 dark:text-blue-200">
                  {calculateOverallAverage()}%
                </p>
                {(() => {
                  const avgString = calculateOverallAverage();
                  const badge = getPerformanceBadge(parseFloat(avgString));
                  return (
                    <Badge className={badge.color}>{badge.label}</Badge>
                  );
                })()}
              </div>
            </div>
            <Award className="h-16 w-16 text-blue-600 dark:text-blue-400 opacity-30" />
          </div>
        </div>

        {/* Subject Performance Bar Chart */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            الأداء حسب المادة
          </h4>
          <BarChart
            data={(subjectPerformance || []).map((subj) => ({
              name: subj.subject,
              value: subj.average
            }))}
            height="350px"
            loading={loading}
            horizontal
          />
        </div>

        {/* Exam Statistics Grid */}
        {examStatistics && Object.keys(examStatistics).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">إحصائيات الامتحانات</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(examStatistics).map(([exam, stats]: [string, any]) => {
                const examNames: Record<string, string> = {
                  board: 'اللوح',
                  recitation: 'تسميع',
                  first_exam: 'امتحان أول',
                  midterm: 'نصفي',
                  second_exam: 'امتحان ثاني',
                  final_exam: 'نهائي',
                  behavior: 'سلوك',
                  activity: 'نشاط'
                };

                return (
                  <div
                    key={exam}
                    className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center"
                  >
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      {examNames[exam] || exam}
                    </p>
                    <p className={`text-2xl font-bold ${getPerformanceColor(stats.average || 0)}`}>
                      {(stats.average || 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">من 100</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Performance Summary */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
              أعلى معدل
            </p>
            <p className="text-xl font-bold text-green-800 dark:text-green-200">
              {subjectPerformance && subjectPerformance.length > 0
                ? Math.max(...subjectPerformance.map((s) => s.average)).toFixed(1)
                : 0}%
            </p>
          </div>

          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              المتوسط
            </p>
            <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
              {calculateOverallAverage()}%
            </p>
          </div>

          <div className="text-center p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
              أقل معدل
            </p>
            <p className="text-xl font-bold text-amber-800 dark:text-amber-200">
              {subjectPerformance && subjectPerformance.length > 0
                ? Math.min(...subjectPerformance.map((s) => s.average)).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
