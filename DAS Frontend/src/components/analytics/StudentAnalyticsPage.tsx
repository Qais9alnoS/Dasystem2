import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, TrendingUp, DollarSign, FileText, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { classesApi, studentsApi, analyticsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import type { Class, Student } from '@/types/school';
import { toast } from '@/hooks/use-toast';
import LineChart from './LineChart';
import PieChart from './PieChart';

interface StudentItem {
  id: number;
  full_name: string;
  grade_level: string;
  grade_number: number;
  section: string;
  session_type: 'morning' | 'evening';
}

interface AttendanceTrendData {
  period: string;
  attendance_rate: number;
  total_days: number;
  present_days: number;
  week_number?: number;
  month?: number;
  start_date?: string;
}

interface GradesTimelineData {
  assessment: string;
  average_grade: number;
  subjects_count: number;
}

interface GradesBySubjectData {
  subject_name: string;
  average_grade: number;
  assessments_count: number;
}

interface FinancialData {
  total_amount: number;
  total_paid: number;
  remaining_balance: number;
  paid_percentage: number;
  remaining_percentage: number;
}

interface BehaviorRecord {
  id: number;
  record_type: string;
  description: string;
  record_date: string;
  created_by: string;
  created_at: string;
}

const StudentAnalyticsPage: React.FC = () => {
  const { state: authState } = useAuth();
  const location = useLocation();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<'morning' | 'evening' | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);

  // Refs to track preselection processing
  const processedPreselectionRef = useRef(false);
  const classSelectionProcessedRef = useRef(false);
  const [pendingStudentId, setPendingStudentId] = useState<number | null>(null);

  // Attendance chart state
  const [attendanceTrendData, setAttendanceTrendData] = useState<AttendanceTrendData[]>([]);
  const [attendancePeriodType, setAttendancePeriodType] = useState<'weekly' | 'monthly'>('weekly');
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Grades timeline chart state
  const [gradesTimelineData, setGradesTimelineData] = useState<GradesTimelineData[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);

  // Grades by subject chart state
  const [gradesBySubjectData, setGradesBySubjectData] = useState<GradesBySubjectData[]>([]);
  const [gradesBySubjectLoading, setGradesBySubjectLoading] = useState(false);

  // Financial summary chart state
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);

  // Behavior records state
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>([]);
  const [behaviorLoading, setBehaviorLoading] = useState(false);

  // Load classes based on session type
  const loadClasses = async (academicYearId: number, sessionType: 'morning' | 'evening') => {
    try {
      setClassesLoading(true);
      setClassesError(null);

      const response = await classesApi.getAll({
        academic_year_id: academicYearId,
        session_type: sessionType
      });

      // Handle multiple response formats
      let allClasses: Class[] = [];

      if (Array.isArray(response)) {
        allClasses = response;
      } else if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          allClasses = response.data;
        } else if ('items' in response && Array.isArray(response.items)) {
          allClasses = response.items;
        } else if ('success' in response && response.success && 'data' in response) {
          allClasses = Array.isArray(response.data) ? response.data : [];
        }
      }

      setClasses(allClasses);
    } catch (error: any) {

      setClasses([]);
      setClassesError(error.message || 'فشل في تحميل الصفوف');
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحميل الصفوف',
        variant: 'destructive',
      });
    } finally {
      setClassesLoading(false);
    }
  };

  // Load selected academic year from localStorage on mount
  useEffect(() => {
    const yearId = localStorage.getItem('selected_academic_year_id');

    if (yearId) {
      const parsedId = parseInt(yearId, 10);
      if (!isNaN(parsedId)) {
        setSelectedAcademicYear(parsedId);

        // For non-director users, auto-select session type based on their role
        if (authState.user?.role === 'morning_school') {
          setSelectedSessionType('morning');
          loadClasses(parsedId, 'morning');
        } else if (authState.user?.role === 'evening_school') {
          setSelectedSessionType('evening');
          loadClasses(parsedId, 'evening');
        }
        // For directors, they need to select session type manually
      }
    }
  }, [authState.user?.role]);

  // Handle preselected state from navigation (e.g., from search)
  useEffect(() => {
    const state = location.state as any;
    if (state?.preselected && !processedPreselectionRef.current) {
      // Wait for dependencies to be ready before processing
      if (!selectedAcademicYear || !authState.user) {
        return;
      }

      const { sessionType, studentId } = state.preselected;

      // Set session type if provided and user is director, or verify it matches for school roles
      if (sessionType) {
        if (authState.user.role === 'director') {
          setSelectedSessionType(sessionType);
          loadClasses(selectedAcademicYear, sessionType);
        } else if (
          (authState.user.role === 'morning_school' && sessionType === 'morning') ||
          (authState.user.role === 'evening_school' && sessionType === 'evening')
        ) {
          // Session type matches user role, continue

        } else {

        }
      }

      // Store student ID for later selection
      if (studentId) {
        setPendingStudentId(studentId);
      }

      processedPreselectionRef.current = true;

      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state, authState.user, selectedAcademicYear]);

  // Handle class selection after classes are loaded from preselected state
  useEffect(() => {
    const state = location.state as any;
    if (state?.preselected && classes.length > 0 && !classSelectionProcessedRef.current) {
      const { gradeLevel, gradeNumber, section } = state.preselected;

      // Find the matching class
      const matchingClass = classes.find(c =>
        c.grade_level === gradeLevel &&
        c.grade_number === gradeNumber
      );

      if (matchingClass) {

        setSelectedClass(matchingClass.id);
        setSelectedSection(section);
        classSelectionProcessedRef.current = true;
      } else {

      }
    }
  }, [classes, location.state]);

  // Select student after students are loaded
  useEffect(() => {
    if (pendingStudentId && students.length > 0 && !loading) {
      const student = students.find(s => s.id === pendingStudentId);
      if (student && student.id) {

        // Convert Student to StudentItem
        const studentItem: StudentItem = {
          id: student.id,
          full_name: student.full_name,
          grade_level: student.grade_level,
          grade_number: student.grade_number,
          section: student.section,
          session_type: student.session_type
        };
        setSelectedStudent(studentItem);
        setPendingStudentId(null); // Clear the pending ID
      }
    }
  }, [students, pendingStudentId, loading]);

  // Load students when class and section change
  useEffect(() => {
    if (selectedClass && selectedSection) {
      loadStudents();
    }
  }, [selectedClass, selectedSection]);

  const loadStudents = async () => {
    if (!selectedAcademicYear || !selectedClass || !selectedSection) return;

    try {
      setLoading(true);
      const selectedClassData = classes.find(c => c.id === selectedClass);

      const response = await studentsApi.getAll({
        academic_year_id: selectedAcademicYear,
        grade_level: selectedClassData?.grade_level,
        grade_number: selectedClassData?.grade_number,
      });

      // Handle both direct array and wrapped response
      const allStudents = Array.isArray(response) ? response : (response?.data || []);

      // Filter by section and session type
      const filteredStudents = allStudents.filter(s =>
        s.section === selectedSection &&
        (!selectedSessionType || s.session_type === selectedSessionType)
      );

      // Sort alphabetically by name
      const sortedStudents = filteredStudents.sort((a, b) =>
        a.full_name.localeCompare(b.full_name, 'ar')
      );

      setStudents(sortedStudents);
    } catch (error) {

      setStudents([]);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الطلاب',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSectionOptions = () => {
    if (!selectedClass) return [];
    const classData = classes.find(c => c.id === selectedClass);
    if (!classData) return [];

    const sections = [];
    for (let i = 0; i < (classData.section_count || 1); i++) {
      sections.push(String(i + 1)); // 1, 2, 3, ...
    }
    return sections;
  };

  // Load attendance trend data
  const loadAttendanceTrend = async () => {
    if (!selectedStudent || !selectedAcademicYear) return;

    try {
      setAttendanceLoading(true);
      const response = await analyticsApi.getStudentAttendanceTrend(
        selectedStudent.id,
        selectedAcademicYear,
        attendancePeriodType
      );

      const data = response?.data || [];
      setAttendanceTrendData(data);
    } catch (error: any) {

      setAttendanceTrendData([]);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات الدوام',
        variant: 'destructive',
      });
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Load attendance trend when student or period type changes
  useEffect(() => {
    if (selectedStudent && selectedAcademicYear) {
      loadAttendanceTrend();
    }
  }, [selectedStudent, attendancePeriodType, selectedAcademicYear]);

  // Load grades timeline data
  const loadGradesTimeline = async () => {
    if (!selectedStudent || !selectedAcademicYear) return;

    try {
      setGradesLoading(true);
      const response = await analyticsApi.getStudentGradesTimeline(
        selectedStudent.id,
        selectedAcademicYear
      );

      const data = response?.data || [];
      setGradesTimelineData(data);
    } catch (error: any) {

      setGradesTimelineData([]);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات العلامات',
        variant: 'destructive',
      });
    } finally {
      setGradesLoading(false);
    }
  };

  // Load grades timeline when student changes
  useEffect(() => {
    if (selectedStudent && selectedAcademicYear) {
      loadGradesTimeline();
    }
  }, [selectedStudent, selectedAcademicYear]);

  // Load grades by subject data
  const loadGradesBySubject = async () => {
    if (!selectedStudent || !selectedAcademicYear) return;

    try {
      setGradesBySubjectLoading(true);
      const response = await analyticsApi.getStudentGradesBySubject(
        selectedStudent.id,
        selectedAcademicYear
      );

      const data = response?.data || [];
      setGradesBySubjectData(data);
    } catch (error: any) {

      setGradesBySubjectData([]);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات العلامات حسب المادة',
        variant: 'destructive',
      });
    } finally {
      setGradesBySubjectLoading(false);
    }
  };

  // Load grades by subject when student changes
  useEffect(() => {
    if (selectedStudent && selectedAcademicYear) {
      loadGradesBySubject();
    }
  }, [selectedStudent, selectedAcademicYear]);

  // Load financial summary data
  const loadFinancialSummary = async () => {
    if (!selectedStudent || !selectedAcademicYear) return;

    try {
      setFinancialLoading(true);
      const response = await analyticsApi.getStudentFinancialSummary(
        selectedStudent.id,
        selectedAcademicYear
      );

      const data = response?.data || null;
      setFinancialData(data);
    } catch (error: any) {

      setFinancialData(null);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل البيانات المالية',
        variant: 'destructive',
      });
    } finally {
      setFinancialLoading(false);
    }
  };

  // Load financial summary when student changes
  useEffect(() => {
    if (selectedStudent && selectedAcademicYear) {
      loadFinancialSummary();
    }
  }, [selectedStudent, selectedAcademicYear]);

  // Load behavior records
  const loadBehaviorRecords = async () => {
    if (!selectedStudent || !selectedAcademicYear) return;

    try {
      setBehaviorLoading(true);
      const response = await analyticsApi.getStudentBehaviorRecords(
        selectedStudent.id,
        selectedAcademicYear
      );

      const data = response?.data || [];
      setBehaviorRecords(data);
    } catch (error: any) {

      setBehaviorRecords([]);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل السجل السلوكي',
        variant: 'destructive',
      });
    } finally {
      setBehaviorLoading(false);
    }
  };

  // Load behavior records when student changes
  useEffect(() => {
    if (selectedStudent && selectedAcademicYear) {
      loadBehaviorRecords();
    }
  }, [selectedStudent, selectedAcademicYear]);

  // Handle student selection
  const handleSelectStudent = (student: Student) => {
    const studentItem: StudentItem = {
      id: student.id,
      full_name: student.full_name,
      grade_level: student.grade_level,
      grade_number: student.grade_number,
      section: student.section,
      session_type: student.session_type
    };
    setSelectedStudent(studentItem);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            تحليلات الطلاب
          </h1>
          <p className="text-muted-foreground mt-1">تحليل شامل لأداء الطالب وحضوره</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>اختيار الصف والشعبة</CardTitle>
        </CardHeader>
        <CardContent>
          {classesLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              جاري تحميل الصفوف...
            </div>
          ) : classesError ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{classesError}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Session Type Selection (for directors only) */}
              {authState.user?.role === 'director' && (
                <div className="space-y-2">
                  <Label>نوع الدوام</Label>
                  <Select
                    value={selectedSessionType || ''}
                    onValueChange={(value: 'morning' | 'evening') => {
                      setSelectedSessionType(value);
                      setSelectedClass(null);
                      setSelectedSection('');
                      if (selectedAcademicYear) {
                        loadClasses(selectedAcademicYear, value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الدوام" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">صباحي</SelectItem>
                      <SelectItem value="evening">مسائي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الصف</Label>
                  <Select
                    value={selectedClass?.toString()}
                    onValueChange={(value) => {
                      setSelectedClass(parseInt(value));
                      setSelectedSection('');
                    }}
                    disabled={authState.user?.role === 'director' && !selectedSessionType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        authState.user?.role === 'director' && !selectedSessionType
                          ? "اختر نوع الدوام أولاً"
                          : classes.length === 0
                          ? "لا توجد صفوف متاحة"
                          : "اختر الصف"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          لا توجد صفوف مسجلة
                        </div>
                      ) : (
                        classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {`${cls.grade_level === 'primary' ? 'ابتدائي' : cls.grade_level === 'intermediate' ? 'إعدادي' : 'ثانوي'} - الصف ${cls.grade_number}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الشعبة</Label>
                  <Select
                    value={selectedSection}
                    onValueChange={setSelectedSection}
                    disabled={!selectedClass || (authState.user?.role === 'director' && !selectedSessionType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الشعبة" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSectionOptions().map((section) => (
                        <SelectItem key={section} value={section}>
                          الشعبة {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selection Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>اختر طالب</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Students List */}
              <div className="max-h-[600px] overflow-y-auto space-y-2">
                {students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                    <p>لا يوجد طلاب</p>
                  </div>
                ) : (
                  students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className={`w-full text-right p-3 rounded-lg transition-all ${
                        selectedStudent?.id === student.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium">{student.full_name}</div>
                      <div className="text-sm opacity-80">
                        {student.grade_level === 'primary' ? 'ابتدائي' : student.grade_level === 'intermediate' ? 'إعدادي' : 'ثانوي'} - الصف {student.grade_number} - الشعبة {student.section}
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
                <AlertCircle className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-2xl font-bold text-muted-foreground mb-2">اختر طالباً لعرض التحليلات</h3>
                <p className="text-muted-foreground">استخدم القائمة على اليسار لاختيار طالب</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Student Info Header */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{selectedStudent.full_name}</h2>
                      <p className="text-muted-foreground">
                        {selectedStudent.grade_level === 'primary' ? 'ابتدائي' : selectedStudent.grade_level === 'intermediate' ? 'إعدادي' : 'ثانوي'} - الصف {selectedStudent.grade_number} - الشعبة {selectedStudent.section}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">نوع الدوام</div>
                      <div className="text-xl font-bold text-primary">
                        {selectedStudent.session_type === 'morning' ? 'صباحي' : 'مسائي'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Trend Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <CardTitle>متوسط الدوام</CardTitle>
                    </div>
                    <Select
                      value={attendancePeriodType}
                      onValueChange={(value: 'weekly' | 'monthly') => setAttendancePeriodType(value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">أسبوعي</SelectItem>
                        <SelectItem value="monthly">شهري</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {attendanceLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">جاري تحميل البيانات...</p>
                      </div>
                    </div>
                  ) : attendanceTrendData.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground text-lg">لا توجد بيانات دوام متاحة</p>
                      </div>
                    </div>
                  ) : (
                    <LineChart
                      data={attendanceTrendData.map(item => ({
                        name: item.period,
                        value: item.attendance_rate
                      }))}
                      title="نسبة الدوام"
                      height="400px"
                      showArea={true}
                      smooth={true}
                      yAxisLabel="نسبة الدوام (%)"
                      color="#3b82f6"
                      loading={attendanceLoading}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Grades Timeline Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                    <CardTitle>متوسط العلامات عبر الزمن</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {gradesLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                        <p className="text-muted-foreground">جاري تحميل البيانات...</p>
                      </div>
                    </div>
                  ) : gradesTimelineData.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground text-lg">لا توجد بيانات علامات متاحة</p>
                      </div>
                    </div>
                  ) : (
                    <LineChart
                      data={gradesTimelineData.map(item => ({
                        name: item.assessment,
                        value: item.average_grade
                      }))}
                      title="متوسط العلامات"
                      height="400px"
                      showArea={true}
                      smooth={true}
                      yAxisLabel="متوسط العلامات"
                      color="#eab308"
                      loading={gradesLoading}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Grades by Subject Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <CardTitle>متوسط العلامات حسب المادة</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {gradesBySubjectLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                        <p className="text-muted-foreground">جاري تحميل البيانات...</p>
                      </div>
                    </div>
                  ) : gradesBySubjectData.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground text-lg">لا توجد بيانات علامات متاحة</p>
                      </div>
                    </div>
                  ) : (
                    <LineChart
                      data={gradesBySubjectData.map(item => ({
                        name: item.subject_name,
                        value: item.average_grade
                      }))}
                      title="متوسط العلامات حسب المادة"
                      height="400px"
                      showArea={true}
                      smooth={true}
                      yAxisLabel="متوسط العلامات"
                      color="#22c55e"
                      loading={gradesBySubjectLoading}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Financial Summary Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                    <CardTitle>الحالة المالية</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {financialLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-muted-foreground">جاري تحميل البيانات...</p>
                      </div>
                    </div>
                  ) : !financialData || financialData.total_amount === 0 ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground text-lg">لا توجد بيانات مالية متاحة</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <PieChart
                        data={[
                          {
                            name: 'المبلغ المسدد',
                            value: financialData.total_paid
                          },
                          {
                            name: 'المبلغ المتبقي',
                            value: financialData.remaining_balance
                          }
                        ]}
                        title="الحالة المالية"
                        colors={['#3b82f6', '#eab308']}
                        height="300px"
                        donut={true}
                        loading={financialLoading}
                      />

                      {/* Financial Details Cards */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">المبلغ المسدد</p>
                              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {financialData.total_paid.toLocaleString()} ل.س
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {financialData.paid_percentage}%
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">المبلغ المتبقي</p>
                              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                {financialData.remaining_balance.toLocaleString()} ل.س
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {financialData.remaining_percentage}%
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Behavior Records Section */}
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <CardTitle>السجل السلوكي</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {behaviorLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-muted-foreground">جاري تحميل السجلات...</p>
                      </div>
                    </div>
                  ) : behaviorRecords.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground text-lg">لا توجد سجلات سلوكية</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {behaviorRecords.map((record) => {
                        // تحديد اللون حسب نوع السجل
                        const getRecordStyle = (type: string) => {
                          switch (type) {
                            case 'مشاغبة':
                              return 'border-orange-500 bg-orange-50 dark:bg-orange-950/20';
                            case 'مشاركة مميزة':
                              return 'border-green-500 bg-green-50 dark:bg-green-950/20';
                            case 'بطاقة شكر':
                              return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
                            case 'ملاحظة':
                              return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
                            case 'إنذار':
                              return 'border-red-500 bg-red-50 dark:bg-red-950/20';
                            case 'استدعاء ولي أمر':
                              return 'border-purple-500 bg-purple-50 dark:bg-purple-950/20';
                            case 'فصل':
                              return 'border-gray-700 bg-gray-100 dark:bg-gray-900/20';
                            default:
                              return 'border-gray-300 bg-gray-50 dark:bg-gray-900/20';
                          }
                        };

                        const getRecordTextColor = (type: string) => {
                          switch (type) {
                            case 'مشاغبة':
                              return 'text-orange-700 dark:text-orange-400';
                            case 'مشاركة مميزة':
                              return 'text-green-700 dark:text-green-400';
                            case 'بطاقة شكر':
                              return 'text-blue-700 dark:text-blue-400';
                            case 'ملاحظة':
                              return 'text-yellow-700 dark:text-yellow-400';
                            case 'إنذار':
                              return 'text-red-700 dark:text-red-400';
                            case 'استدعاء ولي أمر':
                              return 'text-purple-700 dark:text-purple-400';
                            case 'فصل':
                              return 'text-gray-900 dark:text-gray-300';
                            default:
                              return 'text-gray-700 dark:text-gray-400';
                          }
                        };

                        return (
                          <Card
                            key={record.id}
                            className={`border-l-4 ${getRecordStyle(record.record_type)}`}
                          >
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start mb-2">
                                <span className={`font-bold text-lg ${getRecordTextColor(record.record_type)}`}>
                                  {record.record_type}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(record.record_date).toLocaleDateString('ar-SY')}
                                </span>
                              </div>
                              <p className="text-muted-foreground mb-2">{record.description}</p>
                              <div className="text-xs text-muted-foreground">
                                سجل بواسطة: {record.created_by} • {new Date(record.created_at).toLocaleString('ar-SY')}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
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
