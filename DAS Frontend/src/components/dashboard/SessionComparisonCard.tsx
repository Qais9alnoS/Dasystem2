import React, { useRef, useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PeriodFilter } from '@/components/dashboard';
import PieChart from '@/components/analytics/PieChart';
import BarChart from '@/components/analytics/BarChart';
import LineChart from '@/components/analytics/LineChart';

interface SessionData {
  students: number;
  teachers: number;
  classes: number;
}

interface SectionData {
  label: string;
  count: number;
  session_type?: string;
  grade_level?: string;
  grade_number?: number;
  section?: string;
}

// Helper function to format class label in Arabic
const formatClassLabel = (section: SectionData): string => {
  if (section.grade_level && section.grade_number && section.section) {
    return `الصف ${section.grade_number}/${section.section}`;
  }
  // Fallback: try to parse from the label
  const label = section.label;
  const match = label.match(/(\d+)\s*[-/]\s*(\d+)/);
  if (match) {
    return `الصف ${match[1]}/${match[2]}`;
  }
  return label;
};

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

interface GenderData {
  gender: string;
  count: number;
  session_type?: string;
}

interface TransportData {
  type: string;
  count: number;
  session_type?: string;
}

interface AttendanceData {
  date: string;
  morning_rate?: number;
  evening_rate?: number;
  rate?: number;
  attendance_rate?: number;
  // Extended fields from backend merge (DashboardPage) for accurate aggregation
  morning_total?: number;
  morning_present?: number;
  morning_absent?: number;
  evening_total?: number;
  evening_present?: number;
  evening_absent?: number;
}

interface SessionComparisonCardProps {
  morning: SessionData;
  evening: SessionData;
  sessionFilter: 'morning' | 'evening' | 'both';
  distributionData?: SectionData[];
  genderData?: GenderData[];
  transportData?: TransportData[];
  attendanceData?: AttendanceData[];
  loading?: boolean;
  periodFilter: PeriodFilter;
  onPeriodChange?: (period: PeriodFilter) => void;
  academicYearName?: string;
}

