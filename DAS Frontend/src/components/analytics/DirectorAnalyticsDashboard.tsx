import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, School, Trophy, DollarSign, TrendingUp, Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MetricCard from './MetricCard';
import LineChart from './LineChart';
import BarChart from './BarChart';
import PieChart from './PieChart';
import TimePeriodToggle, { PeriodType } from './TimePeriodToggle';
import api from '../../services/api';

// Session colors: Yellow for morning, Blue for evening
const MORNING_COLOR = '#F59E0B'; // Amber/Yellow
const EVENING_COLOR = '#3B82F6'; // Blue

// Gender colors: Blue for male, Pink for female
const MALE_COLOR = '#3B82F6'; // Blue
const FEMALE_COLOR = '#EC4899'; // Pink

// Transportation colors (matching design system)
const BUS_COLOR = '#3B82F6'; // Blue (iOS Primary)
const PRIVATE_COLOR = '#F59E0B'; // Amber/Yellow (iOS Accent)
const NO_TRANSPORT_COLOR = '#FF9500'; // Orange (iOS Orange)

// Helper function to format class label in Arabic
const formatClassLabel = (section: any): string => {
  if (section.grade_level && section.grade_number && section.section) {
    return `الصف ${section.grade_number}/${section.section}`;
  }
  const label = section.label || '';
  const match = label.match(/(\d+)\s*[-/]\s*(\d+)/);
  if (match) {
    return `الصف ${match[1]}/${match[2]}`;
  }
  return label;
};

