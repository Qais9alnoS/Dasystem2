import { useState, useEffect } from 'react';
import { Users, Search, UserCheck, UserX, Save, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import api from '@/services/api';

interface Student {
  id: number;
  full_name: string;
  grade_number: number;
  section: string;
  is_present?: boolean;
}

interface Class {
  id: number;
  grade_number: number;
  section_count: number;
  grade_level: string;
}

interface StudentAttendanceProps {
  academicYearId: number;
  sessionType: string;
  selectedDate: string;
}

export function StudentAttendance({ academicYearId, sessionType, selectedDate }: StudentAttendanceProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [absentStudentIds, setAbsentStudentIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, [academicYearId, sessionType]);

  useEffect(() => {
    if (selectedClassId && selectedSection) {
      fetchStudents();
    }
  }, [selectedClassId, selectedSection, selectedDate]);

  const fetchClasses = async () => {
    try {
      const response = await api.get(`/academic/classes?academic_year_id=${academicYearId}&session_type=${sessionType}`);
      setClasses(response.data as Class[]);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      // احصل على الطلاب
      const studentsResponse = await api.get(`/students/?class_id=${selectedClassId}&section=${selectedSection}`);
      
      // احصل على حضور اليوم
      const attendanceResponse = await api.get(
        `/daily/attendance/students?class_id=${selectedClassId}&section=${selectedSection}&attendance_date=${selectedDate}`
      );
      
      const attendanceData = attendanceResponse.data as Array<{student_id: number, is_present: boolean}>;
      const attendanceMap = new Map(
        attendanceData.map((a) => [a.student_id, a.is_present])
      );
      
      const studentsData = studentsResponse.data as Student[];
      const studentsWithAttendance = studentsData.map((student) => ({
        ...student,
        is_present: attendanceMap.get(student.id) ?? true
      }));
      
      setStudents(studentsWithAttendance);
      
      // تحديث قائمة الغائبين
      const absent = new Set<number>(
        studentsWithAttendance
          .filter((s) => !s.is_present)
          .map((s) => s.id)
      );
      setAbsentStudentIds(absent);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const toggleStudentAttendance = (studentId: number) => {
    setAbsentStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      await api.post('/daily/attendance/students/bulk', {
        academic_year_id: academicYearId,
        attendance_date: selectedDate,
        class_id: selectedClassId,
        section: selectedSection,
        absent_student_ids: Array.from(absentStudentIds)
      });
      
      alert('✅ تم حفظ الحضور بنجاح');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('❌ حدث خطأ أثناء حفظ الحضور');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = students.length - absentStudentIds.size;
  const absentCount = absentStudentIds.size;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-800 dark:to-emerald-900 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            حضور الطلاب
          </CardTitle>
          <Badge className={`${
            sessionType === 'morning' 
              ? 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700' 
              : 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700'
          } text-white`}>
            {sessionType === 'morning' ? '🌅 صباحي' : '🌆 مسائي'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* اختيار الصف والشعبة */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">الصف</label>
            <Select value={selectedClassId?.toString()} onValueChange={(val) => {
              setSelectedClassId(parseInt(val));
              setSelectedSection('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الصف" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    الصف {cls.grade_number} - {cls.grade_level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">الشعبة</label>
            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الشعبة" />
              </SelectTrigger>
              <SelectContent>
                {selectedClassId && classes.find(c => c.id === selectedClassId)?.section_count &&
                  Array.from({ length: classes.find(c => c.id === selectedClassId)!.section_count }, (_, i) => 
                    String.fromCharCode(65 + i)
                  ).map(section => (
                    <SelectItem key={section} value={section}>
                      الشعبة {section}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedClassId && selectedSection && (
          <>
            {/* إحصائيات */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-4 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <Badge className="bg-green-600 dark:bg-green-700 text-white">{presentCount}</Badge>
                </div>
                <div className="text-sm font-medium text-green-900 dark:text-green-100">حاضر</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 p-4 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between mb-2">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <Badge className="bg-red-600 dark:bg-red-700 text-white">{absentCount}</Badge>
                </div>
                <div className="text-sm font-medium text-red-900 dark:text-red-100">غائب</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <Badge className="bg-blue-600 dark:bg-blue-700 text-white">{students.length}</Badge>
                </div>
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">المجموع</div>
              </div>
            </div>

            {/* شريط البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <Input
                type="text"
                placeholder="ابحث عن طالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            {/* قائمة الطلاب */}
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد نتائج</p>
                </div>
              ) : (
                filteredStudents.map(student => (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                      absentStudentIds.has(student.id)
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {absentStudentIds.has(student.id) ? (
                        <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{student.full_name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant={absentStudentIds.has(student.id) ? 'destructive' : 'default'}
                      onClick={() => toggleStudentAttendance(student.id)}
                      className={`min-w-[80px] ${
                        absentStudentIds.has(student.id)
                          ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                          : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
                      }`}
                    >
                      {absentStudentIds.has(student.id) ? 'غائب' : 'حاضر'}
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* زر الحفظ */}
            <Button 
              onClick={handleSaveAttendance} 
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800" 
              size="lg"
              disabled={saving || students.length === 0}
            >
              <Save className="h-5 w-5 ml-2" />
              {saving ? 'جاري الحفظ...' : 'حفظ الحضور'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
