import { useState, useEffect } from 'react';
import { Calendar, Clock, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HolidayManagement } from '@/components/daily/HolidayManagement';
import { StudentAttendance } from '@/components/daily/StudentAttendance';
import { TeacherAttendance } from '@/components/daily/TeacherAttendance';
import { StudentActions } from '@/components/daily/StudentActions';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

interface AcademicYear {
  id: number;
  year_name: string;
  is_active: boolean;
}

export default function DailyPage() {
  const { state } = useAuth();
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [sessionType, setSessionType] = useState<'morning' | 'evening'>('morning');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dateKey, setDateKey] = useState<number>(0);
  const [allowedSessions, setAllowedSessions] = useState<('morning' | 'evening')[]>([]);
  const [isHoliday, setIsHoliday] = useState<boolean>(false);
  const [holidayInfo, setHolidayInfo] = useState<any>(null);

  useEffect(() => {
    fetchActiveAcademicYear();
    determineAllowedSessions();
  }, [state.user]);

  useEffect(() => {
    if (academicYear) {
      checkIfHoliday();
    }
  }, [selectedDate, academicYear, sessionType]);

  const fetchActiveAcademicYear = async () => {
    try {
      const response = await api.get('/academic/years?active=true');
      const years = response.data as AcademicYear[];
      if (years.length > 0) {
        setAcademicYear(years[0]);
      }
    } catch (error) {
      console.error('Error fetching academic year:', error);
    }
  };

  const determineAllowedSessions = () => {
    if (!state.user) return;
    
    // المدير يملك صلاحية لرؤية كلا الفترتين
    if (state.user.role === 'admin' || state.user.role === 'director') {
      setAllowedSessions(['morning', 'evening']);
      // تحديد الفترة بناءً على الوقت
      const hour = new Date().getHours();
      setSessionType(hour >= 12 ? 'evening' : 'morning');
    } else {
      // للمشرفين، تحديد الفترة بناءً على session_type الخاص بهم
      const userSession = state.user.session_type || 'morning';
      setAllowedSessions([userSession]);
      setSessionType(userSession);
    }
  };

  const checkIfHoliday = async () => {
    try {
      // التحقق من الجمعة والسبت
      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        setIsHoliday(true);
        setHolidayInfo({ type: 'weekend', name: 'عطلة نهاية الأسبوع' });
        return;
      }

      // التحقق من العطل المسجلة
      const response = await api.get(
        `/daily/holidays?academic_year_id=${academicYear.id}&session_type=${sessionType}&date=${selectedDate}`
      );
      
      if (response.data && Array.isArray(response.data)) {
        const holiday = response.data.find((h: any) => h.holiday_date === selectedDate);
        if (holiday) {
          setIsHoliday(true);
          setHolidayInfo(holiday);
          return;
        }
      }
      
      setIsHoliday(false);
      setHolidayInfo(null);
    } catch (error) {
      console.error('Error checking holiday:', error);
      setIsHoliday(false);
      setHolidayInfo(null);
    }
  };

  if (!academicYear) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8" />
              <span>الصفحة اليومية</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                <Clock className="h-5 w-5" />
                <span className="font-semibold text-base">
                  {sessionType === 'morning' ? '🌅 الفترة الصباحية' : '🌆 الفترة المسائية'}
                </span>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-white/30 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-200"></div>
                <div className="relative flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setDateKey(prev => prev + 1);
                    }}
                    className="text-gray-800 font-semibold text-base bg-transparent border-0 outline-none cursor-pointer"
                    style={{ width: '150px' }}
                  />
                </div>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Date Indicator */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 shadow-md animate-in fade-in slide-in-from-top-2 duration-300" key={dateKey}>
        <CardContent className="py-3">
          <div className="flex items-center justify-center gap-3 text-blue-900 dark:text-blue-100">
            <CalendarDays className="h-5 w-5" />
            <span className="font-bold text-lg">
              البيانات المعروضة لتاريخ: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ar-SA', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Session Type Selector - يظهر فقط للمدير */}
      {allowedSessions.length > 1 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setSessionType('morning')}
                className={`px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 ${
                  sessionType === 'morning'
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                🌅 الفترة الصباحية
              </button>
              <button
                onClick={() => setSessionType('evening')}
                className={`px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 ${
                  sessionType === 'evening'
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                🌆 الفترة المسائية
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="holidays" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="holidays">إدارة أيام العطلة</TabsTrigger>
          <TabsTrigger value="attendance">الحضور والغياب</TabsTrigger>
          <TabsTrigger value="actions">الإجراءات السريعة</TabsTrigger>
        </TabsList>

        <TabsContent value="holidays">
          <HolidayManagement 
            academicYearId={academicYear.id} 
            sessionType={sessionType}
            selectedDate={selectedDate}
          />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          {isHoliday ? (
            <Card className="border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🏖️</div>
                  <div>
                    <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                      يوم عطلة
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300 text-lg">
                      {holidayInfo?.holiday_name || holidayInfo?.name || 'لا يوجد حضور في أيام العطل'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <StudentAttendance
                academicYearId={academicYear.id}
                sessionType={sessionType}
                selectedDate={selectedDate}
              />
              
              <TeacherAttendance
                academicYearId={academicYear.id}
                sessionType={sessionType}
                selectedDate={selectedDate}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="actions">
          <StudentActions
            academicYearId={academicYear.id}
            sessionType={sessionType}
            selectedDate={selectedDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