const DirectorAnalyticsDashboard: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState<number>(1);
  
  // State for all analytics data
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [distribution, setDistribution] = useState<any>(null);
  const [financialOverview, setFinancialOverview] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [academicPerformance, setAcademicPerformance] = useState<any>(null);

  useEffect(() => {
    fetchAllAnalytics();
  }, [period, academicYear]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        academic_year_id: academicYear.toString(),
        period_type: period
      }).toString();

      console.log('Fetching analytics with params:', queryParams);

      const [overview, dist, financial, attend, academic] = await Promise.all([
        api.get(`/analytics/overview?${queryParams}`),
        api.get(`/analytics/students/distribution?${queryParams}`),
        api.get(`/analytics/finance/overview?${queryParams}`),
        api.get(`/analytics/attendance?${queryParams}`),
        api.get(`/analytics/academic/performance?${queryParams}`)
      ]);

      console.log('Analytics responses:', { overview, dist, financial, attend, academic });
      console.log('Overview data:', overview.data);

      setOverviewStats(overview.data);
      setDistribution(dist.data);
      setFinancialOverview(financial.data);
      setAttendance(attend.data);
      setAcademicPerformance(academic.data);
    } catch (error) {
      console.error('Failed to fetch director analytics:', error);
      console.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة تحكم المدير</h1>
          <p className="text-muted-foreground mt-1">نظرة شاملة على جميع جوانب المدرسة</p>
        </div>
        <TimePeriodToggle value={period} onChange={setPeriod} />
      </div>

      {/* Strategic Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
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
          title="الصفوف"
          value={overviewStats?.total_classes || 0}
          icon={School}
          color="secondary"
          loading={loading}
        />
        <MetricCard
          title="الأنشطة"
          value={overviewStats?.total_activities || 0}
          icon={Trophy}
          color="success"
          loading={loading}
        />
        <MetricCard
          title="صافي الربح"
          value={financialOverview?.summary?.net_profit?.toLocaleString() || 0}
          icon={DollarSign}
          color={financialOverview?.summary?.net_profit >= 0 ? 'success' : 'danger'}
          loading={loading}
          subtitle="ل.س"
        />
        <MetricCard
          title="نسبة التحصيل"
          value={`${financialOverview?.collection?.collection_rate || 0}%`}
          icon={TrendingUp}
          color="primary"
          loading={loading}
        />
      </div>

      {/* Session Comparison - Combined */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            <Moon className="h-5 w-5 text-blue-500" />
            مقارنة بين الصباحي والمسائي
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-[350px]">
          <BarChart
            data={[]}
            categories={['الطلاب', 'المعلمين']}
            series={[
              {
                name: 'صباحي ⚡',
                data: [overviewStats?.morning_students || 0, overviewStats?.morning_teachers || 0],
                color: MORNING_COLOR
              },
              {
                name: 'مسائي 🌙',
                data: [overviewStats?.evening_students || 0, overviewStats?.evening_teachers || 0],
                color: EVENING_COLOR
              }
            ]}
            height="300px"
            horizontal={false}
            loading={loading}
            showLegend={true}
          />
        </CardContent>
      </Card>

      {/* Student Distribution by Class - Morning vs Evening */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            <Moon className="h-5 w-5 text-blue-500" />
            توزيع الطلاب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Row 1: Gender Charts - Morning vs Evening */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 text-center flex items-center justify-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" />
                مشاركة الصباحي
              </h4>
              <PieChart
                data={[
                  { name: 'ذكور', value: distribution?.by_gender?.reduce((sum: number, g: any) => g.gender === 'male' && g.session_type === 'morning' ? sum + g.count : sum, 0) || 0 },
                  { name: 'إناث', value: distribution?.by_gender?.reduce((sum: number, g: any) => g.gender === 'female' && g.session_type === 'morning' ? sum + g.count : sum, 0) || 0 }
                ]}
                colors={[MALE_COLOR, FEMALE_COLOR]}
                height="180px"
                donut
                loading={loading}
              />
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 text-center flex items-center justify-center gap-2">
                <Moon className="h-4 w-4 text-blue-500" />
                مشاركة المسائي
              </h4>
              <PieChart
                data={[
                  { name: 'ذكور', value: distribution?.by_gender?.reduce((sum: number, g: any) => g.gender === 'male' && g.session_type === 'evening' ? sum + g.count : sum, 0) || 0 },
                  { name: 'إناث', value: distribution?.by_gender?.reduce((sum: number, g: any) => g.gender === 'female' && g.session_type === 'evening' ? sum + g.count : sum, 0) || 0 }
                ]}
                colors={[MALE_COLOR, FEMALE_COLOR]}
                height="180px"
                donut
                loading={loading}
              />
            </div>
            
            {/* Row 2: Transportation Charts - Morning vs Evening */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 text-center flex items-center justify-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" />
                نقل الصباحي
              </h4>
              <PieChart
                data={[
                  { name: 'باص', value: distribution?.by_transportation?.find((t: any) => (t.type === 'bus') && t.session_type === 'morning')?.count || 0 },
                  { name: 'خاص', value: distribution?.by_transportation?.find((t: any) => (t.type === 'private') && t.session_type === 'morning')?.count || 0 },
                  { name: 'بدون', value: distribution?.by_transportation?.find((t: any) => (t.type === 'none' || t.type === 'no_transport') && t.session_type === 'morning')?.count || 0 }
                ]}
                colors={[BUS_COLOR, PRIVATE_COLOR, NO_TRANSPORT_COLOR]}
                height="180px"
                loading={loading}
              />
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 text-center flex items-center justify-center gap-2">
                <Moon className="h-4 w-4 text-blue-500" />
                نقل المسائي
              </h4>
              <PieChart
                data={[
                  { name: 'باص', value: distribution?.by_transportation?.find((t: any) => (t.type === 'bus') && t.session_type === 'evening')?.count || 0 },
                  { name: 'خاص', value: distribution?.by_transportation?.find((t: any) => (t.type === 'private') && t.session_type === 'evening')?.count || 0 },
                  { name: 'بدون', value: distribution?.by_transportation?.find((t: any) => (t.type === 'none' || t.type === 'no_transport') && t.session_type === 'evening')?.count || 0 }
                ]}
                colors={[BUS_COLOR, PRIVATE_COLOR, NO_TRANSPORT_COLOR]}
                height="180px"
                loading={loading}
              />
            </div>
            
            {/* Row 3: Bar Chart (full width) */}
            <div className="col-span-2">
              <h4 className="text-sm font-semibold text-foreground mb-2 text-center">حسب الصفوف</h4>
              {(() => {
                const bySection = distribution?.by_section || [];
                const morningSections = bySection.filter((s: any) => s.session_type === 'morning');
                const eveningSections = bySection.filter((s: any) => s.session_type === 'evening');
                
                const allCategories = [
                  ...morningSections.map((s: any) => formatClassLabel(s)),
                  ...eveningSections.map((s: any) => formatClassLabel(s))
                ];
                
                const morningData = morningSections.map((s: any) => s.count);
                const eveningData = eveningSections.map((s: any) => s.count);
                
                const series = [
                  {
                    name: 'صباحي',
                    data: [...morningData, ...Array(eveningSections.length).fill(0)],
                    color: MORNING_COLOR
                  },
                  {
                    name: 'مسائي',
                    data: [...Array(morningSections.length).fill(0), ...eveningData],
                    color: EVENING_COLOR
                  }
                ];
                
                if (allCategories.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">لا توجد بيانات</p>
                    </div>
                  );
                }
                
                return (
                  <BarChart
                    data={[]}
                    categories={allCategories}
                    series={series}
                    height="280px"
                    horizontal={false}
                    loading={loading}
                    showLegend={true}
                  />
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>الأداء الأكاديمي - حسب المادة</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[450px]">
        <BarChart
          data={academicPerformance?.subject_performance?.map((s: any) => ({
            name: s.subject,
            value: s.average
          })) || [
            { name: 'الرياضيات', value: 85 },
            { name: 'اللغة العربية', value: 78 },
            { name: 'العلوم', value: 82 },
            { name: 'التاريخ', value: 75 }
          ]}
          height="400px"
          loading={loading}
        />
        </CardContent>
      </Card>

      {/* Attendance Trends - Combined */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>معدل حضور الطلاب</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[400px]">
          <LineChart
            data={attendance?.student_attendance?.map((a: any) => ({
              name: new Date(a.date).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' }),
              value: a.attendance_rate
            })) || [
              { name: 'السبت', value: 92 },
              { name: 'الأحد', value: 89 },
              { name: 'الإثنين', value: 95 },
              { name: 'الثلاثاء', value: 88 },
              { name: 'الأربعاء', value: 94 }
            ]}
            height="350px"
            showArea
            yAxisLabel="معدل الحضور (%)"
            loading={loading}
          />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>معدل حضور المعلمين</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[400px]">
          <LineChart
            data={attendance?.teacher_attendance?.map((a: any) => ({
              name: new Date(a.date).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' }),
              value: a.attendance_rate
            })) || [
              { name: 'السبت', value: 98 },
              { name: 'الأحد', value: 97 },
              { name: 'الإثنين', value: 99 },
              { name: 'الثلاثاء', value: 96 },
              { name: 'الأربعاء', value: 98 }
            ]}
            height="350px"
            showArea
            yAxisLabel="معدل الحضور (%)"
            loading={loading}
          />
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle>نظرة مالية شاملة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-semibold text-muted-foreground mb-2">إجمالي الدخل</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {financialOverview?.summary?.total_income?.toLocaleString() || 0}
            </p>
              <p className="text-sm text-green-500 dark:text-green-400 font-medium mt-1">ل.س</p>
            </div>
            <div className="text-center p-6 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-semibold text-muted-foreground mb-2">إجمالي المصروفات</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {financialOverview?.summary?.total_expenses?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-red-500 dark:text-red-400 font-medium mt-1">ل.س</p>
            </div>
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-muted-foreground mb-2">صافي الربح</p>
              <p className={`text-3xl font-bold ${financialOverview?.summary?.net_profit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {financialOverview?.summary?.net_profit?.toLocaleString() || 0}
              </p>
              <p className={`text-sm font-medium mt-1 ${financialOverview?.summary?.net_profit >= 0 ? 'text-blue-500 dark:text-blue-400' : 'text-orange-500 dark:text-orange-400'}`}>ل.س</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Distribution by Grade */}
      <Card>
        <CardHeader>
          <CardTitle>توزيع الطلاب حسب المراحل الدراسية</CardTitle>
        </CardHeader>
        <CardContent>
        <BarChart
          data={distribution?.by_grade?.map((g: any) => ({
            name: g.label,
            value: g.count
          })) || []}
          height="400px"
          loading={loading}
        />
        </CardContent>
      </Card>

      {/* Exam Statistics Summary */}
      {academicPerformance?.exam_statistics && (
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات الامتحانات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {Object.entries(academicPerformance.exam_statistics).map(([key, value]: [string, any]) => (
                <div key={key} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{key}</p>
                  <p className="text-2xl font-bold text-foreground">{value.average?.toFixed(1) || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">متوسط</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DirectorAnalyticsDashboard;
