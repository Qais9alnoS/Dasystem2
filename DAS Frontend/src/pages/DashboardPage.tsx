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
import '../utils/attendanceDebugger'; // Load debugger utility
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
      
      // Build query parameters
      const params: Record<string, string> = {
        academic_year_id: yearId.toString(),
        period_type: periodFilter
      };
      
      // Only add session_type if a specific session is selected (not 'both')
      if (sessionFilter !== 'both') {
        params.session_type = sessionFilter;
      }
      
      const queryParams = new URLSearchParams(params).toString();

      // When viewing both sessions, we need to fetch attendance data separately for morning and evening
      const promises = [
        api.get(`/analytics/overview?${queryParams}`),
        api.get(`/analytics/students/distribution?${queryParams}`),
        api.get(`/analytics/finance/overview?${queryParams}`),
        api.get(`/analytics/finance/income-trends?${queryParams}`),
        api.get(`/analytics/finance/expense-trends?${queryParams}`),
        api.get(`/analytics/academic/performance?${queryParams}`)
      ];

      // Add attendance API calls
      if (sessionFilter === 'both') {
        // Fetch morning and evening attendance separately
        const morningParams = new URLSearchParams({ ...params, session_type: 'morning' }).toString();
        const eveningParams = new URLSearchParams({ ...params, session_type: 'evening' }).toString();
        promises.push(
          api.get(`/analytics/attendance?${morningParams}`),
          api.get(`/analytics/attendance?${eveningParams}`)
        );
      } else {
        // Fetch for specific session
        promises.push(api.get(`/analytics/attendance?${queryParams}`));
      }

      const results = await Promise.all(promises);
      
      const [
        overviewRes, 
        distributionRes, 
        financialRes, 
        incomeRes,
        expenseRes,
        academicRes
      ] = results.slice(0, 6);

      // Handle attendance data based on session filter (not used, keeping for compatibility)
      let attendanceRes = results[6];

      // Process and set data
      const overview = overviewRes.data as any || {};
      const financial = financialRes.data as any || {};
      let attendance: any;

      if (sessionFilter === 'both') {
        const morningAttendanceRes = results[6];
        const eveningAttendanceRes = results[7];
        const morningData = morningAttendanceRes.data as any || {};
        const eveningData = eveningAttendanceRes.data as any || {};

        // Merge morning and evening attendance data
        const morningAttendance = morningData.student_attendance || [];
        const eveningAttendance = eveningData.student_attendance || [];

        // Create a map of dates with both morning and evening rates
        const dateMap = new Map();
        
        morningAttendance.forEach((record: any) => {
          dateMap.set(record.date, { 
            date: record.date, 
            morning_rate: record.attendance_rate,
            morning_total: record.total,
            morning_present: record.present,
            morning_absent: record.absent
          });
        });

        eveningAttendance.forEach((record: any) => {
          const existing = dateMap.get(record.date);
          if (existing) {
            existing.evening_rate = record.attendance_rate;
            existing.evening_total = record.total;
            existing.evening_present = record.present;
            existing.evening_absent = record.absent;
          } else {
            dateMap.set(record.date, {
              date: record.date,
              evening_rate: record.attendance_rate,
              evening_total: record.total,
              evening_present: record.present,
              evening_absent: record.absent
            });
          }
        });

        attendance = {
          student_attendance: Array.from(dateMap.values()).sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
          teacher_attendance: morningData.teacher_attendance || eveningData.teacher_attendance || [],
          top_absent_students: morningData.top_absent_students || []
        };
      } else {
        attendance = attendanceRes.data as any || {};
        // Add session-specific rate field
        if (attendance.student_attendance) {
          attendance.student_attendance = attendance.student_attendance.map((record: any) => ({
            ...record,
            [`${sessionFilter}_rate`]: record.attendance_rate
          }));
        }
      }

      // Debug attendance data (development only)
      if (process.env.NODE_ENV === 'development' && attendance.student_attendance?.length > 0) {
        console.log('Attendance Data Sample:', attendance.student_attendance[0]);
      }

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
  }, [periodFilter, sessionFilter]);

  // Fetch on mount and when filters change - no auto-refresh to avoid annoying reloads
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Get current date in Arabic
  const today = new Date();
  const arabicDate = format(today, 'EEEE، dd MMMM yyyy', { locale: ar });

  return (
    <div className="space-y-3">
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

      {/* Top Row: Quick Actions and History */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {/* Quick Actions Panel */}
        <QuickActionsPanel loading={loading} academicYearId={academicYearId} />
        
        {/* History Card - Fixed height for internal scrolling */}
        <div className="h-[500px]">
          <HistoryCard />
        </div>
      </div>

      {/* Main Analytics Card - Full Width */}
      <SessionComparisonCard
        morning={dashboardData.sessionData.morning}
        evening={dashboardData.sessionData.evening}
        sessionFilter={sessionFilter}
        distributionData={dashboardData.distribution.by_section}
        genderData={dashboardData.distribution.by_gender}
        transportData={dashboardData.distribution.by_transportation}
        attendanceData={dashboardData.attendance.students}
        loading={loading}
      />

      {/* Financial Summary - Full Width */}
      <FinancialSummaryCard
        totalIncome={dashboardData.financial.totalIncome}
        totalExpenses={dashboardData.financial.totalExpenses}
        netProfit={dashboardData.financial.netProfit}
        collectionRate={dashboardData.financial.collectionRate}
        loading={loading}
      />

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