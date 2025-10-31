import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Calendar,
  Clock,
  Users,
  BookOpen,
  GraduationCap,
  Download,
  Printer,
  Filter,
  Search,
  Loader2
} from 'lucide-react';
import { schedulesApi } from '@/services/api';
import { classesApi, teachersApi } from '@/services/api';
import { Class, Teacher } from '@/types/school';

interface ScheduleEntry {
  day: string;
  period: number;
  subject: string;
  teacher: string;
  classroom?: string;
  notes?: string;
}

interface ClassSchedule {
  className: string;
  gradeLevel: string;
  division: string;
  totalHours: number;
  schedule: ScheduleEntry[];
}

interface TeacherSchedule {
  teacherName: string;
  totalHours: number;
  subjects: string[];
  schedule: (ScheduleEntry & { className: string })[];
}

const SCHOOL_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const PERIODS = [1, 2, 3, 4, 5, 6];

export const ScheduleViewer: React.FC<{
  academicYearId: number;
  sessionType: 'morning' | 'evening';
}> = ({ academicYearId, sessionType }) => {
  const [selectedView, setSelectedView] = useState<'classes' | 'teachers'>('classes');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [teacherSchedules, setTeacherSchedules] = useState<TeacherSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Fetch classes and teachers when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch classes
        const classesResponse = await classesApi.getAll(academicYearId);
        setClasses(classesResponse.data || []);
        
        // Fetch teachers
        const teachersResponse = await teachersApi.getAll({ academic_year_id: academicYearId });
        setTeachers(teachersResponse.data || []);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: "خطأ في تحميل البيانات",
          description: error.message || "حدث خطأ أثناء تحميل البيانات",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (academicYearId) {
      fetchData();
    }
  }, [academicYearId]);

  // Fetch schedules when selected class or teacher changes
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!academicYearId) return;
      
      setLoadingSchedules(true);
      try {
        if (selectedView === 'classes' && selectedClass) {
          // Fetch class schedule
          const response = await schedulesApi.getWeeklyView(
            academicYearId, 
            sessionType, 
            parseInt(selectedClass)
          );
          // Process response to match our UI structure
          // For now using mock data placeholder - will be replaced with real data
          const mockSchedules: ClassSchedule[] = [
            {
              className: "الصف الأول الابتدائي - أ",
              gradeLevel: "ابتدائي",
              division: "أ",
              totalHours: 20,
              schedule: [
                { day: "الأحد", period: 1, subject: "قرآن كريم", teacher: "فاطمة أحمد" },
                { day: "الأحد", period: 2, subject: "لغة عربية", teacher: "محمد علي" },
                { day: "الأحد", period: 3, subject: "رياضيات", teacher: "أحمد محمد" },
                { day: "الأحد", period: 4, subject: "تربية فنية", teacher: "نادية حسن" },
                { day: "الاثنين", period: 1, subject: "لغة عربية", teacher: "محمد علي" },
                { day: "الاثنين", period: 2, subject: "رياضيات", teacher: "أحمد محمد" },
                { day: "الاثنين", period: 3, subject: "تربية إسلامية", teacher: "فاطمة أحمد" },
                { day: "الاثنين", period: 4, subject: "تربية رياضية", teacher: "عمر السيد" },
              ]
            }
          ];
          setClassSchedules(mockSchedules);
        } else if (selectedView === 'teachers' && selectedTeacher) {
          // Fetch teacher schedule
          const response = await schedulesApi.getWeeklyView(
            academicYearId, 
            sessionType, 
            undefined, 
            parseInt(selectedTeacher)
          );
          // Process response to match our UI structure
          // For now using mock data placeholder - will be replaced with real data
          const mockSchedules: TeacherSchedule[] = [
            {
              teacherName: "أحمد محمد",
              totalHours: 24,
              subjects: ["رياضيات"],
              schedule: [
                { day: "الأحد", period: 3, subject: "رياضيات", teacher: "أحمد محمد", className: "الصف الأول الابتدائي - أ" },
                { day: "الاثنين", period: 2, subject: "رياضيات", teacher: "أحمد محمد", className: "الصف الأول الابتدائي - أ" },
                { day: "الاثنين", period: 4, subject: "رياضيات", teacher: "أحمد محمد", className: "الصف الثاني الابتدائي - أ" },
              ]
            }
          ];
          setTeacherSchedules(mockSchedules);
        }
      } catch (error: any) {
        console.error('Error fetching schedules:', error);
        toast({
          title: "خطأ في تحميل الجداول",
          description: error.message || "حدث خطأ أثناء تحميل الجداول",
          variant: "destructive"
        });
      } finally {
        setLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, [academicYearId, sessionType, selectedView, selectedClass, selectedTeacher]);

  const renderClassScheduleTable = (classSchedule: ClassSchedule) => {
    const scheduleGrid: { [key: string]: ScheduleEntry | null } = {};
    
    // Initialize grid
    SCHOOL_DAYS.forEach(day => {
      PERIODS.forEach(period => {
        scheduleGrid[`${day}-${period}`] = null;
      });
    });
    
    // Fill grid with schedule entries
    classSchedule.schedule.forEach(entry => {
      scheduleGrid[`${entry.day}-${entry.period}`] = entry;
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-center">الحصة</th>
              {SCHOOL_DAYS.map(day => (
                <th key={day} className="border border-gray-300 p-2 text-center min-w-[150px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(period => (
              <tr key={period}>
                <td className="border border-gray-300 p-2 text-center font-medium bg-gray-50">
                  {period}
                </td>
                {SCHOOL_DAYS.map(day => {
                  const entry = scheduleGrid[`${day}-${period}`];
                  return (
                    <td key={`${day}-${period}`} className="border border-gray-300 p-2">
                      {entry ? (
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{entry.subject}</div>
                          <div className="text-xs text-muted-foreground">{entry.teacher}</div>
                          {entry.classroom && (
                            <div className="text-xs text-blue-600">{entry.classroom}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 text-xs">فارغ</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTeacherScheduleTable = (teacherSchedule: TeacherSchedule) => {
    const scheduleGrid: { [key: string]: (ScheduleEntry & { className: string }) | null } = {};
    
    // Initialize grid
    SCHOOL_DAYS.forEach(day => {
      PERIODS.forEach(period => {
        scheduleGrid[`${day}-${period}`] = null;
      });
    });
    
    // Fill grid with schedule entries
    teacherSchedule.schedule.forEach(entry => {
      scheduleGrid[`${entry.day}-${entry.period}`] = entry;
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-center">الحصة</th>
              {SCHOOL_DAYS.map(day => (
                <th key={day} className="border border-gray-300 p-2 text-center min-w-[180px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(period => (
              <tr key={period}>
                <td className="border border-gray-300 p-2 text-center font-medium bg-gray-50">
                  {period}
                </td>
                {SCHOOL_DAYS.map(day => {
                  const entry = scheduleGrid[`${day}-${period}`];
                  return (
                    <td key={`${day}-${period}`} className="border border-gray-300 p-2">
                      {entry ? (
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{entry.subject}</div>
                          <div className="text-xs text-muted-foreground">{entry.className}</div>
                          {entry.classroom && (
                            <div className="text-xs text-blue-600">{entry.classroom}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 text-xs">فارغ</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getSelectedClassSchedule = () => {
    return classSchedules.find(cs => `${cs.className}` === selectedClass) || classSchedules[0];
  };

  const getSelectedTeacherSchedule = () => {
    return teacherSchedules.find(ts => ts.teacherName === selectedTeacher) || teacherSchedules[0];
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">عرض الجداول الدراسية</h1>
          <p className="text-muted-foreground">
            عرض وطباعة الجداول المنشأة للصفوف والمعلمين
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 ml-1" />
            تصدير PDF
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 ml-1" />
            طباعة
          </Button>
        </div>
      </div>

      {/* View Selector */}
      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as 'classes' | 'teachers')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            جداول الصفوف
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            جداول المعلمين
          </TabsTrigger>
        </TabsList>

        {/* Classes View */}
        <TabsContent value="classes" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    جداول الصفوف الدراسية
                  </CardTitle>
                  <CardDescription>
                    عرض الجداول الأسبوعية لكل صف وشعبة
                  </CardDescription>
                </div>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id?.toString() || ''}>
                        الصف {cls.grade_number} {cls.grade_level === 'primary' ? 'ابتدائي' : cls.grade_level === 'intermediate' ? 'متوسط' : 'ثانوي'} - شعبة أ
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSchedules ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : selectedClass || classSchedules.length > 0 ? (
                <div className="space-y-4">
                  {/* Class Info */}
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{getSelectedClassSchedule()?.className}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{getSelectedClassSchedule()?.totalHours} حصة أسبوعياً</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{getSelectedClassSchedule()?.schedule.length} حصة مجدولة</span>
                    </div>
                  </div>

                  {/* Schedule Table */}
                  <div className="border rounded-lg overflow-hidden">
                    {getSelectedClassSchedule() && renderClassScheduleTable(getSelectedClassSchedule()!)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">لا توجد جداول منشأة</p>
                  <p className="text-muted-foreground">قم بإنشاء الجداول أولاً</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers View */}
        <TabsContent value="teachers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    جداول المعلمين
                  </CardTitle>
                  <CardDescription>
                    عرض الجداول الأسبوعية لكل معلم
                  </CardDescription>
                </div>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="اختر المعلم" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id?.toString() || ''}>
                        {teacher.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSchedules ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : selectedTeacher || teacherSchedules.length > 0 ? (
                <div className="space-y-4">
                  {/* Teacher Info */}
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <span className="font-medium">{getSelectedTeacherSchedule()?.teacherName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{getSelectedTeacherSchedule()?.totalHours} حصة أسبوعياً</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{getSelectedTeacherSchedule()?.subjects.join(', ')}</span>
                    </div>
                  </div>

                  {/* Schedule Table */}
                  <div className="border rounded-lg overflow-hidden">
                    {getSelectedTeacherSchedule() && renderTeacherScheduleTable(getSelectedTeacherSchedule()!)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">لا توجد جداول معلمين</p>
                  <p className="text-muted-foreground">قم بإنشاء الجداول أولاً</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <GraduationCap className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{classSchedules.length}</p>
            <p className="text-sm text-muted-foreground">صف مجدول</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{teacherSchedules.length}</p>
            <p className="text-sm text-muted-foreground">معلم مجدول</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">
              {classSchedules.reduce((total, cs) => total + (cs.schedule?.length || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">حصة إجمالية</p>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">مفتاح الألوان والرموز</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border rounded"></div>
              <span>حصة عادية</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border rounded"></div>
              <span>تربية رياضية</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border rounded"></div>
              <span>مختبر</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border rounded"></div>
              <span>حصة فارغة</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};