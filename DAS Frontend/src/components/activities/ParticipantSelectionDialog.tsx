import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { classesApi, studentsApi, activitiesApi } from '@/services/api';
import { Class, Student, Activity } from '@/types/school';
import { Search, Users, Check, X, Loader2, UserCheck, AlertCircle } from 'lucide-react';

interface ParticipantSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity;
  academicYearId: number;
  onSave: () => void;
}

export const ParticipantSelectionDialog: React.FC<ParticipantSelectionDialogProps> = ({
  open,
  onOpenChange,
  activity,
  academicYearId,
  onSave,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'classes' | 'students'>('classes');

  // Data
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<Set<number>>(new Set());
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Load data
  useEffect(() => {
    if (open && academicYearId) {
      loadData();
    }
  }, [open, academicYearId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load classes
      const classesResponse = await classesApi.getAll(academicYearId);
      if (classesResponse.success && classesResponse.data) {
        setClasses(classesResponse.data);
      }

      // Load students
      const studentsResponse = await studentsApi.getAll({ academic_year_id: academicYearId, is_active: true });
      if (studentsResponse.success && studentsResponse.data) {
        setStudents(studentsResponse.data);
      }

      // Load existing registrations
      const registrationsResponse = await activitiesApi.getRegistrations(activity.id!);
      if (registrationsResponse.success && registrationsResponse.data) {
        const registeredStudentIds = new Set(registrationsResponse.data.map((r: any) => r.student_id));
        setSelectedStudents(registeredStudentIds);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Group classes by grade level
  const groupedClasses = classes.reduce((acc, cls) => {
    const key = cls.grade_level;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(cls);
    return acc;
  }, {} as Record<string, Class[]>);

  // Get students for a class
  const getStudentsForClass = (classId: number) => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return [];
    
    return students.filter(
      (s) =>
        s.grade_level === cls.grade_level &&
        s.grade_number === cls.grade_number &&
        s.session_type === cls.session_type
    );
  };

  // Get all students from selected classes
  const getStudentsFromSelectedClasses = () => {
    const selectedClassesArray = Array.from(selectedClasses);
    const studentsInClasses = new Set<number>();
    
    selectedClassesArray.forEach((classId) => {
      const classStudents = getStudentsForClass(classId);
      classStudents.forEach((s) => studentsInClasses.add(s.id!));
    });
    
    return students.filter((s) => studentsInClasses.has(s.id!));
  };

  // Handle class selection
  const handleClassToggle = (classId: number) => {
    const newSelectedClasses = new Set(selectedClasses);
    if (newSelectedClasses.has(classId)) {
      newSelectedClasses.delete(classId);
      // Remove students from this class
      const classStudents = getStudentsForClass(classId);
      const newSelectedStudents = new Set(selectedStudents);
      classStudents.forEach((s) => newSelectedStudents.delete(s.id!));
      setSelectedStudents(newSelectedStudents);
    } else {
      newSelectedClasses.add(classId);
      // Add all students from this class
      const classStudents = getStudentsForClass(classId);
      const newSelectedStudents = new Set(selectedStudents);
      classStudents.forEach((s) => newSelectedStudents.add(s.id!));
      setSelectedStudents(newSelectedStudents);
    }
    setSelectedClasses(newSelectedClasses);
  };

  // Handle student toggle
  const handleStudentToggle = (studentId: number) => {
    const newSelectedStudents = new Set(selectedStudents);
    if (newSelectedStudents.has(studentId)) {
      newSelectedStudents.delete(studentId);
    } else {
      newSelectedStudents.add(studentId);
    }
    setSelectedStudents(newSelectedStudents);
  };

  // Handle select all students
  const handleSelectAll = () => {
    const classStudents = getStudentsFromSelectedClasses();
    const newSelectedStudents = new Set(selectedStudents);
    classStudents.forEach((s) => newSelectedStudents.add(s.id!));
    setSelectedStudents(newSelectedStudents);
  };

  // Handle deselect all students
  const handleDeselectAll = () => {
    const classStudents = getStudentsFromSelectedClasses();
    const newSelectedStudents = new Set(selectedStudents);
    classStudents.forEach((s) => newSelectedStudents.delete(s.id!));
    setSelectedStudents(newSelectedStudents);
  };

  // Filter students by search
  const filteredStudents = getStudentsFromSelectedClasses().filter((student) =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.father_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if max participants exceeded
  const isMaxExceeded = activity.max_participants && selectedStudents.size > activity.max_participants;

  // Handle save
  const handleSave = async () => {
    if (isMaxExceeded) {
      toast({
        title: 'خطأ',
        description: `عدد المشاركين المحددين (${selectedStudents.size}) يتجاوز الحد الأقصى (${activity.max_participants})`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // Create registrations for selected students
      const studentIds = Array.from(selectedStudents);
      const registrationPromises = studentIds.map((studentId) =>
        activitiesApi.createRegistration(activity.id!, {
          student_id: studentId,
          activity_id: activity.id!,
          registration_date: new Date().toISOString().split('T')[0],
          payment_status: 'pending',
          payment_amount: activity.cost_per_student,
        })
      );

      await Promise.all(registrationPromises);

      toast({
        title: 'نجاح',
        description: `تم تسجيل ${studentIds.length} طالب في النشاط`,
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving participants:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ المشاركين',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const gradeLevelLabels = {
    primary: 'ابتدائي',
    intermediate: 'إعدادي',
    secondary: 'ثانوي',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>إدارة المشاركين - {activity.name}</DialogTitle>
          <DialogDescription>
            اختر الصفوف والطلاب المشاركين في النشاط
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-sm">
                  <Users className="h-3 w-3 ml-1" />
                  {selectedStudents.size} مشارك محدد
                </Badge>
                {activity.max_participants && (
                  <Badge variant={isMaxExceeded ? 'destructive' : 'outline'} className="text-sm">
                    الحد الأقصى: {activity.max_participants}
                  </Badge>
                )}
              </div>
              {isMaxExceeded && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  تجاوز الحد الأقصى
                </div>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="classes">اختيار الصفوف</TabsTrigger>
                <TabsTrigger value="students">
                  ضبط الطلاب {selectedClasses.size > 0 && `(${selectedClasses.size} صف)`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="classes" className="flex-1 overflow-y-auto mt-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    اختر الصفوف المشاركة. سيتم تضمين جميع طلاب الصفوف المحددة.
                  </p>

                  {Object.entries(groupedClasses).map(([level, levelClasses]) => (
                    <Card key={level}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {gradeLevelLabels[level as keyof typeof gradeLevelLabels]}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {levelClasses.map((cls) => {
                          const classStudents = getStudentsForClass(cls.id!);
                          const isSelected = selectedClasses.has(cls.id!);
                          
                          return (
                            <div
                              key={cls.id}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted'
                              }`}
                              onClick={() => handleClassToggle(cls.id!)}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox checked={isSelected} onCheckedChange={() => handleClassToggle(cls.id!)} />
                                <div>
                                  <p className="font-medium">
                                    الصف {cls.grade_number} - {cls.session_type === 'morning' ? 'صباحي' : 'مسائي'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {classStudents.length} طالب
                                  </p>
                                </div>
                              </div>
                              {isSelected && <Check className="h-5 w-5 text-primary" />}
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ))}

                  {classes.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد صفوف في هذه السنة الدراسية</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="students" className="flex-1 overflow-y-auto mt-4">
                <div className="space-y-4">
                  {selectedClasses.size === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>يرجى اختيار صف واحد على الأقل من تبويب "اختيار الصفوف"</p>
                    </div>
                  ) : (
                    <>
                      {/* Search and Actions */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="البحث عن طالب..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10"
                          />
                        </div>
                        <Button variant="outline" size="sm" onClick={handleSelectAll}>
                          تحديد الكل
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                          إلغاء الكل
                        </Button>
                      </div>

                      {/* Students List */}
                      <div className="space-y-2">
                        {filteredStudents.map((student) => {
                          const isSelected = selectedStudents.has(student.id!);
                          
                          return (
                            <div
                              key={student.id}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted'
                              }`}
                              onClick={() => handleStudentToggle(student.id!)}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleStudentToggle(student.id!)}
                                />
                                <div>
                                  <p className="font-medium">{student.full_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {student.father_name} - الصف {student.grade_number} {student.section && `شعبة ${student.section}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {student.has_special_needs && (
                                  <Badge variant="outline" className="text-xs">
                                    احتياجات خاصة
                                  </Badge>
                                )}
                                {isSelected && <Check className="h-5 w-5 text-primary" />}
                              </div>
                            </div>
                          );
                        })}

                        {filteredStudents.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>لا توجد نتائج</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                <X className="h-4 w-4 ml-1" />
                إلغاء
              </Button>

              <Button onClick={handleSave} disabled={saving || selectedStudents.size === 0 || isMaxExceeded}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 ml-1" />
                    حفظ المشاركين ({selectedStudents.size})
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

