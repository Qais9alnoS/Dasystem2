import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  User,
  BookOpen,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { schedulesApi } from '@/services/api';

interface ValidationFeedbackProps {
  data: {
    academicYearId: number;
    classId: number;
    section: string;
    sessionType: string;
  };
  onContinue: () => void;
  onValidationChange?: (canProceed: boolean) => void;
}

interface SubjectDetail {
  subject_id: number;
  subject_name: string;
  required_periods: number;
  has_teacher: boolean;
  teacher_id?: number;
  teacher_name?: string;
  available_slots?: number;
  teacher_total_required?: number;
  teacher_subjects_count?: number;
  is_sufficient?: boolean;
  teacher_availability: string;
  teacher_has_free_slots_per_timeslot?: boolean; // New field
  missing_timeslots?: string[]; // Days/periods where no teacher is free
  status: string;
}

interface ValidationResult {
  is_valid: boolean;
  can_proceed: boolean;
  has_warnings: boolean;
  errors: string[];
  warnings: string[];
  missing_items: string[];
  suggestions: string[];
  summary: {
    total_subjects: number;
    subjects_with_teachers: number;
    teachers_with_sufficient_time: number;
    total_periods_needed: number;
    unassigned_count: number;
    insufficient_availability_count: number;
  };
  subject_details: SubjectDetail[];
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({ data, onContinue, onValidationChange }) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSignaledReady, setHasSignaledReady] = useState(false);

  useEffect(() => {
    validateSchedule();
  }, [data]);

  const validateSchedule = async () => {
    setLoading(true);
    try {
      const response = await schedulesApi.validate({
        academic_year_id: data.academicYearId,
        class_id: data.classId,
        section: data.section,
        session_type: data.sessionType
      });

      if (response.success && response.data) {
        setValidationResult(response.data);
      } else {
        throw new Error('فشل التحقق من المتطلبات');
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء التحقق',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Notify parent whenever validation status changes
  useEffect(() => {
    if (!validationResult) return;
    
    // Always notify parent of current validation status
    if (onValidationChange) {
      onValidationChange(validationResult.can_proceed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validationResult]);

  // Automatically notify parent when validation allows proceeding
  useEffect(() => {
    if (!validationResult) return;
    
    // If validation fails, reset the ready state
    if (!validationResult.can_proceed) {
      if (hasSignaledReady) {
        setHasSignaledReady(false);
      }
      return;
    }
    
    // If validation passes and we haven't signaled yet, notify parent
    if (!hasSignaledReady) {
      onContinue();
      setHasSignaledReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validationResult, hasSignaledReady]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-green-100 text-green-800 border-green-200">جاهز</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">تحذير</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">خطأ</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  const getAvailabilityBadge = (availability: string, isSufficient?: boolean) => {
    if (availability === 'not_assigned' || availability === 'teacher_not_found') {
      return <Badge variant="destructive">غير معين</Badge>;
    }
    
    if (isSufficient) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">كافي</Badge>;
    }
    
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">غير كافي</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري التحقق من المتطلبات...</p>
        </div>
      </div>
    );
  }

  if (!validationResult || !validationResult.summary) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>خطأ</AlertTitle>
        <AlertDescription>
          فشل تحميل نتائج التحقق. قد تكون البيانات غير صالحة أو السنة الدراسية محذوفة. يرجى المحاولة مرة أخرى.
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate percentage considering both subject-level and system-level checks
  const completionPercentage = (() => {
    if (!validationResult.summary || validationResult.summary.total_subjects === 0) return 0;
    
    // Subject-level: percentage of subjects with sufficient teacher availability
    const subjectReadiness = 
      (validationResult.summary.teachers_with_sufficient_time / validationResult.summary.total_subjects) * 100;
    
    // System-level: check for critical validation errors that block schedule generation
    // These are errors that prevent can_proceed from being true
    const hasCriticalErrors = !validationResult.can_proceed;
    
    // If there are critical errors (like exclusive period conflicts, missing teachers in slots, etc.)
    // reduce the percentage significantly since the schedule cannot be generated
    if (hasCriticalErrors) {
      // Apply a penalty: percentage is at most 50% if critical errors exist
      // This ensures errors like "فترة حصرية زائدة" are reflected in the percentage
      return Math.min(subjectReadiness * 0.5, 50);
    }
    
    return subjectReadiness;
  })();

  return (
    <div className="space-y-6" dir="rtl">
      {/* Overall Status */}
      <Card className={
        validationResult.can_proceed
          ? validationResult.is_valid
            ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40'
            : 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20'
          : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40'
      }>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {validationResult.can_proceed ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <span>
                {validationResult.can_proceed
                  ? validationResult.is_valid
                    ? 'جاهز للإنشاء'
                    : 'يمكن المتابعة مع تحذيرات'
                  : 'غير جاهز - يوجد أخطاء'}
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">نسبة الجاهزية:</span>
              <span className="text-sm font-medium">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-900 border dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{validationResult.summary.total_subjects}</p>
                <p className="text-xs text-muted-foreground">إجمالي المواد</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <User className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(validationResult.subject_details.filter(s => s.has_teacher).map(s => s.teacher_id)).size}
                </p>
                <p className="text-xs text-muted-foreground">معلمين مكلفين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{validationResult.summary.total_periods_needed}</p>
                <p className="text-xs text-muted-foreground">حصة مطلوبة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Errors */}
      {validationResult.errors.length > 0 && (
        <Alert variant="destructive" className="dark:bg-red-950/30 dark:border-red-900">
          <XCircle className="h-4 w-4 dark:text-red-300" />
          <AlertTitle className="dark:text-red-100">أخطاء يجب إصلاحها</AlertTitle>
          <AlertDescription className="dark:text-red-200">
            <ul className="list-disc list-inside space-y-1 mt-2">
              {validationResult.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {validationResult.warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
          <AlertTitle className="text-yellow-900 dark:text-yellow-100">تحذيرات</AlertTitle>
          <AlertDescription className="text-yellow-800 dark:text-yellow-100">
            <ul className="list-disc list-inside space-y-1 mt-2">
              {validationResult.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Subject Details */}
      <Card className="bg-white dark:bg-slate-900 border dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-foreground">تفاصيل المواد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {validationResult.subject_details.map((subject, index) => (
              <div
                key={subject.subject_id}
                className="p-4 border rounded-lg hover:bg-muted/50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(subject.status)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{subject.subject_name}</h4>
                        {getStatusBadge(subject.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">الحصص المطلوبة:</span>
                          <span className="font-medium mr-1 text-foreground">{subject.required_periods} حصة/أسبوع</span>
                        </div>
                        
                        {subject.has_teacher ? (
                          <>
                            <div>
                              <span className="text-muted-foreground">المعلم:</span>
                              <span className="font-medium mr-1">{subject.teacher_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">التوفر:</span>
                              {getAvailabilityBadge(subject.teacher_availability, subject.is_sufficient)}
                            </div>
                          </>
                        ) : (
                          <div className="col-span-2">
                            <Badge variant="destructive">لا يوجد معلم معين</Badge>
                          </div>
                        )}
                      </div>

                      {subject.has_teacher && subject.available_slots !== undefined && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span>عدد الحصص المطلوبة (هذه المادة):</span>
                            <span className="font-medium">{subject.required_periods} حصة أسبوعياً</span>
                          </div>
                          {subject.teacher_subjects_count && subject.teacher_subjects_count > 1 && (
                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-blue-200 dark:border-blue-800">
                              <span className="text-orange-700 dark:text-orange-300">إجمالي حصص المعلم (جميع المواد):</span>
                              <span className="font-bold text-orange-700 dark:text-orange-300">{subject.teacher_total_required} حصة أسبوعياً</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span>عدد أوقات الفراغ المحددة للمعلم:</span>
                            <span className="font-medium">{subject.available_slots}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1 pt-2 border-t border-blue-200 dark:border-blue-800">
                            <span className="font-medium">الحالة:</span>
                            <span className={subject.is_sufficient ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                              {subject.is_sufficient ? 'كافي ✓' : 'غير كافي ✗'}
                            </span>
                          </div>
                          {subject.teacher_subjects_count && subject.teacher_subjects_count > 1 && !subject.is_sufficient && (
                            <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded text-xs text-orange-800 dark:text-orange-200">
                              <strong>ملاحظة:</strong> المعلم يدرس {subject.teacher_subjects_count} مواد ويحتاج إجمالي {subject.teacher_total_required} حصة، لكن لديه {subject.available_slots} فقط
                            </div>
                          )}
                          {subject.missing_timeslots && subject.missing_timeslots.length > 0 && (
                            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                              <strong>تحذير:</strong> المعلم غير متاح في الأوقات التالية: {subject.missing_timeslots.join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {validationResult.suggestions.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-300" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">اقتراحات</AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-100">
            <ul className="list-disc list-inside space-y-1 mt-2">
              {validationResult.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons (بدون تغيير للخطوة، فقط إجراءات مساعدة) */}
      {!validationResult.can_proceed && (
        <div className="flex justify-end items-center pt-4 border-t">
          <Button variant="secondary" onClick={validateSchedule}>
            إعادة التحقق
          </Button>
        </div>
      )}
    </div>
  );
};

