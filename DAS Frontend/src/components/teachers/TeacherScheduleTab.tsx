import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    BookOpen,
    Users,
    Plus,
    Trash2,
    Clock,
    Calendar as CalendarIcon,
    Save
} from 'lucide-react';
import { Teacher, Class, Subject, FreeTimeSlot } from '@/types/school';
import { teachersApi, classesApi, subjectsApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { FreeTimeSlotsCalendar } from '@/components/teachers/FreeTimeSlotsCalendar';

interface TeacherScheduleTabProps {
    teacher: Teacher;
    onUpdate: () => void;
}

// Helper function to get Arabic grade level name
const getGradeLevelLabel = (gradeLevel: string): string => {
    const labels: Record<string, string> = {
        'primary': 'الابتدائي',
        'intermediate': 'المتوسط',
        'secondary': 'الثانوي'
    };
    return labels[gradeLevel] || gradeLevel;
};

// Helper function to get Arabic grade name
const getGradeLabel = (gradeLevel: string, gradeNumber: number): string => {
    const levelLabel = getGradeLevelLabel(gradeLevel);
    return `${levelLabel} - الصف ${gradeNumber}`;
};

export const TeacherScheduleTab: React.FC<TeacherScheduleTabProps> = ({ teacher, onUpdate }) => {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showFreeTimeDialog, setShowFreeTimeDialog] = useState(false);
    const [freeTimeSlots, setFreeTimeSlots] = useState<FreeTimeSlot[]>([]);
    const [availableSections, setAvailableSections] = useState<string[]>([]);

    const [newAssignment, setNewAssignment] = useState({
        class_id: '',
        subject_id: '',
        section: ''
    });

    useEffect(() => {
        loadAssignments();
        loadClasses();
        
        // Initialize free time slots from teacher data
        if (teacher.free_time_slots && Array.isArray(teacher.free_time_slots)) {
            // Check if it's a 2D array (legacy) or 1D array (current)
            if (teacher.free_time_slots.length > 0 && Array.isArray(teacher.free_time_slots[0])) {
                // It's a 2D array, flatten it
                setFreeTimeSlots((teacher.free_time_slots as any).flat());
            } else {
                setFreeTimeSlots(teacher.free_time_slots as FreeTimeSlot[]);
            }
        } else {
            // Initialize empty grid (5 days x 6 periods)
            initializeEmptyFreeTimeSlots();
        }
        
        // Reset form when teacher changes
        setNewAssignment({ class_id: '', subject_id: '', section: '' });
        setSubjects([]);
        setAvailableSections([]);
    }, [teacher.id]);

    const initializeEmptyFreeTimeSlots = () => {
        const slots: FreeTimeSlot[] = [];
        for (let day = 0; day < 5; day++) { // Sunday to Thursday
            for (let period = 1; period <= 6; period++) {
                slots.push({ day, period, is_free: false }); // default to busy (gray)
            }
        }
        setFreeTimeSlots(slots);
    };

    const loadAssignments = async () => {
        try {
            const academicYearId = localStorage.getItem('selected_academic_year_id');
            const response = await teachersApi.getAssignments(teacher.id!, {
                academic_year_id: academicYearId ? parseInt(academicYearId) : undefined
            });

            if (response.success && response.data) {
                setAssignments(response.data);
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
        }
    };

    const loadClasses = async () => {
        try {
            const academicYearId = localStorage.getItem('selected_academic_year_id');
            const response = await classesApi.getAll({
                academic_year_id: academicYearId ? parseInt(academicYearId) : undefined,
                session_type: teacher.session_type
            });

            if (response.success && response.data) {
                setClasses(response.data);
            } else if (Array.isArray(response)) {
                setClasses(response);
            }
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    };

    const loadSubjectsForClass = async (classId: number) => {
        try {
            const academicYearId = localStorage.getItem('selected_academic_year_id');
            const response = await subjectsApi.getAll({
                class_id: classId,
                academic_year_id: academicYearId ? parseInt(academicYearId) : undefined
            });

            if (response.success && response.data) {
                setSubjects(response.data);
            } else if (Array.isArray(response)) {
                setSubjects(response);
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    };

    const handleAddAssignment = async () => {
        if (!newAssignment.class_id || !newAssignment.subject_id) {
            toast({
                title: "تحذير",
                description: "يرجى اختيار الصف والمادة",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const response = await teachersApi.assignSubject(teacher.id!, {
                class_id: parseInt(newAssignment.class_id),
                subject_id: parseInt(newAssignment.subject_id),
                section: newAssignment.section || undefined
            });

            if (response.success) {
                toast({
                    title: "نجاح",
                    description: "تم إضافة التوزيع بنجاح",
                });
                setShowAddDialog(false);
                setNewAssignment({ class_id: '', subject_id: '', section: '' });
                loadAssignments();
            }
        } catch (error: any) {
            toast({
                title: "خطأ",
                description: error.message || "فشل في إضافة التوزيع",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAssignment = async (assignmentId: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا التوزيع؟')) return;

        setLoading(true);
        try {
            const response = await teachersApi.removeAssignment(assignmentId);
            if (response.success) {
                toast({
                    title: "نجاح",
                    description: "تم حذف التوزيع بنجاح",
                });
                loadAssignments();
            }
        } catch (error) {
            toast({
                title: "خطأ",
                description: "فشل في حذف التوزيع",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFreeTimeSlots = async (slots: FreeTimeSlot[]) => {
        setLoading(true);
        try {
            const response = await teachersApi.update(teacher.id!, {
                free_time_slots: slots
            });

            if (response.success) {
                toast({
                    title: "نجاح",
                    description: "تم حفظ أوقات الفراغ بنجاح",
                });
                setFreeTimeSlots([slots]);
                setShowFreeTimeDialog(false);
                onUpdate();
            }
        } catch (error) {
            toast({
                title: "خطأ",
                description: "فشل في حفظ أوقات الفراغ",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Class & Subject Assignments */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            الصفوف والمواد
                        </CardTitle>
                        <Button
                            size="sm"
                            onClick={() => setShowAddDialog(true)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            إضافة توزيع
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {assignments.length > 0 ? (
                        <div className="space-y-3">
                            {assignments.map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {assignment.subject_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {assignment.class_name}
                                                {assignment.section && ` - شعبة ${assignment.section}`}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteAssignment(assignment.id)}
                                        disabled={loading}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            لا توجد توزيعات مضافة
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Free Time Slots */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            أوقات الفراغ
                        </CardTitle>
                        <Button
                            size="sm"
                            onClick={() => setShowFreeTimeDialog(true)}
                            className="gap-2"
                        >
                            <CalendarIcon className="h-4 w-4" />
                            تعديل أوقات الفراغ
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <FreeTimeSlotsCalendar
                        slots={freeTimeSlots}
                        readonly={true}
                    />
                </CardContent>
            </Card>

            {/* Add Assignment Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-[500px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>إضافة توزيع جديد</DialogTitle>
                        <DialogDescription>
                            اختر الصف والمادة التي يدرسها الأستاذ
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>الصف *</Label>
                            <Select
                                value={newAssignment.class_id}
                                onValueChange={(value) => {
                                    const selectedClass = classes.find(c => c.id?.toString() === value);
                                    setNewAssignment({ ...newAssignment, class_id: value, section: '' });
                                    loadSubjectsForClass(parseInt(value));
                                    
                                    // Generate available sections based on section_count
                                    if (selectedClass?.section_count) {
                                        const sections = [];
                                        const arabicLetters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'];
                                        for (let i = 0; i < selectedClass.section_count && i < arabicLetters.length; i++) {
                                            sections.push(arabicLetters[i]);
                                        }
                                        setAvailableSections(sections);
                                    } else {
                                        setAvailableSections([]);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الصف" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id!.toString()}>
                                            {getGradeLabel(cls.grade_level, cls.grade_number)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>المادة *</Label>
                            <Select
                                value={newAssignment.subject_id}
                                onValueChange={(value) =>
                                    setNewAssignment({ ...newAssignment, subject_id: value })
                                }
                                disabled={!newAssignment.class_id}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر المادة" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id!.toString()}>
                                            {subject.subject_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>الشعبة (اختياري)</Label>
                            <Select
                                value={newAssignment.section || 'all'}
                                onValueChange={(value) =>
                                    setNewAssignment({ ...newAssignment, section: value === 'all' ? '' : value })
                                }
                                disabled={!newAssignment.class_id || availableSections.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={availableSections.length > 0 ? "اختر الشعبة" : "اختر الصف أولاً"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">جميع الشعب</SelectItem>
                                    {availableSections.map((section) => (
                                        <SelectItem key={section} value={section}>
                                            {section}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={handleAddAssignment} disabled={loading}>
                            {loading ? 'جاري الإضافة...' : 'إضافة'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Free Time Slots Dialog */}
            <Dialog open={showFreeTimeDialog} onOpenChange={setShowFreeTimeDialog}>
                <DialogContent className="sm:max-w-[800px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تعديل أوقات الفراغ</DialogTitle>
                        <DialogDescription>
                            حدد الأوقات التي يكون فيها الأستاذ متاحاً (الأزرق = متاح، الرمادي = مشغول)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <FreeTimeSlotsCalendar
                            slots={freeTimeSlots}
                            readonly={false}
                            onSlotsChange={(slots) => setFreeTimeSlots(slots)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowFreeTimeDialog(false)}>
                            إلغاء
                        </Button>
                        <Button
                            onClick={() => handleSaveFreeTimeSlots(freeTimeSlots)}
                            disabled={loading}
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {loading ? 'جاري الحفظ...' : 'حفظ'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

