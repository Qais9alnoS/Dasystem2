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

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({ data, onContinue }) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (!validationResult) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>خطأ</AlertTitle>
        <AlertDescription>
          فشل تحميل نتائج التحقق. يرجى المحاولة مرة أخرى.
        </AlertDescription>
      </Alert>
    );
  }

  const completionPercentage = validationResult.summary.total_subjects > 0
    ? (validationResult.summary.teachers_with_sufficient_time / validationResult.summary.total_subjects) * 100
    : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Overall Status */}
      <Card className={
        validationResult.can_proceed
          ? validationResult.is_valid
            ? 'border-green-200 bg-green-50'
            : 'border-yellow-200 bg-yellow-50'
          : 'border-red-200 bg-red-50'
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{validationResult.summary.total_subjects}</p>
                <p className="text-xs text-muted-foreground">إجمالي المواد</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{validationResult.summary.subjects_with_teachers}</p>
                <p className="text-xs text-muted-foreground">لديها معلمين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{validationResult.summary.total_periods_needed}</p>
                <p className="text-xs text-muted-foreground">حصة مطلوبة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Errors */}
      {validationResult.errors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>أخطاء يجب إصلاحها</AlertTitle>
          <AlertDescription>
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
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900">تحذيرات</AlertTitle>
          <AlertDescription className="text-yellow-800">
            <ul className="list-disc list-inside space-y-1 mt-2">
              {validationResult.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Subject Details */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المواد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {validationResult.subject_details.map((subject, index) => (
              <div
                key={subject.subject_id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(subject.status)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{subject.subject_name}</h4>
                        {getStatusBadge(subject.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">الحصص المطلوبة:</span>
                          <span className="font-medium mr-1">{subject.required_periods} حصة/أسبوع</span>
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
                        <div className="p-3 bg-blue-50 rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span>عدد الحصص المطلوبة (هذه المادة):</span>
                            <span className="font-medium">{subject.required_periods} حصة أسبوعياً</span>
                          </div>
                          {subject.teacher_subjects_count && subject.teacher_subjects_count > 1 && (
                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-blue-200">
                              <span className="text-orange-700">إجمالي حصص المعلم (جميع المواد):</span>
                              <span className="font-bold text-orange-700">{subject.teacher_total_required} حصة أسبوعياً</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span>عدد أوقات الفراغ المحددة للمعلم:</span>
                            <span className="font-medium">{subject.available_slots}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1 pt-2 border-t border-blue-200">
                            <span className="font-medium">الحالة:</span>
                            <span className={subject.is_sufficient ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                              {subject.is_sufficient ? 'كافي ✓' : 'غير كافي ✗'}
                            </span>
                          </div>
                          {subject.teacher_subjects_count && subject.teacher_subjects_count > 1 && !subject.is_sufficient && (
                            <div className="mt-2 p-2 bg-orange-100 border border-orange-200 rounded text-xs text-orange-800">
                              <strong>ملاحظة:</strong> المعلم يدرس {subject.teacher_subjects_count} مواد ويحتاج إجمالي {subject.teacher_total_required} حصة، لكن لديه {subject.available_slots} فقط
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
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">اقتراحات</AlertTitle>
          <AlertDescription className="text-blue-800">
            <ul className="list-disc list-inside space-y-1 mt-2">
              {validationResult.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/teachers'}
        >
          إدارة المعلمين
        </Button>

        <div className="flex gap-2">
          {!validationResult.can_proceed && (
            <Button variant="secondary" onClick={validateSchedule}>
              إعادة التحقق
            </Button>
          )}
          <Button
            onClick={onContinue}
            disabled={!validationResult.can_proceed}
            size="lg"
          >
            {validationResult.can_proceed ? (
              <>
                <CheckCircle2 className="h-4 w-4 ml-2" />
                المتابعة لتحديد القيود
              </>
            ) : (
              'يجب إصلاح الأخطاء أولاً'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

