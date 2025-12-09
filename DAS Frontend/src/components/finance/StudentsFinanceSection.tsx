import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StudentFinanceCard } from './StudentFinanceCard';
import { StudentFinanceDetailModal } from './StudentFinanceDetailModal';
import { Search, Download, AlertCircle, Users } from 'lucide-react';
import { financeManagerApi } from '@/services/api';
import { StudentFinanceSummary } from '@/types/school';
import { useToast } from '@/hooks/use-toast';

interface StudentsFinanceSectionProps {
  academicYearId: number;
  preselectedStudentId?: number;
  openFinancePopup?: boolean;
  studentData?: any;
}

export const StudentsFinanceSection: React.FC<StudentsFinanceSectionProps> = ({
  academicYearId,
  preselectedStudentId,
  openFinancePopup,
  studentData
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentFinanceSummary[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDebtsDialog, setShowDebtsDialog] = useState(false);

  // Filters
  const [gradeLevel, setGradeLevel] = useState<string>('all');
  const [gradeNumber, setGradeNumber] = useState<string>('all');
  const [section, setSection] = useState<string>('all');
  const [sessionType, setSessionType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter options from database
  const [availableGradeNumbers, setAvailableGradeNumbers] = useState<number[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);

  useEffect(() => {
    if (academicYearId) {
      loadFilterOptions();
      loadStudents(); // تحميل الطلاب تلقائياً عند تحميل الصفحة
    }
  }, [academicYearId]);

  // Handle preselected student from search navigation
  useEffect(() => {
    if (preselectedStudentId && openFinancePopup) {

      // Open the detail modal for the preselected student
      setSelectedStudent(preselectedStudentId);
      setShowDetailModal(true);

      // Clear the navigation state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [preselectedStudentId, openFinancePopup, studentData]);

  // Update filter options when grade level changes
  useEffect(() => {
    if (academicYearId && gradeLevel) {
      loadFilterOptions();
    }
  }, [gradeLevel]);

  // Auto-set grade and section to 'all' when stage is 'all'
  useEffect(() => {
    if (gradeLevel === 'all') {
      setGradeNumber('all');
      setSection('all');
    }
  }, [gradeLevel]);

  const loadFilterOptions = async () => {
    try {
      const response = await financeManagerApi.getFilterOptions(academicYearId, gradeLevel);
      setAvailableGradeNumbers(response.data.grade_numbers);
      setAvailableSections(response.data.sections);
    } catch (error) {

    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const params: any = { academic_year_id: academicYearId };

      // Only add filters if they are not "all" and not empty
      if (gradeLevel && gradeLevel !== 'all' && gradeLevel !== '') {
        params.grade_level = gradeLevel;
      }
      if (gradeNumber && gradeNumber !== 'all' && gradeNumber !== '') {
        const num = parseInt(gradeNumber);
        if (!isNaN(num) && num > 0) {
          params.grade_number = num;
        }
      }
      if (section && section !== 'all' && section !== '') {
        params.section = section;
      }
      if (sessionType && sessionType !== 'all' && sessionType !== '') {
        params.session_type = sessionType;
      }

      const response = await financeManagerApi.getStudentsFinance(params);

      setStudents(response.data);
    } catch (error) {

      toast({
        title: 'خطأ',
        description: 'فشل تحميل بيانات الطلاب',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (studentId: number) => {
    setSelectedStudent(studentId);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedStudent(null);
  };

  const handleUpdateStudent = () => {
    loadStudents();
  };

  const handleImport = () => {
    loadStudents();
    toast({
      title: 'نجح',
      description: 'تم استيراد الطلاب بنجاح'
    });
  };

  const studentsWithBalance = students.filter(s => s.has_outstanding_balance);
  // جمع الأرصدة الموجبة فقط (الديون الفعلية)
  const totalOutstanding = students.reduce((sum, s) => {
    const balance = Number(s.balance) || 0;
    return sum + (balance > 0 ? balance : 0); // نجمع فقط الأرصدة الموجبة
  }, 0);

  // Filter students by search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.full_name.toLowerCase().includes(query) ||
      student.father_name.toLowerCase().includes(query) ||
      (student.father_phone && student.father_phone.includes(query)) ||
      (student.mother_phone && student.mother_phone.includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            معلومات المالية (طلاب)
          </h1>
          <p className="text-muted-foreground mt-1">إدارة المعلومات المالية للطلاب</p>
        </div>
      </div>

      {/* Filters Panel */}
      <Card className="ios-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>المرحلة</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المرحلة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="primary">ابتدائي</SelectItem>
                  <SelectItem value="intermediate">إعدادي</SelectItem>
                  <SelectItem value="secondary">ثانوي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>الصف</Label>
              <Select
                value={gradeNumber}
                onValueChange={setGradeNumber}
                disabled={gradeLevel === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {availableGradeNumbers.map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>الشعبة</Label>
              <Select
                value={section}
                onValueChange={setSection}
                disabled={gradeLevel === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشعبة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {availableSections.map(sec => (
                    <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>الفترة</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفترة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="morning">نهاري</SelectItem>
                  <SelectItem value="evening">مسائي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleImport} variant="default" className="flex-1">
              <Search className="w-4 h-4 ml-2" />
              استيراد الطلاب
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 ml-2" />
              تصدير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <Card className="ios-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن طالب بالاسم، اسم الأب، أو رقم الهاتف..."
              className="pr-12"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="ios-card">
            <CardContent className="pt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي الطلاب</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {filteredStudents.length} {searchQuery && `من ${students.length}`}
              </div>
            </CardContent>
          </Card>
          <Card className="ios-card">
            <CardContent className="pt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">طلاب لديهم ديون</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{studentsWithBalance.length}</div>
            </CardContent>
          </Card>
          <Card
            className="ios-card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowDebtsDialog(true)}
          >
            <CardContent className="pt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                إجمالي الديون
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {totalOutstanding.toLocaleString('ar-SY')} ل.س
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                اضغط لعرض التفاصيل
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Students Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">جاري التحميل...</div>
      ) : students.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            لا يوجد طلاب. قم بتحديد الفلاتر والضغط على "استيراد الطلاب".
          </AlertDescription>
        </Alert>
      ) : filteredStudents.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            لا توجد نتائج مطابقة لبحثك "{searchQuery}". جرب كلمات مختلفة.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents
            .sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'))
            .map((student) => (
              <StudentFinanceCard
                key={student.student_id}
                student={student}
                onClick={() => handleStudentClick(student.student_id)}
              />
            ))}
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentFinanceDetailModal
          open={showDetailModal}
          onClose={handleCloseModal}
          studentId={selectedStudent}
          academicYearId={academicYearId}
          onUpdate={handleUpdateStudent}
        />
      )}

      {/* Debts Details Dialog */}
      <Dialog open={showDebtsDialog} onOpenChange={setShowDebtsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-orange-600" />
              تفاصيل الديون المستحقة
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Summary */}
            <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">عدد الطلاب</div>
                    <div className="text-3xl font-bold text-orange-600">{studentsWithBalance.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي المبلغ</div>
                    <div className="text-3xl font-bold text-orange-600">
                      {totalOutstanding.toLocaleString('ar-SY')} ل.س
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Students List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">قائمة الطلاب:</h3>
              {studentsWithBalance.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    لا يوجد طلاب لديهم ديون مستحقة
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {studentsWithBalance
                    .sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0)) // ترتيب من الأكبر للأصغر
                    .map((student, index) => (
                      <Card
                        key={student.student_id}
                        className="ios-card hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setShowDebtsDialog(false);
                          handleStudentClick(student.student_id);
                        }}
                      >
                        <CardContent className="pt-4 pb-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                  {student.full_name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {student.grade_level_display} - {student.grade_number} - شعبة {student.section}
                                </div>
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="text-xl font-bold text-orange-600">
                                {(Number(student.balance) || 0).toLocaleString('ar-SY')} ل.س
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                مدفوع: {(Number(student.total_paid) || 0).toLocaleString('ar-SY')}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsFinanceSection;

