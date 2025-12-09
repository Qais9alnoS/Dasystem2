import React from 'react';
import { Users, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LineChart from '@/components/analytics/LineChart';

interface AttendanceData {
  date: string;
  morning?: number;
  evening?: number;
  rate: number;
}

interface AttendanceTrendsCardProps {
  studentAttendance: AttendanceData[];
  teacherAttendance: AttendanceData[];
  sessionFilter: 'morning' | 'evening' | 'both';
  loading?: boolean;
}

export const AttendanceTrendsCard: React.FC<AttendanceTrendsCardProps> = ({
  studentAttendance,
  teacherAttendance,
  sessionFilter,
  loading = false
}) => {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>اتجاهات الحضور</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 animate-pulse">
            <div className="h-64 bg-muted rounded-lg"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = studentAttendance.length > 0 || teacherAttendance.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
          اتجاهات الحضور
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData && !loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">لا توجد بيانات للحضور</p>
          </div>
        ) : (
        <>
        {/* Student Attendance */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-semibold text-foreground">معدل حضور الطلاب</h4>
          </div>

          {sessionFilter === 'both' ? (
            <LineChart
              key="student-both"
              data={studentAttendance.map((item) => ({
                name: new Date(item.date).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' }),
                value: 0
              }))}
              height="220px"
              showArea={false}
              yAxisLabel="معدل الحضور (%)"
              loading={loading}
              series={[
                {
                  name: 'صباحي',
                  data: studentAttendance.map((item) => item.morning || item.rate),
                  color: '#3b82f6'
                },
                {
                  name: 'مسائي',
                  data: studentAttendance.map((item) => item.evening || item.rate),
                  color: '#f59e0b'
                }
              ]}
            />
          ) : (
            <LineChart
              key={`student-${sessionFilter}`}
              data={studentAttendance.map((item) => ({
                name: new Date(item.date).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' }),
                value: 0
              }))}
              height="220px"
              showArea
              yAxisLabel="معدل الحضور (%)"
              loading={loading}
              series={[
                {
                  name: sessionFilter === 'morning' ? 'صباحي' : 'مسائي',
                  data: studentAttendance.map((item) =>
                    sessionFilter === 'morning'
                      ? (item.morning || item.rate)
                      : (item.evening || item.rate)
                  ),
                  color: sessionFilter === 'morning' ? '#3b82f6' : '#f59e0b'
                }
              ]}
            />
          )}
        </div>

        {/* Teacher Attendance */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-sm font-semibold text-foreground">معدل حضور المعلمين</h4>
          </div>

          {sessionFilter === 'both' ? (
            <LineChart
              key="teacher-both"
              data={teacherAttendance.map((item) => ({
                name: new Date(item.date).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' }),
                value: 0
              }))}
              height="220px"
              showArea={false}
              yAxisLabel="معدل الحضور (%)"
              loading={loading}
              series={[
                {
                  name: 'صباحي',
                  data: teacherAttendance.map((item) => item.morning || item.rate),
                  color: '#3b82f6'
                },
                {
                  name: 'مسائي',
                  data: teacherAttendance.map((item) => item.evening || item.rate),
                  color: '#f59e0b'
                }
              ]}
            />
          ) : (
            <LineChart
              key={`teacher-${sessionFilter}`}
              data={teacherAttendance.map((item) => ({
                name: new Date(item.date).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' }),
                value: 0
              }))}
              height="220px"
              showArea
              yAxisLabel="معدل الحضور (%)"
              loading={loading}
              series={[
                {
                  name: sessionFilter === 'morning' ? 'صباحي' : 'مسائي',
                  data: teacherAttendance.map((item) =>
                    sessionFilter === 'morning'
                      ? (item.morning || item.rate)
                      : (item.evening || item.rate)
                  ),
                  color: sessionFilter === 'morning' ? '#3b82f6' : '#f59e0b'
                }
              ]}
            />
          )}
        </div>

        {/* Summary Stats */}
        {studentAttendance.length > 0 && teacherAttendance.length > 0 && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                متوسط حضور الطلاب
              </p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {(studentAttendance.reduce((sum, item) => sum + item.rate, 0) / studentAttendance.length).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                متوسط حضور المعلمين
              </p>
              <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                {(teacherAttendance.reduce((sum, item) => sum + item.rate, 0) / teacherAttendance.length).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
        </>
        )}
      </CardContent>
    </Card>
  );
};
