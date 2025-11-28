import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
}

export const SessionComparisonCard: React.FC<SessionComparisonCardProps> = ({
  morning,
  evening,
  sessionFilter,
  distributionData = [],
  genderData = [],
  transportData = [],
  attendanceData = [],
  loading = false
}) => {

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

  // Morning session view
  if (sessionFilter === 'morning') {
    const categories = morningSections.map(s => formatClassLabel(s));
    
    // Use attendance data directly - it's already filtered by session in DashboardPage
    const displayAttendanceData = attendanceData;
    
    // Get gender counts for morning
    const maleCount = morningGender.find(g => g.gender === 'male')?.count || 
                      allGender.find(g => g.gender === 'male')?.count || 0;
    const femaleCount = morningGender.find(g => g.gender === 'female')?.count || 
                        allGender.find(g => g.gender === 'female')?.count || 0;
    
    // Get transportation counts for morning
    const busCount = transportData.find(t => t.type === 'bus' && t.session_type === 'morning')?.count || 
                     transportData.find(t => t.type === 'bus')?.count || 0;
    const privateCount = transportData.find(t => t.type === 'private' && t.session_type === 'morning')?.count || 
                         transportData.find(t => t.type === 'private')?.count || 0;
    const noTransportCount = transportData.find(t => (t.type === 'none' || t.type === 'no_transport') && t.session_type === 'morning')?.count || 
                             transportData.find(t => t.type === 'none' || t.type === 'no_transport')?.count || 0;
    
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            إحصائيات الفترة الصباحية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Top Left: Attendance Line Chart */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 text-center">نسبة الحضور</h4>
              {displayAttendanceData.length > 0 ? (
                <LineChart
                  data={displayAttendanceData.map(a => ({ 
                    name: new Date(a.date).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' }), 
                    value: 0 
                  }))}
                  series={[{
                    name: 'صباحي',
                    data: displayAttendanceData.map(a => 
                      a.morning_rate ?? a.attendance_rate ?? a.rate ?? 0
                    ),
                    color: MORNING_COLOR
                  }]}
                  height="300px"
                  smooth
                  loading={loading}
                />
              ) : (
                <div className="border border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center min-h-[180px]">
                  <p className="text-sm text-muted-foreground">لا توجد بيانات حضور</p>
                </div>
              )}
            </div>

            {/* Top Right: Bar Chart */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 text-center">حسب الصفوف</h4>
              {morningSections.length > 0 ? (
                <BarChart
                  data={morningSections.map(s => ({ name: formatClassLabel(s), value: s.count }))}
                  categories={categories}
                  colors={[MORNING_COLOR]}
                  height="300px"
                  horizontal={false}
                  loading={loading}
                  showLegend={false}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">لا توجد بيانات</div>
              )}
            </div>

            {/* Bottom Left: Transportation */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 text-center">حسب النقل</h4>
              <PieChart
                data={[
                  { name: 'باص', value: busCount },
                  { name: 'خاص', value: privateCount },
                  { name: 'بدون', value: noTransportCount }
                ]}
                colors={[BUS_COLOR, PRIVATE_COLOR, NO_TRANSPORT_COLOR]}
                height="200px"
                loading={loading}
              />
            </div>

            {/* Bottom Right: Gender */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 text-center">حسب الجنس</h4>
              <PieChart
                data={[
                  { name: 'ذكور', value: maleCount },
                  { name: 'إناث', value: femaleCount }
                ]}
                colors={[MALE_COLOR, FEMALE_COLOR]}
                height="200px"
                donut
                loading={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
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
    
    // Get transportation counts for evening
    const busCount = transportData.find(t => t.type === 'bus' && t.session_type === 'evening')?.count || 
                     transportData.find(t => t.type === 'bus')?.count || 0;
    const privateCount = transportData.find(t => t.type === 'private' && t.session_type === 'evening')?.count || 
                         transportData.find(t => t.type === 'private')?.count || 0;
    const noTransportCount = transportData.find(t => (t.type === 'none' || t.type === 'no_transport') && t.session_type === 'evening')?.count || 
                             transportData.find(t => t.type === 'none' || t.type === 'no_transport')?.count || 0;
    
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-blue-500" />
            إحصائيات الفترة المسائية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Top Left: Attendance Line Chart */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 text-center">نسبة الحضور</h4>
              {displayAttendanceData.length > 0 ? (
                <LineChart
                  data={displayAttendanceData.map(a => ({ 
                    name: new Date(a.date).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' }), 
                    value: 0 
                  }))}
                  series={[{
                    name: 'مسائي',
                    data: displayAttendanceData.map(a => 
                      a.evening_rate ?? a.attendance_rate ?? a.rate ?? 0
                    ),
                    color: EVENING_COLOR
                  }]}
                  height="300px"
                  smooth
                  loading={loading}
                />
              ) : (
                <div className="border border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center min-h-[180px]">
                  <p className="text-sm text-muted-foreground">لا توجد بيانات حضور</p>
                </div>
              )}
            </div>

            {/* Top Right: Bar Chart */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 text-center">حسب الصفوف</h4>
              {eveningSections.length > 0 ? (
                <BarChart
                  data={eveningSections.map(s => ({ name: formatClassLabel(s), value: s.count }))}
                  categories={categories}
                  colors={[EVENING_COLOR]}
                  height="300px"
                  horizontal={false}
                  loading={loading}
                  showLegend={false}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">لا توجد بيانات</div>
              )}
            </div>

            {/* Bottom Left: Transportation */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 text-center">حسب النقل</h4>
              <PieChart
                data={[
                  { name: 'باص', value: busCount },
                  { name: 'خاص', value: privateCount },
                  { name: 'بدون', value: noTransportCount }
                ]}
                colors={[BUS_COLOR, PRIVATE_COLOR, NO_TRANSPORT_COLOR]}
                height="200px"
                loading={loading}
              />
            </div>

            {/* Bottom Right: Gender */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 text-center">حسب الجنس</h4>
              <PieChart
                data={[
                  { name: 'ذكور', value: maleCount },
                  { name: 'إناث', value: femaleCount }
                ]}
                colors={[MALE_COLOR, FEMALE_COLOR]}
                height="200px"
                donut
                loading={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if there's any data to show
  const hasData = morning.students > 0 || morning.teachers > 0 || morning.classes > 0 ||
                  evening.students > 0 || evening.teachers > 0 || evening.classes > 0;

  // Get combined transportation counts for ALL students (morning + evening)
  const morningBus = transportData.find(t => t.type === 'bus' && t.session_type === 'morning')?.count || 0;
  const eveningBus = transportData.find(t => t.type === 'bus' && t.session_type === 'evening')?.count || 0;
  const totalBusCount = morningBus + eveningBus;
  
  const morningPrivate = transportData.find(t => t.type === 'private' && t.session_type === 'morning')?.count || 0;
  const eveningPrivate = transportData.find(t => t.type === 'private' && t.session_type === 'evening')?.count || 0;
  const totalPrivateCount = morningPrivate + eveningPrivate;
  
  const morningNoTransport = transportData.find(t => (t.type === 'none' || t.type === 'no_transport') && t.session_type === 'morning')?.count || 0;
  const eveningNoTransport = transportData.find(t => (t.type === 'none' || t.type === 'no_transport') && t.session_type === 'evening')?.count || 0;
  const totalNoTransportCount = morningNoTransport + eveningNoTransport;
  
  // Get combined gender counts for ALL students (morning + evening)
  const morningMale = morningGender.find(g => g.gender === 'male')?.count || 0;
  const eveningMale = eveningGender.find(g => g.gender === 'male')?.count || 0;
  const totalMaleCount = morningMale + eveningMale;
  
  const morningFemale = morningGender.find(g => g.gender === 'female')?.count || 0;
  const eveningFemale = eveningGender.find(g => g.gender === 'female')?.count || 0;
  const totalFemaleCount = morningFemale + eveningFemale;

  // Both - Show comparison
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-amber-500" />
          <Moon className="h-5 w-5 text-blue-500" />
          مقارنة الفترات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData && !loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">لا توجد بيانات للمقارنة</p>
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-4">
          {/* Top Left: Attendance Line Chart */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2 text-center">نسبة الحضور</h4>
            {attendanceData.length > 0 ? (
              <LineChart
                data={attendanceData.map(a => ({ 
                  name: new Date(a.date).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' }), 
                  value: 0 
                }))}
                series={[
                  { 
                    name: 'صباحي', 
                    data: attendanceData.map(a => a.morning_rate ?? 0), 
                    color: MORNING_COLOR 
                  },
                  { 
                    name: 'مسائي', 
                    data: attendanceData.map(a => a.evening_rate ?? 0), 
                    color: EVENING_COLOR 
                  }
                ]}
                height="300px"
                smooth
                loading={loading}
              />
            ) : (
              <div className="border border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center min-h-[280px]">
                <p className="text-sm text-muted-foreground">لا توجد بيانات حضور</p>
              </div>
            )}
          </div>

          {/* Top Right: Student per class bar chart */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2 text-center">توزيع الطلاب حسب الصفوف</h4>
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
                  height="300px"
                  horizontal={false}
                  loading={loading}
                  showLegend={true}
                />
              );
            })()}
          </div>

          {/* Bottom Left: Combined Transportation for ALL students */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2 text-center">حسب النقل</h4>
            <PieChart
              data={[
                { name: 'باص', value: totalBusCount },
                { name: 'خاص', value: totalPrivateCount },
                { name: 'بدون', value: totalNoTransportCount }
              ]}
              colors={[BUS_COLOR, PRIVATE_COLOR, NO_TRANSPORT_COLOR]}
              height="300px"
              loading={loading}
            />
          </div>

          {/* Bottom Right: Combined Gender for ALL students */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2 text-center">حسب الجنس</h4>
            <PieChart
              data={[
                { name: 'ذكور', value: totalMaleCount },
                { name: 'إناث', value: totalFemaleCount }
              ]}
              colors={[MALE_COLOR, FEMALE_COLOR]}
              height="300px"
              donut
              loading={loading}
            />
          </div>
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
