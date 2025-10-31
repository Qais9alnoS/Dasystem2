import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Calendar,
  Users,
  BookOpen,
  Loader2,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { schedulesApi } from '@/services/api';
import { ScheduleGenerationResult } from '@/types/backend';

interface IncompleteClassInfo {
  className: string;
  reason: string;
  missingItems: string[];
  suggestion: string;
}

interface ConflictInfo {
  type: 'teacher_conflict' | 'constraint_violation' | 'resource_conflict';
  description: string;
  affectedItems: string[];
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

interface ScheduleGeneratorProps {
  projectId: string;
  academicYearId: number;
  sessionType: 'morning' | 'evening';
  onScheduleGenerated?: (result: ScheduleGenerationResult) => void;
}

export const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({ 
  projectId,
  academicYearId,
  sessionType,
  onScheduleGenerated 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [lastResult, setLastResult] = useState<ScheduleGenerationResult | null>(null);

  // Generation steps based on backend process
  const generationSteps = [
    'تحليل البيانات المدخلة',
    'التحقق من صحة القيود',
    'تحديد المتطلبات لكل صف',
    'توزيع المعلمين على المواد',
    'إنشاء الجداول الأساسية',
    'تطبيق القيود والشروط',
    'حل التعارضات',
    'تحسين التوزيع',
    'التحقق النهائي',
    'حفظ النتائج'
  ];

  const handleGenerateSchedules = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentStep('');

    try {
      // Call the backend API to generate schedules
      const response = await schedulesApi.create({
        academic_year_id: academicYearId,
        session_type: sessionType,
        // Add other required fields as needed
      });

      if (response.success && response.data) {
        // Simulate step-by-step generation process for UI feedback
        for (let i = 0; i < generationSteps.length; i++) {
          setCurrentStep(generationSteps[i]);
          setGenerationProgress(((i + 1) / generationSteps.length) * 100);
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Process the response data to match our UI structure
        const processedResult: ScheduleGenerationResult = {
          success: response.data.success,
          generatedSchedules: response.data.generated_schedules?.length || 0,
          totalClasses: response.data.total_grades || 0,
          completedClasses: response.data.generated_schedules?.map(schedule => 
            `${schedule.grade_id} - ${schedule.division_id}`) || [],
          incompleteClasses: response.data.missing_data?.map(data => ({
            className: `${data.grade} - ${data.division}`,
            reason: data.reason,
            missingItems: data.required_actions || [],
            suggestion: data.suggestion || ''
          })) || [],
          conflicts: response.data.conflicts?.map(conflict => ({
            type: 'constraint_violation', // Map appropriately based on conflict type
            description: conflict.description,
            affectedItems: conflict.affected_items || [],
            severity: conflict.priority === 'عالي' ? 'high' : 
                     conflict.priority === 'متوسط' ? 'medium' : 'low',
            suggestion: conflict.suggestion || ''
          })) || [],
          generationTime: 0, // This would need to be provided by backend
          suggestions: response.data.conflicts?.map(conflict => conflict.suggestion || '') || []
        };

        setLastResult(processedResult);
        if (onScheduleGenerated) {
          onScheduleGenerated(response.data);
        }

        toast({
          title: "تم إنشاء الجداول بنجاح",
          description: "تم إنشاء جداول الصفوف بنجاح مع حل معظم التعارضات",
        });
      } else {
        throw new Error(response.message || 'فشل في إنشاء الجداول');
      }
    } catch (error: any) {
      console.error('Error generating schedules:', error);
      toast({
        title: "خطأ في إنشاء الجداول",
        description: error.message || "حدث خطأ أثناء إنشاء الجداول",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'teacher_conflict': return Users;
      case 'constraint_violation': return AlertTriangle;
      case 'resource_conflict': return Calendar;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Generation Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            إنشاء الجداول الدراسية
          </CardTitle>
          <CardDescription>
            إنشاء جداول تلقائية لجميع الصفوف والشعب مع مراعاة القيود والشروط
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isGenerating && !lastResult && (
            <div className="text-center py-8">
              <Play className="h-16 w-16 mx-auto mb-4 text-primary opacity-50" />
              <h3 className="text-lg font-medium mb-2">جاهز لإنشاء الجداول</h3>
              <p className="text-muted-foreground mb-4">
                انقر على الزر أدناه لبدء عملية إنشاء الجداول التلقائية
              </p>
              <Button onClick={handleGenerateSchedules} size="lg" className="gap-2">
                <Play className="h-5 w-5" />
                بدء إنشاء الجداول
              </Button>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                <h3 className="text-lg font-medium mb-2">جاري إنشاء الجداول...</h3>
                <p className="text-muted-foreground">{currentStep}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>التقدم</span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
                <Progress value={generationProgress} className="w-full" />
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                يرجى الانتظار، قد تستغرق العملية عدة دقائق...
              </div>
            </div>
          )}

          {!isGenerating && lastResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <h3 className="text-lg font-medium">تم إنشاء الجداول بنجاح</h3>
                    <p className="text-sm text-muted-foreground">
                      استغرقت العملية {lastResult.generationTime} ثانية
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleGenerateSchedules}>
                    <RefreshCw className="h-4 w-4 ml-1" />
                    إعادة إنشاء
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 ml-1" />
                    تصدير
                  </Button>
                  <Button size="sm">
                    <Eye className="h-4 w-4 ml-1" />
                    عرض الجداول
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {lastResult && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{lastResult.generatedSchedules}</p>
                <p className="text-sm text-muted-foreground">جدول مكتمل</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{lastResult.totalClasses}</p>
                <p className="text-sm text-muted-foreground">إجمالي الصفوف</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">{lastResult.incompleteClasses.length}</p>
                <p className="text-sm text-muted-foreground">صفوف ناقصة</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">{lastResult.conflicts.length}</p>
                <p className="text-sm text-muted-foreground">تعارضات</p>
              </CardContent>
            </Card>
          </div>

          {/* Incomplete Classes */}
          {lastResult.incompleteClasses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  الصفوف غير المكتملة ({lastResult.incompleteClasses.length})
                </CardTitle>
                <CardDescription>
                  الصفوف التي لم يتم إنشاء جداولها بسبب نقص المعلومات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lastResult.incompleteClasses.map((classInfo, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-orange-50">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-800">{classInfo.className}</h4>
                          <p className="text-sm text-orange-700 mt-1">{classInfo.reason}</p>
                          
                          <div className="mt-2">
                            <p className="text-xs font-medium text-orange-800 mb-1">المطلوب:</p>
                            <div className="flex flex-wrap gap-1">
                              {classInfo.missingItems.map((item, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs text-orange-700 border-orange-300">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-800">
                            <strong>الحل المقترح:</strong> {classInfo.suggestion}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-orange-700 border-orange-300">
                          إصلاح
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conflicts */}
          {lastResult.conflicts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  التعارضات المكتشفة ({lastResult.conflicts.length})
                </CardTitle>
                <CardDescription>
                  التعارضات التي تم اكتشافها أثناء عملية الجدولة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lastResult.conflicts.map((conflict, index) => {
                    const ConflictIcon = getConflictIcon(conflict.type);
                    return (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <ConflictIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{conflict.description}</h4>
                              <Badge variant={getSeverityColor(conflict.severity) as any} className="text-xs">
                                {conflict.severity === 'high' ? 'عالي' : 
                                 conflict.severity === 'medium' ? 'متوسط' : 'منخفض'}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-muted-foreground mb-2">
                              <strong>المتأثر:</strong> {conflict.affectedItems.join(', ')}
                            </div>
                            
                            <div className="p-2 bg-blue-50 rounded text-sm text-blue-800">
                              <strong>الحل المقترح:</strong> {conflict.suggestion}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            حل
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {lastResult.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  اقتراحات التحسين
                </CardTitle>
                <CardDescription>
                  اقتراحات لتحسين جودة الجداول في المرات القادمة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lastResult.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded bg-blue-50">
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm text-blue-800">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};