export const SessionComparisonCard: React.FC<SessionComparisonCardProps> = ({
  morning,
  evening,
  sessionFilter,
  distributionData = [],
  genderData = [],
  transportData = [],
  attendanceData = [],
  loading = false,
  periodFilter,
  onPeriodChange,
  academicYearName
}) => {
  // Refs and state for period selector animations
  const morningPeriodRef = useRef<HTMLDivElement>(null);
  const eveningPeriodRef = useRef<HTMLDivElement>(null);
  const bothPeriodRef = useRef<HTMLDivElement>(null);
  const [morningIndicatorStyle, setMorningIndicatorStyle] = useState<React.CSSProperties>({});
  const [eveningIndicatorStyle, setEveningIndicatorStyle] = useState<React.CSSProperties>({});
  const [bothIndicatorStyle, setBothIndicatorStyle] = useState<React.CSSProperties>({});
  const [indicatorsInitialized, setIndicatorsInitialized] = useState(false);

  // Update indicator positions
  useEffect(() => {
    const updateIndicators = () => {
      const updateIndicator = (ref: React.RefObject<HTMLDivElement>, setter: React.Dispatch<React.SetStateAction<React.CSSProperties>>) => {
        if (!ref.current) return;
        const activeButton = ref.current.querySelector(`[data-period="${periodFilter}"]`) as HTMLElement;
        if (activeButton) {
          const containerRect = ref.current.getBoundingClientRect();
          const activeRect = activeButton.getBoundingClientRect();
          setter({
            left: `${activeRect.left - containerRect.left}px`,
            width: `${activeRect.width}px`,
            opacity: 1,
          });
        }
      };

      updateIndicator(morningPeriodRef, setMorningIndicatorStyle);
      updateIndicator(eveningPeriodRef, setEveningIndicatorStyle);
      updateIndicator(bothPeriodRef, setBothIndicatorStyle);

      if (!indicatorsInitialized) {
        setIndicatorsInitialized(true);
      }
    };

    updateIndicators();
    window.addEventListener('resize', updateIndicators);

    return () => {
      window.removeEventListener('resize', updateIndicators);
    };
  }, [periodFilter, indicatorsInitialized]);

  // Note: Filtering is only needed for "both" view
  // For single session views, we use attendanceData directly since DashboardPage
  // already fetches session-specific data

  // Filter sections based on session
  const morningSections = distributionData.filter(s => s.session_type === 'morning');
  const eveningSections = distributionData.filter(s => s.session_type === 'evening');

  // Filter gender data by session
  const morningGender = genderData.filter(g => g.session_type === 'morning');
  const eveningGender = genderData.filter(g => g.session_type === 'evening');
  const allGender = genderData.filter(g => !g.session_type); // Overall gender data

  const getGroupedAttendanceForSession = (
    period: PeriodFilter,
    session: 'morning' | 'evening'
  ): AttendanceData[] => {
    if (!attendanceData || attendanceData.length === 0) return [];

    if (period === 'daily') {
      return attendanceData;
    }

    type Accumulator = {
      label: string;
      timestamp: number;
      total: number;
      present: number;
      rate_sum: number;
      count: number;
    };

    const groups = new Map<string, Accumulator>();

    const getKeyAndLabel = (dateStr: string): { key: string; label: string; ts: number } => {
      const d = new Date(dateStr);
      const ts = d.getTime();

      if (period === 'weekly') {
        const weekStart = new Date(d);
        const day = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - day);
        const key = `${weekStart.getFullYear()}-W-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
        const label = weekStart.toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' });
        return { key, label, ts: weekStart.getTime() };
      }

      if (period === 'monthly') {
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        const label = d.toLocaleDateString('ar-SY', { month: 'short', year: 'numeric' });
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        return { key, label, ts: monthStart.getTime() };
      }

      if (academicYearName) {
        const key = `academic-year-${academicYearName}`;
        const label = academicYearName;
        return { key, label, ts };
      }

      let startYear = d.getFullYear();
      if (d.getMonth() < 8) {
        startYear -= 1;
      }
      const endYear = startYear + 1;
      const key = `academic-year-${startYear}`;
      const label = `${startYear}-${endYear}`;
      return { key, label, ts };
    };

    for (const record of attendanceData) {
      const { key, label, ts } = getKeyAndLabel(record.date);
      const existing = groups.get(key) || {
        label,
        timestamp: ts,
        total: 0,
        present: 0,
        rate_sum: 0,
        count: 0
      };

      const totalKey = session === 'morning' ? 'morning_total' : 'evening_total';
      const presentKey = session === 'morning' ? 'morning_present' : 'evening_present';
      const rateKey = session === 'morning' ? 'morning_rate' : 'evening_rate';

      const totalVal = (record as any)[totalKey];
      const presentVal = (record as any)[presentKey];
      const rateVal = (record as any)[rateKey] ?? record.attendance_rate ?? record.rate;

      if (typeof totalVal === 'number' && typeof presentVal === 'number') {
        existing.total += totalVal;
        existing.present += presentVal;
      } else if (typeof rateVal === 'number') {
        existing.rate_sum += rateVal;
        existing.count += 1;
      }

      groups.set(key, existing);
    }

    const result: AttendanceData[] = Array.from(groups.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(group => {
        const rate = group.total > 0
          ? (group.present / group.total) * 100
          : (group.count > 0 ? group.rate_sum / group.count : 0);

        return {
          date: new Date(group.timestamp).toISOString(),
          [session === 'morning' ? 'morning_rate' : 'evening_rate']:
            Math.round(rate * 100) / 100
        } as AttendanceData;
      });

    return result;
  };

  // Helper: group attendance data by selected period for the both-sessions view
  const getGroupedAttendanceForBoth = (period: PeriodFilter): AttendanceData[] => {
    if (!attendanceData || attendanceData.length === 0) return [];

    // For daily view, keep raw points (already filtered by backend period_type)
    if (period === 'daily') {
      return attendanceData;
    }

    type Accumulator = {
      label: string;
      timestamp: number;
      morning_total: number;
      morning_present: number;
      morning_rate_sum: number;
      morning_count: number;
      evening_total: number;
      evening_present: number;
      evening_rate_sum: number;
      evening_count: number;
    };

    const groups = new Map<string, Accumulator>();

    const getKeyAndLabel = (dateStr: string): { key: string; label: string; ts: number } => {
      const d = new Date(dateStr);
      const ts = d.getTime();

      if (period === 'weekly') {
        // Align to Sunday as start of week (matching backend helper)
        const weekStart = new Date(d);
        const day = weekStart.getDay(); // 0 = Sunday
        weekStart.setDate(weekStart.getDate() - day);
        const key = `${weekStart.getFullYear()}-W-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
        const label = weekStart.toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' });
        return { key, label, ts: weekStart.getTime() };
      }

      if (period === 'monthly') {
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        const label = d.toLocaleDateString('ar-SY', { month: 'short', year: 'numeric' });
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        return { key, label, ts: monthStart.getTime() };
      }

      // Yearly: treat the whole range as a single academic year bucket.
      // Backend is already filtered by academic_year_id, so we should NOT
      // split by calendar year. Instead, derive the academic year label
      // from the date (e.g. 2025-2026).
      // If we have an explicit academic year name (e.g. "2025-2026"),
      // use it for both key and label so it stays in sync with backend.
      if (academicYearName) {
        const key = `academic-year-${academicYearName}`;
        const label = academicYearName;
        return { key, label, ts };
      }

      // Fallback: derive academic year from date
      let startYear = d.getFullYear();
      if (d.getMonth() < 8) {
        startYear -= 1;
      }
      const endYear = startYear + 1;
      const key = `academic-year-${startYear}`;
      const label = `${startYear}-${endYear}`;
      return { key, label, ts };
    };

    for (const record of attendanceData) {
      const { key, label, ts } = getKeyAndLabel(record.date);
      const existing = groups.get(key) || {
        label,
        timestamp: ts,
        morning_total: 0,
        morning_present: 0,
        morning_rate_sum: 0,
        morning_count: 0,
        evening_total: 0,
        evening_present: 0,
        evening_rate_sum: 0,
        evening_count: 0
      };

      // Morning aggregation
      if (typeof record.morning_total === 'number' && typeof record.morning_present === 'number') {
        existing.morning_total += record.morning_total;
        existing.morning_present += record.morning_present;
      } else if (typeof record.morning_rate === 'number') {
        existing.morning_rate_sum += record.morning_rate;
        existing.morning_count += 1;
      }

      // Evening aggregation
      if (typeof record.evening_total === 'number' && typeof record.evening_present === 'number') {
        existing.evening_total += record.evening_total;
        existing.evening_present += record.evening_present;
      } else if (typeof record.evening_rate === 'number') {
        existing.evening_rate_sum += record.evening_rate;
        existing.evening_count += 1;
      }

      groups.set(key, existing);
    }

    const result: AttendanceData[] = Array.from(groups.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(group => {
        const morningRate = group.morning_total > 0
          ? (group.morning_present / group.morning_total) * 100
          : (group.morning_count > 0 ? group.morning_rate_sum / group.morning_count : 0);

        const eveningRate = group.evening_total > 0
          ? (group.evening_present / group.evening_total) * 100
          : (group.evening_count > 0 ? group.evening_rate_sum / group.evening_count : 0);

        return {
          date: new Date(group.timestamp).toISOString(),
          morning_rate: Math.round(morningRate * 100) / 100,
          evening_rate: Math.round(eveningRate * 100) / 100,
        };
      });

    return result;
  };

  // Morning session view
  if (sessionFilter === 'morning') {
    const categories = morningSections.map(s => formatClassLabel(s));

    const displayAttendanceData = getGroupedAttendanceForSession(periodFilter, 'morning');

    // Get gender counts for morning
    const maleCount = morningGender.find(g => g.gender === 'male')?.count ||
                      allGender.find(g => g.gender === 'male')?.count || 0;
    const femaleCount = morningGender.find(g => g.gender === 'female')?.count ||
                        allGender.find(g => g.gender === 'female')?.count || 0;

    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
        {/* Attendance - Full width, larger line chart */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-amber-500" />
              نسبة حضور الفترة الصباحية
            </CardTitle>

            {/* Period toggle: Day / Week / Month / Year */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-medium text-muted-foreground">المدة:</span>
              <div ref={morningPeriodRef} className="relative flex gap-1 bg-muted p-1 rounded-lg">
                {/* Animated indicator blob */}
                <div
                  className="absolute h-[calc(100%-8px)] top-1 rounded-md bg-primary shadow-sm transition-all duration-300 ease-out pointer-events-none z-0"
                  style={{
                    ...morningIndicatorStyle,
                    opacity: indicatorsInitialized ? morningIndicatorStyle.opacity : 0,
                  }}
                />
                {([
                  { value: 'daily', label: 'يوم' },
                  { value: 'weekly', label: 'أسبوع' },
                  { value: 'monthly', label: 'شهر' },
                  { value: 'yearly', label: 'سنة' }
                ] as { value: PeriodFilter; label: string }[]).map(option => (
                  <Button
                    key={option.value}
                    data-period={option.value}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "relative h-7 px-2 text-xs z-10 transition-colors duration-200 hover:bg-transparent",
                      periodFilter === option.value
                        ? "text-primary-foreground hover:text-primary-foreground/90"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => onPeriodChange && onPeriodChange(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {displayAttendanceData.length > 0 ? (
              <LineChart
                key={`morning-attendance-${periodFilter}`}
                data={displayAttendanceData.map((a, index) => ({
                  name:
                    periodFilter === 'daily'
                      ? new Date(a.date).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' })
                      : periodFilter === 'weekly'
                        ? `الأسبوع ${index + 1}`
                        : periodFilter === 'monthly'
                          ? new Date(a.date).toLocaleDateString('ar-SY', { month: 'short', year: '2-digit' })
                          : (academicYearName || (() => {
                              const d = new Date(a.date);
                              let startYear = d.getFullYear();
                              if (d.getMonth() < 8) {
                                startYear -= 1;
                              }
                              const endYear = startYear + 1;
                              return `${startYear}-${endYear}`;
                            })()),
                  value: 0
                }))}
                series={[{
                  name: 'صباحي',
                  data: displayAttendanceData.map(a =>
                    a.morning_rate ?? a.attendance_rate ?? a.rate ?? 0
                  ),
                  color: MORNING_COLOR
                }]}
                height="340px"
                smooth
                loading={loading}
              />
            ) : (
              <div className="border border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center min-h-[220px]">
                <p className="text-sm text-muted-foreground">لا توجد بيانات حضور</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Class - Bar chart */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-sm">توزيع الطلاب حسب الصفوف</CardTitle>
          </CardHeader>
          <CardContent>
            {morningSections.length > 0 ? (
              <BarChart
                data={morningSections.map(s => ({ name: formatClassLabel(s), value: s.count }))}
                categories={categories}
                colors={[MORNING_COLOR]}
                height="420px"
                horizontal={false}
                loading={loading}
                showLegend={false}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">لا توجد بيانات</div>
            )}
          </CardContent>
        </Card>

        {/* Gender - Pie chart */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-sm">توزيع الطلاب حسب الجنس</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={[
                { name: 'ذكور', value: maleCount },
                { name: 'إناث', value: femaleCount }
              ]}
              colors={[MALE_COLOR, FEMALE_COLOR]}
              height="420px"
              donut
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Evening session view
  if (sessionFilter === 'evening') {
    const categories = eveningSections.map(s => formatClassLabel(s));

    // Use attendance data directly - it's already filtered by session in DashboardPage
    const displayAttendanceData = attendanceData;

    // Get gender counts for evening
    const maleCount = eveningGender.find(g => g.gender === 'male')?.count ||
                      allGender.find(g => g.gender === 'male')?.count || 0;
    const femaleCount = eveningGender.find(g => g.gender === 'female')?.count ||
                        allGender.find(g => g.gender === 'female')?.count || 0;

    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Attendance - Full width, larger line chart */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-blue-500" />
              نسبة حضور الفترة المسائية
            </CardTitle>

            {/* Period toggle: Day / Week / Month / Year */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-medium text-muted-foreground">المدة:</span>
              <div ref={eveningPeriodRef} className="relative flex gap-1 bg-muted p-1 rounded-lg">
                {/* Animated indicator blob */}
                <div
                  className="absolute h-[calc(100%-8px)] top-1 rounded-md bg-primary shadow-sm transition-all duration-300 ease-out pointer-events-none z-0"
                  style={{
                    ...eveningIndicatorStyle,
                    opacity: indicatorsInitialized ? eveningIndicatorStyle.opacity : 0,
                  }}
                />
                {([
                  { value: 'daily', label: 'يوم' },
                  { value: 'weekly', label: 'أسبوع' },
                  { value: 'monthly', label: 'شهر' },
                  { value: 'yearly', label: 'سنة' }
                ] as { value: PeriodFilter; label: string }[]).map(option => (
                  <Button
                    key={option.value}
                    data-period={option.value}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "relative h-7 px-2 text-xs z-10 transition-colors duration-200 hover:bg-transparent",
                      periodFilter === option.value
                        ? "text-primary-foreground hover:text-primary-foreground/90"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => onPeriodChange && onPeriodChange(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {displayAttendanceData.length > 0 ? (
              <LineChart
                key={`evening-attendance-${periodFilter}`}
                data={displayAttendanceData.map((a, index) => ({
                  name:
                    periodFilter === 'daily'
                      ? new Date(a.date).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' })
                      : periodFilter === 'weekly'
                        ? `الأسبوع ${index + 1}`
                        : periodFilter === 'monthly'
                          ? new Date(a.date).toLocaleDateString('ar-SY', { month: 'short', year: '2-digit' })
                          : (academicYearName || (() => {
                              const d = new Date(a.date);
                              let startYear = d.getFullYear();
                              if (d.getMonth() < 8) {
                                startYear -= 1;
                              }
                              const endYear = startYear + 1;
                              return `${startYear}-${endYear}`;
                            })()),
                  value: 0
                }))}
                series={[{
                  name: 'مسائي',
                  data: displayAttendanceData.map(a =>
                    a.evening_rate ?? a.attendance_rate ?? a.rate ?? 0
                  ),
                  color: EVENING_COLOR
                }]}
                height="340px"
                smooth
                loading={loading}
              />
            ) : (
              <div className="border border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center min-h-[220px]">
                <p className="text-sm text-muted-foreground">لا توجد بيانات حضور</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Class - Bar chart */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-sm">توزيع الطلاب حسب الصفوف</CardTitle>
          </CardHeader>
          <CardContent>
            {eveningSections.length > 0 ? (
              <BarChart
                data={eveningSections.map(s => ({ name: formatClassLabel(s), value: s.count }))}
                categories={categories}
                colors={[EVENING_COLOR]}
                height="420px"
                horizontal={false}
                loading={loading}
                showLegend={false}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">لا توجد بيانات</div>
            )}
          </CardContent>
        </Card>

        {/* Gender - Pie chart */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-sm">توزيع الطلاب حسب الجنس</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={[
                { name: 'ذكور', value: maleCount },
                { name: 'إناث', value: femaleCount }
              ]}
              colors={[MALE_COLOR, FEMALE_COLOR]}
              height="320px"
              donut
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if there's any data to show
  const hasData = morning.students > 0 || morning.teachers > 0 || morning.classes > 0 ||
                  evening.students > 0 || evening.teachers > 0 || evening.classes > 0;

  // Get combined gender counts for ALL students (morning + evening)
  const morningMale = morningGender.find(g => g.gender === 'male')?.count || 0;
  const eveningMale = eveningGender.find(g => g.gender === 'male')?.count || 0;
  const totalMaleCount = morningMale + eveningMale;

  const morningFemale = morningGender.find(g => g.gender === 'female')?.count || 0;
  const eveningFemale = eveningGender.find(g => g.gender === 'female')?.count || 0;
  const totalFemaleCount = morningFemale + eveningFemale;

  // Both - Show comparison
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
      {/* Attendance Comparison - Full width */}
      <Card className="xl:col-span-2">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            <Moon className="h-5 w-5 text-blue-500" />
            مقارنة نسب الحضور بين الفترتين
          </CardTitle>

          {/* Period toggle: Day / Week / Month / Year */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-medium text-muted-foreground">المدة:</span>
            <div ref={bothPeriodRef} className="relative flex gap-1 bg-muted p-1 rounded-lg">
              {/* Animated indicator blob */}
              <div
                className="absolute h-[calc(100%-8px)] top-1 rounded-md bg-primary shadow-sm transition-all duration-300 ease-out pointer-events-none z-0"
                style={{
                  ...bothIndicatorStyle,
                  opacity: indicatorsInitialized ? bothIndicatorStyle.opacity : 0,
                }}
              />
              {([
                { value: 'daily', label: 'يوم' },
                { value: 'weekly', label: 'أسبوع' },
                { value: 'monthly', label: 'شهر' },
                { value: 'yearly', label: 'سنة' }
              ] as { value: PeriodFilter; label: string }[]).map(option => (
                <Button
                  key={option.value}
                  data-period={option.value}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative h-7 px-2 text-xs z-10 transition-colors duration-200 hover:bg-transparent",
                    periodFilter === option.value
                      ? "text-primary-foreground hover:text-primary-foreground/90"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => onPeriodChange && onPeriodChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasData && !loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">لا توجد بيانات للمقارنة</p>
            </div>
          ) : attendanceData.length > 0 ? (
            (() => {
              const grouped = getGroupedAttendanceForBoth(periodFilter);
              return (
                <LineChart
                  key={`both-attendance-${periodFilter}`}
                  data={grouped.map(a => ({
                    name:
                      periodFilter === 'daily'
                        ? new Date(a.date).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' })
                        : periodFilter === 'weekly'
                          // Weekly: label as الأسبوع X (based on position in the series)
                          ? `الأسبوع ${grouped.indexOf(a) + 1}`
                          : periodFilter === 'monthly'
                            ? new Date(a.date).toLocaleDateString('ar-SY', { month: 'short', year: '2-digit' })
                            // Yearly: use backend-provided academic year name when available
                            : (academicYearName || (() => {
                                const d = new Date(a.date);
                                let startYear = d.getFullYear();
                                if (d.getMonth() < 8) {
                                  startYear -= 1;
                                }
                                const endYear = startYear + 1;
                                return `${startYear}-${endYear}`;
                              })()),
                    value: 0
                  }))}
                  series={[
                    {
                      name: 'صباحي',
                      data: grouped.map(a => a.morning_rate ?? 0),
                      color: MORNING_COLOR
                    },
                    {
                      name: 'مسائي',
                      data: grouped.map(a => a.evening_rate ?? 0),
                      color: EVENING_COLOR
                    }
                  ]}
                  height="340px"
                  smooth
                  loading={loading}
                />
              );
            })()
          ) : (
            <div className="border border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center min-h-[220px]">
              <p className="text-sm text-muted-foreground">لا توجد بيانات حضور</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student per class bar chart */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">توزيع الطلاب حسب الصفوف</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const allCategories = [
              ...morningSections.map(s => formatClassLabel(s)),
              ...eveningSections.map(s => formatClassLabel(s))
            ];
            const morningSeriesData = morningSections.map(s => s.count);
            const eveningSeriesData = eveningSections.map(s => s.count);
            const combinedSeries = [
              { name: 'صباحي', data: [...morningSeriesData, ...Array(eveningSections.length).fill(0)], color: MORNING_COLOR },
              { name: 'مسائي', data: [...Array(morningSections.length).fill(0), ...eveningSeriesData], color: EVENING_COLOR }
            ];

            if (allCategories.length === 0) {
              return <div className="text-center py-8 text-muted-foreground text-sm">لا توجد بيانات</div>;
            }

            return (
              <BarChart
                data={[]}
                categories={allCategories}
                series={combinedSeries}
                height="420px"
                horizontal={false}
                loading={loading}
                showLegend={true}
              />
            );
          })()}
        </CardContent>
      </Card>

      {/* Combined Gender for ALL students */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">توزيع الطلاب حسب الجنس</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChart
            data={[
              { name: 'ذكور', value: totalMaleCount },
              { name: 'إناث', value: totalFemaleCount }
            ]}
            colors={[MALE_COLOR, FEMALE_COLOR]}
            height="420px"
            donut
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
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
