import React, { useState, useEffect, useCallback } from 'react';
import { HistoryCard } from '@/components/history/HistoryCard';
import {
  DashboardFilterBar,
  QuickStatsGrid,
  SessionComparisonCard,
  FinancialSummaryCard,
  QuickActionsPanel,
  AttendanceTrendsCard,
  FinanceTrendsCard,
  AcademicPerformanceCard,
  StudentDistributionCard,
  SessionFilter,
  PeriodFilter
} from '@/components/dashboard';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { state: authState } = useAuth();
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('both');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('monthly');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [academicYearId, setAcademicYearId] = useState<number>(1);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<any>({
    quickStats: {
      students: { morning: 0, evening: 0, total: 0 },
      teachers: { morning: 0, evening: 0, total: 0 },
      classes: { morning: 0, evening: 0, total: 0 },
      activities: 0,
      netProfit: 0,
      attendanceRate: 0
    },
    sessionData: {
      morning: { students: 0, teachers: 0, classes: 0 },
      evening: { students: 0, teachers: 0, classes: 0 }
    },
    financial: {
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
      collectionRate: 0
    },
    attendance: {
      students: [],
      teachers: []
    },
    financeTrends: {
      incomeTrends: null,
      expenseTrends: null
    },
    academicPerformance: {
      subjectPerformance: [],
      examStatistics: {}
    },
    distribution: {
      by_grade: [],
      by_gender: [],
      by_transportation: [],
      by_section: []
    }
  });

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const storedYearId = localStorage.getItem('selected_academic_year_id');
      const yearId = storedYearId ? parseInt(storedYearId) : 1;
      setAcademicYearId(yearId);
      
      const queryParams = new URLSearchParams({
        academic_year_id: yearId.toString(),
        period_type: periodFilter
      }).toString();

      // Fetch all analytics data in parallel
      const [
        overviewRes, 
        distributionRes, 
        financialRes, 
        attendanceRes,
        incomeRes,
        expenseRes,
        academicRes
      ] = await Promise.all([
        api.get(`/analytics/overview?${queryParams}`),
        api.get(`/analytics/students/distribution?${queryParams}`),
        api.get(`/analytics/finance/overview?${queryParams}`),
        api.get(`/analytics/attendance?${queryParams}`),
        api.get(`/analytics/finance/income-trends?${queryParams}`),
        api.get(`/analytics/finance/expense-trends?${queryParams}`),
        api.get(`/analytics/academic/performance?${queryParams}`)
      ]);

      // Process and set data
      const overview = overviewRes.data as any || {};
      const financial = financialRes.data as any || {};
      const attendance = attendanceRes.data as any || {};

      setDashboardData({
        quickStats: {
          students: {
            morning: overview.morning_students || 0,
            evening: overview.evening_students || 0,
            total: overview.total_students || 0
          },
          teachers: {
            morning: overview.morning_teachers || 0,
            evening: overview.evening_teachers || 0,
            total: overview.total_teachers || 0
          },
          classes: {
            morning: overview.morning_classes || 0,
            evening: overview.evening_classes || 0,
            total: overview.total_classes || 0
          },
          activities: overview.total_activities || 0,
          netProfit: financial.summary?.net_profit || 0,
          attendanceRate: attendance.overall_rate || 0
        },
        sessionData: {
          morning: {
            students: overview.morning_students || 0,
            teachers: overview.morning_teachers || 0,
            classes: overview.morning_classes || 0
          },
          evening: {
            students: overview.evening_students || 0,
            teachers: overview.evening_teachers || 0,
            classes: overview.evening_classes || 0
          }
        },
        financial: {
          totalIncome: financial.summary?.total_income || 0,
          totalExpenses: financial.summary?.total_expenses || 0,
          netProfit: financial.summary?.net_profit || 0,
          collectionRate: financial.collection?.collection_rate || 0
        },
        attendance: {
          students: attendance.student_attendance || [],
          teachers: attendance.teacher_attendance || []
        },
        financeTrends: {
          incomeTrends: incomeRes.data || null,
          expenseTrends: expenseRes.data || null
        },
        academicPerformance: {
          subjectPerformance: (academicRes.data as any)?.subject_performance || [],
          examStatistics: (academicRes.data as any)?.exam_statistics || {}
        },
        distribution: (distributionRes.data as any) || {
          by_grade: [],
          by_gender: [],
          by_transportation: [],
          by_section: []
        }
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [periodFilter]);

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh intervals
  useEffect(() => {
    const quickStatsInterval = setInterval(() => {
      fetchDashboardData();
    }, 60000); // 1 minute

    return () => clearInterval(quickStatsInterval);
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Get current date in Arabic
  const today = new Date();
  const arabicDate = format(today, 'EEEE، dd MMMM yyyy', { locale: ar });

  return (
    <div className="h-full overflow-auto p-3 space-y-3">
      {/* Page Header with Date */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة تحكم المدير</h1>
          <p className="text-sm text-muted-foreground mt-1">نظرة شاملة على جميع جوانب المدرسة</p>
        </div>
        
        {/* Current Date Display */}
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div className="text-right">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              اليوم
            </p>
            <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
              {arabicDate}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilterBar
        sessionFilter={sessionFilter}
        periodFilter={periodFilter}
        onSessionChange={setSessionFilter}
        onPeriodChange={setPeriodFilter}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
      />

      {/* Quick Stats Grid */}
      <QuickStatsGrid
        students={dashboardData.quickStats.students}
        teachers={dashboardData.quickStats.teachers}
        classes={dashboardData.quickStats.classes}
        activities={dashboardData.quickStats.activities}
        netProfit={dashboardData.quickStats.netProfit}
        attendanceRate={dashboardData.quickStats.attendanceRate}
        sessionFilter={sessionFilter}
        loading={loading}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Left Column (2/3 width) */}
        <div className="xl:col-span-2 space-y-3">
          {/* Session Comparison */}
          <SessionComparisonCard
            morning={dashboardData.sessionData.morning}
            evening={dashboardData.sessionData.evening}
            sessionFilter={sessionFilter}
            loading={loading}
          />

          {/* History Card - Resized */}
          <div className="h-[350px] overflow-hidden">
            <HistoryCard />
          </div>

          {/* Financial Summary */}
          <FinancialSummaryCard
            totalIncome={dashboardData.financial.totalIncome}
            totalExpenses={dashboardData.financial.totalExpenses}
            netProfit={dashboardData.financial.netProfit}
            collectionRate={dashboardData.financial.collectionRate}
            loading={loading}
          />
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-3">
          {/* Quick Actions Panel */}
          <QuickActionsPanel loading={loading} academicYearId={academicYearId} />
        </div>
      </div>

      {/* Attendance Trends - Full Width (Only if data) */}
      {(dashboardData.attendance.students.length > 0 || dashboardData.attendance.teachers.length > 0) && (
        <AttendanceTrendsCard
          studentAttendance={dashboardData.attendance.students}
          teacherAttendance={dashboardData.attendance.teachers}
          sessionFilter={sessionFilter}
          loading={loading}
        />
      )}
    </div>
  );
};