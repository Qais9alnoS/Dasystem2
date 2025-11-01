import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, BookOpen, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IOSList, IOSListItem, IOSListHeader } from '@/components/ui/ios-list';
import { api } from '@/services/api';
import type { Class, Subject, AcademicYear, Student, SessionType, GradeLevel } from '@/types/school';
import { toast } from '@/hooks/use-toast';
import { defaultGradeTemplates, getGradeLabel, getSectionLabel } from '@/lib/defaultSchoolData';

const SchoolInfoManagementPage = () => {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Class form state
  const [classForm, setClassForm] = useState({
    session_type: 'morning' as 'morning' | 'evening',
    grade_level: 'primary' as 'primary' | 'intermediate' | 'secondary',
    grade_number: 1,
    section_count: 1,
    max_students_per_section: 30,
  });

  // Subject form state
  const [subjectForm, setSubjectForm] = useState({
    subject_name: '',
    weekly_hours: 1,
  });

  useEffect(() => {
    // Load selected academic year from localStorage
    const yearId = localStorage.getItem('selected_academic_year_id');
    if (yearId) {
      const parsedId = parseInt(yearId, 10);
      if (!isNaN(parsedId)) {
        setSelectedAcademicYear(parsedId);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedAcademicYear) {
      loadClasses();
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    if (selectedClass) {
      loadSubjects();
      loadStudentsCount();
    }
  }, [selectedClass]);


  const loadClasses = async () => {
    if (!selectedAcademicYear) return;
    
    try {
      setLoading(true);
      const response = await api.academic.getClasses(selectedAcademicYear);
      const allClasses = Array.isArray(response) ? response : (response?.data || []);
      setClasses(allClasses);
    } catch (error) {
      console.error('Failed to load classes:', error);
      setClasses([]);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الصفوف',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    if (!selectedClass) return;
    
    try {
      const response = await api.academic.getSubjects(selectedClass.id);
      const classSubjects = Array.isArray(response) ? response : (response?.data || []);
      setSubjects(classSubjects);
    } catch (error) {
      console.error('Failed to load subjects:', error);
      setSubjects([]);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل المواد',
        variant: 'destructive',
      });
    }
  };

  const loadStudentsCount = async () => {
    if (!selectedClass || !selectedAcademicYear) return;
    
    try {
      const response = await api.students.getAll({
        academic_year_id: selectedAcademicYear,
        grade_level: selectedClass.grade_level,
        grade_number: selectedClass.grade_number,
      });
      const allStudents = Array.isArray(response) ? response : (response?.data || []);
      setStudents(allStudents);
    } catch (error) {
      console.error('Failed to load students:', error);
      setStudents([]);
    }
  };

  const handleCreateDefaultClasses = async () => {
    if (!selectedAcademicYear) return;

    try {
      setLoading(true);
      
      for (const template of defaultGradeTemplates) {
        const classData = {
          academic_year_id: selectedAcademicYear,
          session_type: 'morning' as SessionType,
          grade_level: template.grade_level as GradeLevel,
          grade_number: template.grade_number,
          section_count: template.default_section_count,
          max_students_per_section: template.max_students_per_section || 30,
        };

        // Create class
        const createdClassResponse = await api.classes.create(classData);
        console.log('Created class response:', createdClassResponse);
        
        // Extract class from response
        const createdClass = createdClassResponse.data;
        if (!createdClass || !createdClass.id) {
          throw new Error('Failed to create class: Invalid response');
        }
        
        const classId = createdClass.id;
        console.log('Extracted class ID:', classId);

        // Create default subjects for this class
        for (const subject of template.subjects) {
          const subjectData = {
            class_id: classId,
            subject_name: subject.name,
            weekly_hours: subject.weekly_hours,
            is_active: true,
          };
          console.log('Creating subject with data:', subjectData);
          
          try {
            await api.subjects.create(subjectData);
          } catch (subjectError: any) {
            console.error('Failed to create subject:', subjectError);
            console.error('Subject data:', subjectData);
            console.error('Error response:', subjectError.response?.data);
            throw subjectError;
          }
        }
      }

      toast({
        title: 'نجح',
        description: 'تم إنشاء الصفوف والمواد الافتراضية بنجاح',
      });

      loadClasses();
    } catch (error: any) {
      console.error('Full error:', error);
      toast({
        title: 'خطأ',
        description: error.response?.data?.detail || error.message || 'فشل في إنشاء الصفوف الافتراضية',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAcademicYear) return;

    try {
      setLoading(true);

      if (editingClass) {
        // Include academic_year_id when updating
        await api.classes.update(editingClass.id, {
          academic_year_id: selectedAcademicYear,
          session_type: classForm.session_type as SessionType,
          grade_level: classForm.grade_level as GradeLevel,
          grade_number: classForm.grade_number,
          section_count: classForm.section_count,
          max_students_per_section: classForm.max_students_per_section,
        });
        toast({
          title: 'نجح',
          description: 'تم تحديث الصف بنجاح',
        });
      } else {
        await api.classes.create({
          academic_year_id: selectedAcademicYear,
          session_type: classForm.session_type as SessionType,
          grade_level: classForm.grade_level as GradeLevel,
          grade_number: classForm.grade_number,
          section_count: classForm.section_count,
          max_students_per_section: classForm.max_students_per_section,
        });
        toast({
          title: 'نجح',
          description: 'تم إضافة الصف بنجاح',
        });
      }

      setIsClassDialogOpen(false);
      setEditingClass(null);
      resetClassForm();
      loadClasses();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حفظ الصف',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصف؟ سيتم حذف جميع المواد المرتبطة به.')) return;

    try {
      await api.classes.delete(classId);
      toast({
        title: 'نجح',
        description: 'تم حذف الصف بنجاح',
      });
      loadClasses();
      if (selectedClass?.id === classId) {
        setSelectedClass(null);
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الصف',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      setLoading(true);

      if (editingSubject) {
        await api.subjects.update(editingSubject.id, {
          ...subjectForm,
          class_id: selectedClass.id,
          is_active: true,
        });
        toast({
          title: 'نجح',
          description: 'تم تحديث المادة بنجاح',
        });
      } else {
        await api.subjects.create({
          ...subjectForm,
          class_id: selectedClass.id,
          is_active: true,
        });
        toast({
          title: 'نجح',
          description: 'تم إضافة المادة بنجاح',
        });
      }

      setIsSubjectDialogOpen(false);
      setEditingSubject(null);
      resetSubjectForm();
      loadSubjects();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حفظ المادة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;

    try {
      await api.subjects.delete(subjectId);
      toast({
        title: 'نجح',
        description: 'تم حذف المادة بنجاح',
      });
      loadSubjects();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المادة',
        variant: 'destructive',
      });
    }
  };

  const resetClassForm = () => {
    setClassForm({
      session_type: 'morning',
      grade_level: 'primary',
      grade_number: 1,
      section_count: 1,
      max_students_per_section: 30,
    });
  };

  const resetSubjectForm = () => {
    setSubjectForm({
      subject_name: '',
      weekly_hours: 1,
    });
  };

  const getStudentCountBySection = (section: string): number => {
    return students.filter(s => s.section === section).length;
  };

  const getTotalWeeklyHours = (): number => {
    return subjects.reduce((sum, subject) => sum + subject.weekly_hours, 0);
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة معلومات المدرسة</h1>
            <p className="text-muted-foreground mt-1">إدارة الصفوف والشعب والمواد الدراسية</p>
          </div>
        </div>

        {/* Quick Action for Creating Default Classes */}
        {selectedAcademicYear && (
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleCreateDefaultClasses}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Plus className="ml-2 h-4 w-4" />
                إنشاء الصفوف الافتراضية
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Classes Management */}
        {selectedAcademicYear && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classes List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>الصفوف</CardTitle>
                    <CardDescription>{classes.length} صف في هذه السنة</CardDescription>
                  </div>
                  <Dialog open={isClassDialogOpen} onOpenChange={(open) => {
                    setIsClassDialogOpen(open);
                    if (!open) {
                      setEditingClass(null);
                      resetClassForm();
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="ml-2 h-4 w-4" />
                        إضافة صف
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl">
                      <DialogHeader>
                        <DialogTitle>{editingClass ? 'تعديل الصف' : 'إضافة صف جديد'}</DialogTitle>
                        <DialogDescription>أدخل معلومات الصف</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSaveClass} className="space-y-4">
                        <div className="space-y-2">
                          <Label>نوع الجلسة</Label>
                          <Select
                            value={classForm.session_type}
                            onValueChange={(value: 'morning' | 'evening') => 
                              setClassForm({ ...classForm, session_type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="morning">صباحي</SelectItem>
                              <SelectItem value="evening">مسائي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>المرحلة</Label>
                          <Select
                            value={classForm.grade_level}
                            onValueChange={(value: 'primary' | 'intermediate' | 'secondary') => 
                              setClassForm({ ...classForm, grade_level: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="primary">ابتدائي</SelectItem>
                              <SelectItem value="intermediate">إعدادي</SelectItem>
                              <SelectItem value="secondary">ثانوي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>رقم الصف</Label>
                          <Input
                            type="number"
                            min="1"
                            max={classForm.grade_level === 'primary' ? 6 : 3}
                            value={classForm.grade_number}
                            onChange={(e) => setClassForm({ ...classForm, grade_number: parseInt(e.target.value) })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>عدد الشعب</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={classForm.section_count}
                            onChange={(e) => setClassForm({ ...classForm, section_count: parseInt(e.target.value) })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>الحد الأقصى للطلاب في كل شعبة</Label>
                          <Input
                            type="number"
                            min="1"
                            value={classForm.max_students_per_section}
                            onChange={(e) => setClassForm({ ...classForm, max_students_per_section: parseInt(e.target.value) })}
                            required
                          />
                        </div>

                        <div className="flex gap-3 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsClassDialogOpen(false)}
                          >
                            إلغاء
                          </Button>
                          <Button type="submit" disabled={loading}>
                            {loading ? 'جاري الحفظ...' : 'حفظ'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <IOSList>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
                  ) : classes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد صفوف. اضغط على "إنشاء الصفوف الافتراضية" أو "إضافة صف".
                    </div>
                  ) : (
                    classes.map((cls) => {
                      const studentsInClass = students.filter(
                        s => s.grade_level === cls.grade_level && s.grade_number === cls.grade_number
                      );
                      const isSelected = selectedClass?.id === cls.id;

                      return (
                        <IOSListItem
                          key={cls.id}
                          onClick={() => setSelectedClass(cls)}
                          className={isSelected ? 'bg-primary/10' : ''}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <p className="font-medium">
                                {getGradeLabel(cls.grade_level, cls.grade_number)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {cls.session_type === 'morning' ? 'صباحي' : 'مسائي'} • 
                                {cls.section_count} {cls.section_count === 1 ? 'شعبة' : 'شعب'} • 
                                {studentsInClass.length} طالب
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingClass(cls);
                                  setClassForm({
                                    session_type: cls.session_type,
                                    grade_level: cls.grade_level,
                                    grade_number: cls.grade_number,
                                    section_count: cls.section_count,
                                    max_students_per_section: cls.max_students_per_section || 30,
                                  });
                                  setIsClassDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClass(cls.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </IOSListItem>
                      );
                    })
                  )}
                </IOSList>
              </CardContent>
            </Card>

            {/* Class Details & Subjects */}
            {selectedClass && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {getGradeLabel(selectedClass.grade_level, selectedClass.grade_number)}
                      </CardTitle>
                      <CardDescription>
                        المواد الدراسية • المجموع: {getTotalWeeklyHours()} حصة
                      </CardDescription>
                    </div>
                    <Dialog open={isSubjectDialogOpen} onOpenChange={(open) => {
                      setIsSubjectDialogOpen(open);
                      if (!open) {
                        setEditingSubject(null);
                        resetSubjectForm();
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="ml-2 h-4 w-4" />
                          إضافة مادة
                        </Button>
                      </DialogTrigger>
                      <DialogContent dir="rtl">
                        <DialogHeader>
                          <DialogTitle>{editingSubject ? 'تعديل المادة' : 'إضافة مادة جديدة'}</DialogTitle>
                          <DialogDescription>أدخل معلومات المادة</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveSubject} className="space-y-4">
                          <div className="space-y-2">
                            <Label>اسم المادة</Label>
                            <Input
                              value={subjectForm.subject_name}
                              onChange={(e) => setSubjectForm({ ...subjectForm, subject_name: e.target.value })}
                              placeholder="مثال: الرياضيات"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>عدد الحصص الأسبوعية</Label>
                            <Input
                              type="number"
                              min="1"
                              max="15"
                              value={subjectForm.weekly_hours}
                              onChange={(e) => setSubjectForm({ ...subjectForm, weekly_hours: parseInt(e.target.value) })}
                              required
                            />
                          </div>

                          <div className="flex gap-3 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsSubjectDialogOpen(false)}
                            >
                              إلغاء
                            </Button>
                            <Button type="submit" disabled={loading}>
                              {loading ? 'جاري الحفظ...' : 'حفظ'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Section Info */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      توزيع الطلاب حسب الشعب
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Array.from({ length: selectedClass.section_count }).map((_, index) => {
                        const sectionLabel = getSectionLabel(index);
                        const studentCount = getStudentCountBySection(sectionLabel);
                        const maxStudents = selectedClass.max_students_per_section || 30;
                        const percentage = (studentCount / maxStudents) * 100;

                        return (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">الشعبة {sectionLabel}</span>
                              <span className="text-sm text-muted-foreground">
                                {studentCount}/{maxStudents}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  percentage > 90 ? 'bg-destructive' : percentage > 70 ? 'bg-yellow-500' : 'bg-primary'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subjects List */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      المواد الدراسية ({subjects.length})
                    </h3>
                    <IOSList>
                      {subjects.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          لا توجد مواد. اضغط على "إضافة مادة" لإضافة مادة جديدة.
                        </div>
                      ) : (
                        subjects.map((subject) => (
                          <IOSListItem key={subject.id}>
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <p className="font-medium">{subject.subject_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {subject.weekly_hours} {subject.weekly_hours === 1 ? 'حصة' : 'حصص'} أسبوعياً
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingSubject(subject);
                                    setSubjectForm({
                                      subject_name: subject.subject_name,
                                      weekly_hours: subject.weekly_hours,
                                    });
                                    setIsSubjectDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteSubject(subject.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </IOSListItem>
                        ))
                      )}
                    </IOSList>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolInfoManagementPage;

