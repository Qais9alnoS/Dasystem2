import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Calendar, BookOpen, Award, Search, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, BarChart, MetricCard, TimePeriodToggle } from './index';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface StudentItem {
  id: number;
  student_name: string;
  grade: string;
  section: string;
  session_type: 'morning' | 'evening';
}

interface StudentAnalytics {
  overview: {
    total_absence_days: number;
    attendance_rate: number;
    midterm_average: number;
    final_average: number;
    overall_average: number;
    rank_in_class: number;
    total_students_in_class: number;
  };
  attendance_trend: Array<{ date: string; status: string }>;
  subject_performance: Array<{ subject: string; midterm: number; final: number; average: number }>;
  exam_performance: {
    board: number;
    recitation: number;
    first_exam: number;
    midterm: number;
    second_exam: number;
    final_exam: number;
    behavior: number;
    activity: number;
  };
  activities: Array<{ name: string; status: string; score: number }>;
  financial: {
    total_due: number;
    total_paid: number;
    balance: number;
    payment_percentage: number;
  };
}

const StudentAnalyticsPage: React.FC = () => {
  const { state: authState } = useAuth();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Get session type based on user role
  const getSessionType = () => {
    if (authState.user?.role === 'morning_school') return 'morning';
    if (authState.user?.role === 'evening_school') return 'evening';
    return undefined; // Director sees all
  };

  // Fetch students list
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const academicYearId = localStorage.getItem('selected_academic_year_id');
        if (!academicYearId) return;

        const sessionType = getSessionType();
        const params = new URLSearchParams({
          academic_year_id: academicYearId,
          ...(sessionType && { session_type: sessionType })
        });

        const response = await api.get<StudentItem[]>(`/analytics/students/list?${params}`);
        setStudents(response.data || []);
      } catch (error) {
        console.error('Failed to fetch students:', error);
      }
    };

    fetchStudents();
  }, [authState.user]);

  // Fetch student analytics
  const fetchStudentAnalytics = async (studentId: number) => {
    setLoading(true);
    try {
      const academicYearId = localStorage.getItem('selected_academic_year_id');
      if (!academicYearId) return;

      const params = new URLSearchParams({
        academic_year_id: academicYearId,
        period_type: period
      });

      const response = await api.get<StudentAnalytics>(`/analytics/students/${studentId}?${params}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch student analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle student selection
  const handleSelectStudent = (student: StudentItem) => {
    setSelectedStudent(student);
    fetchStudentAnalytics(student.id);
  };

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تحليلات الطلاب</h1>
          <p className="text-muted-foreground mt-1">تحليل شامل لأداء الطالب وحضوره</p>
        </div>
        {selectedStudent && <TimePeriodToggle value={period} onChange={setPeriod} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selection Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>اختر طالب</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Box */}
              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ابحث عن طالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 rounded-lg border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Students List */}
              <div className="max-h-[600px] overflow-y-auto space-y-2">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                    <p>لا يوجد طلاب</p>
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className={`w-full text-right p-3 rounded-lg transition-all ${
                        selectedStudent?.id === student.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium">{student.student_name}</div>
                      <div className="text-sm opacity-80">
                        {student.grade} - {student.section}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Panel */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedStudent ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-2xl font-bold text-muted-foreground mb-2">اختر طالباً لعرض التحليلات</h3>
                <p className="text-muted-foreground">استخدم القائمة على اليسار لاختيار طالب</p>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
            </div>
          ) : analytics ? (
            <>
              {/* Student Info Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{selectedStudent.student_name}</h2>
                      <p className="text-muted-foreground">{selectedStudent.grade} - {selectedStudent.section}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">الترتيب في الصف</div>
                      <div className="text-3xl font-bold text-primary">
                        {analytics.overview.rank_in_class} / {analytics.overview.total_students_in_class}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="المعدل العام"
                  value={analytics.overview.overall_average.toFixed(1)}
                  icon={Award}
                  color="primary"
                  subtitle="من 100"
                />
                <MetricCard
                  title="نسبة الحضور"
                  value={`${analytics.overview.attendance_rate.toFixed(1)}%`}
                  icon={Calendar}
                  color="accent"
                />
                <MetricCard
                  title="أيام الغياب"
                  value={analytics.overview.total_absence_days}
                  icon={AlertCircle}
                  color="danger"
                />
                <MetricCard
                  title="المعدل النصفي"
                  value={analytics.overview.midterm_average.toFixed(1)}
                  icon={BookOpen}
                  color="secondary"
                />
              </div>

              {/* Subject Performance */}
              <div className="group relative bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5"></div>
                <h2 className="relative text-xl font-bold text-gray-900 mb-6 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
                  الأداء حسب المادة
                </h2>
                <BarChart
                  data={analytics.subject_performance.map(s => ({
                    name: s.subject,
                    value: s.average
                  }))}
                  height="400px"
                  horizontal
                />
              </div>

              {/* Exam Performance */}
              <div className="group relative bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5"></div>
                <h2 className="relative text-xl font-bold text-gray-900 mb-6 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
                  نتائج الامتحانات
                </h2>
                <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analytics.exam_performance).map(([key, value]) => (
                    <div key={key} className="text-center p-5 bg-gradient-to-br from-gray-50/80 to-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:shadow-lg hover:scale-105 transition-all duration-300">
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{key}</p>
                      <p className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
                        {value?.toFixed(1) || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Status */}
              <div className="group relative bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-yellow-500/5"></div>
                <h2 className="relative text-xl font-bold text-gray-900 mb-6 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
                  الحالة المالية
                </h2>
                <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 backdrop-blur-sm rounded-2xl border border-blue-200/50">
                    <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">المبلغ المستحق</p>
                    <p className="text-2xl font-extrabold text-blue-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
                      {analytics.financial.total_due.toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-500 font-medium mt-1">ل.س</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-sm rounded-2xl border border-green-200/50">
                    <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">المبلغ المدفوع</p>
                    <p className="text-2xl font-extrabold text-green-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
                      {analytics.financial.total_paid.toLocaleString()}
                    </p>
                    <p className="text-sm text-green-500 font-medium mt-1">ل.س</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-red-500/10 to-orange-500/5 backdrop-blur-sm rounded-2xl border border-red-200/50">
                    <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">الرصيد</p>
                    <p className="text-2xl font-extrabold text-red-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
                      {analytics.financial.balance.toLocaleString()}
                    </p>
                    <p className="text-sm text-red-500 font-medium mt-1">ل.س</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm rounded-2xl border border-purple-200/50">
                    <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">نسبة الدفع</p>
                    <p className="text-2xl font-extrabold text-purple-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
                      {analytics.financial.payment_percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default StudentAnalyticsPage;
