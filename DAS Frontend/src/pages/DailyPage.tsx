import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HolidayManagement } from '@/components/daily/HolidayManagement';
import { StudentAttendance } from '@/components/daily/StudentAttendance';
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
  const [allowedSessions, setAllowedSessions] = useState<('morning' | 'evening')[]>([]);

  useEffect(() => {
    fetchActiveAcademicYear();
    determineAllowedSessions();
  }, [state.user]);

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
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              الصفحة اليومية
            </div>
            <div className="text-sm font-normal flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {sessionType === 'morning' ? 'الفترة الصباحية' : 'الفترة المسائية'}
                </span>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white text-gray-800 px-3 py-1 rounded border-0"
              />
            </div>
          </CardTitle>
        </CardHeader>
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
          />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <StudentAttendance
            academicYearId={academicYear.id}
            sessionType={sessionType}
            selectedDate={selectedDate}
          />
          
          {/* سيتم إضافة حضور المعلمين هنا لاحقاً */}
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
