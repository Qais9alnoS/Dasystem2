import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, School, Trophy, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, BarChart, PieChart, MetricCard, TimePeriodToggle } from './index';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

const AnalyticsDashboard: React.FC = () => {
  const { state: authState } = useAuth();
  
  // Determine session type from user role
  const getSessionType = () => {
    if (authState.user?.role === 'morning_school') return 'morning';
    if (authState.user?.role === 'evening_school') return 'evening';
    return undefined; // Director sees all
  };
  
  const sessionType = getSessionType();
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [loading, setLoading] = useState(true);
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [distribution, setDistribution] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<number>(1);

  useEffect(() => {
    fetchAnalytics();
  }, [period, sessionType, academicYear]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        academic_year_id: academicYear.toString(),
        period_type: period,
        ...(sessionType && { session_type: sessionType })
      }).toString();

      const [overviewRes, distRes, attendanceRes] = await Promise.all([
        api.get(`/analytics/overview?${queryParams}`),
        api.get(`/analytics/students/distribution?${queryParams}`),
        api.get(`/analytics/attendance?${queryParams}`)
      ]);

      setOverviewStats(overviewRes.data);
      setDistribution(distRes.data);
      setAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            لوحة التحليلات {sessionType === 'morning' ? '- الصباحي' : sessionType === 'evening' ? '- المسائي' : ''}
          </h1>
          <p className="text-muted-foreground mt-1">تحليل شامل للبيانات والإحصائيات</p>
        </div>
        <TimePeriodToggle value={period} onChange={setPeriod} />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="إجمالي الطلاب"
          value={overviewStats?.total_students || 0}
          icon={Users}
          color="primary"
          loading={loading}
        />
        <MetricCard
          title="إجمالي المعلمين"
          value={overviewStats?.total_teachers || 0}
          icon={GraduationCap}
          color="accent"
          loading={loading}
        />
        <MetricCard
          title="إجمالي الصفوف"
          value={overviewStats?.total_classes || 0}
          icon={School}
          color="secondary"
          loading={loading}
        />
        <MetricCard
          title="الأنشطة الفعالة"
          value={overviewStats?.total_activities || 0}
          icon={Trophy}
          color="success"
          loading={loading}
        />
      </div>

      {/* Student Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>توزيع الطلاب حسب المرحلة</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={distribution?.by_grade?.map((g: any) => ({
                name: g.label,
                value: g.count
              })) || []}
              height="350px"
              loading={loading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع الطلاب حسب الجنس</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={distribution?.by_gender?.map((g: any) => ({
                name: g.gender === 'male' ? 'ذكر' : 'أنثى',
                value: g.count
              })) || []}
              donut
              height="350px"
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Transportation & Section Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>توزيع وسائل النقل</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={distribution?.by_transportation?.map((t: any) => ({
                name: t.type === 'walking' ? 'مشي' : t.type === 'full_bus' ? 'باص كامل' : 'نصف باص',
                value: t.count
              })) || []}
              height="350px"
              loading={loading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع الطلاب حسب الشعبة</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={distribution?.by_section?.slice(0, 10).map((s: any) => ({
                name: s.label,
                value: s.count
              })) || []}
              height="350px"
              horizontal
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Attendance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            معدل الحضور - الطلاب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={attendance?.student_attendance?.map((a: any) => ({
              name: new Date(a.date).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' }),
              value: a.attendance_rate
            })) || []}
            height="400px"
            showArea
            yAxisLabel="معدل الحضور (%)"
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Top Absent Students */}
      {attendance?.top_absent_students && attendance.top_absent_students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الطلاب الأكثر غياباً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">
                      اسم الطالب
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">
                      عدد أيام الغياب
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.top_absent_students.map((student: any, index: number) => (
                    <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {student.student_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          {student.absence_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
