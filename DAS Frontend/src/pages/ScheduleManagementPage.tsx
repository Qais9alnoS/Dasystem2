import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Filter,
  CheckCircle2,
  Settings,
  BookOpen,
  Users,
  Download,
  Eye,
  Plus,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import {
  ScheduleFilters,
  ValidationFeedback,
  ConstraintManager,
  WeeklyScheduleGrid,
  ConflictResolver,
  ScheduleExporter,
  SavedSchedulesViewer
} from '@/components/schedule';
import { ScheduleGenerator } from '@/components/schedule/ScheduleGenerator';
import { toast } from '@/hooks/use-toast';
import { schedulesApi, subjectsApi, teachersApi } from '@/services/api';
import * as api from '@/services/api';

interface ScheduleData {
  academicYearId: number;
  sessionType: string;
  gradeLevel: string;
  gradeNumber: number;
  classId: number;
  section: string;
}

type Step = 'filter' | 'validate' | 'constraints' | 'generate' | 'view' | 'conflicts' | 'export';

interface StepConfig {
  id: Step;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
}

const AUTOSAVE_KEY = 'schedule_creation_autosave';

export const ScheduleManagementPage: React.FC = () => {
  const location = useLocation();
  const filterSectionRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [currentStep, setCurrentStep] = useState<Step>('filter');
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [generatedScheduleId, setGeneratedScheduleId] = useState<number | null>(null);
  const [scheduleAssignments, setScheduleAssignments] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const generationRequestRef = useRef<any | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [showExporter, setShowExporter] = useState(false);
  const [showConflictResolver, setShowConflictResolver] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  // Step configuration
  const [stepStatus, setStepStatus] = useState<Record<Step, boolean>>({
    filter: false,
    validate: false,
    constraints: false,
    generate: false,
    view: false,
    conflicts: false,
    export: false
  });

  // Check if we should scroll to class selection from navigation state
  useEffect(() => {
    if (location.state?.scrollToClassSelection) {
      // Ensure we're on the create tab and filter step
      setActiveTab('create');
      setCurrentStep('filter');
      
      // Scroll to filter section after a short delay
      setTimeout(() => {
        filterSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      
      // Clear the state to prevent re-scrolling on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Load autosaved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(AUTOSAVE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.scheduleData) {
          setScheduleData(parsed.scheduleData);
        }
        if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
        }
        if (parsed.stepStatus) {
          setStepStatus(parsed.stepStatus);
        }
        if (parsed.previewData) {
          setPreviewData(parsed.previewData);
        }
        if (parsed.scheduleAssignments) {
          setScheduleAssignments(parsed.scheduleAssignments);
        }
        if (parsed.generationRequest) {
          generationRequestRef.current = parsed.generationRequest;
        }
        if (parsed.isPreviewMode) {
          setIsPreviewMode(parsed.isPreviewMode);
        }
      } catch (error) {
        console.error('Failed to load autosaved data:', error);
      }
    }
  }, []);

  // Autosave effect - save preview data too
  useEffect(() => {
    if (scheduleData) {
      const dataToSave = {
        scheduleData,
        currentStep,
        stepStatus,
        previewData,
        scheduleAssignments,
        generationRequest: generationRequestRef.current,
        isPreviewMode,
        timestamp: Date.now()
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(dataToSave));
    }
  }, [scheduleData, currentStep, stepStatus, previewData, scheduleAssignments, isPreviewMode]);

  const steps: StepConfig[] = [
    { id: 'filter', title: 'اختيار الصف', description: 'تحديد الصف والشعبة', icon: Filter, completed: stepStatus.filter },
    { id: 'validate', title: 'التحقق', description: 'فحص المتطلبات', icon: CheckCircle2, completed: stepStatus.validate },
    { id: 'constraints', title: 'القيود', description: 'تحديد القيود (اختياري)', icon: Settings, completed: stepStatus.constraints },
    { id: 'generate', title: 'الإنشاء', description: 'إنشاء الجدول', icon: Calendar, completed: stepStatus.generate },
    { id: 'view', title: 'المراجعة', description: 'مراجعة الجدول', icon: Eye, completed: stepStatus.view },
    { id: 'export', title: 'التصدير', description: 'حفظ وتصدير', icon: Download, completed: stepStatus.export }
  ];

  const getCurrentStepIndex = () => steps.findIndex(s => s.id === currentStep);

  const goToNextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const markStepCompleted = (step: Step) => {
    setStepStatus(prev => ({ ...prev, [step]: true }));
  };

  // Step handlers
  const handleFilterComplete = (data: ScheduleData) => {
    console.log('Filter complete - Schedule data:', data);
    setScheduleData(data);
    setScheduleAssignments([]);
    setGeneratedScheduleId(null);
    setPreviewData(null);
    generationRequestRef.current = null;
    setIsPreviewMode(false);
    setStepStatus(prev => ({
      ...prev,
      filter: true,
      validate: false,
      constraints: false,
      generate: false,
      view: false,
      conflicts: false,
      export: false
    }));
  };

  const handleValidationComplete = () => {
    markStepCompleted('validate');
  };

  const handleValidationChange = (canProceed: boolean) => {
    setStepStatus(prev => ({ ...prev, validate: canProceed }));
  };

  const handleConstraintsComplete = () => {
    markStepCompleted('constraints');
  };

  const mapEntriesToAssignments = async (entries: any[]): Promise<any[]> => {
    if (!entries || entries.length === 0) {
      return [];
    }

    const [subjectsResponse, teachersResponse] = await Promise.all([
      subjectsApi.getAll(),
      teachersApi.getAll()
    ]);

    const subjectsMap = new Map<number, string>();
    const teachersMap = new Map<number, string>();

    if (subjectsResponse.success && subjectsResponse.data) {
      subjectsResponse.data.forEach((s: any) => subjectsMap.set(s.id, s.subject_name));
    }

    if (teachersResponse.success && teachersResponse.data) {
      teachersResponse.data.forEach((t: any) => teachersMap.set(t.id, t.full_name));
    }

    return entries.map((entry: any, index: number) => ({
      id: entry.id || entry.assignment_id || `${entry.class_id}-${entry.day_of_week}-${entry.period_number}-${entry.subject_id}-${index}`,
      time_slot_id: entry.time_slot_id || entry.id || index + 1,
      day_of_week: entry.day_of_week,
      period_number: entry.period_number,
      subject_id: entry.subject_id,
      subject_name: entry.subject_name || entry.subject?.subject_name || subjectsMap.get(entry.subject_id) || 'مادة غير معروفة',
      teacher_id: entry.teacher_id,
      teacher_name: entry.teacher_name || entry.teacher?.full_name || teachersMap.get(entry.teacher_id) || 'معلم غير معروف',
      room: entry.room,
      notes: entry.notes,
      has_conflict: entry.has_conflict || false,
      conflict_type: entry.conflict_type
    }));
  };

  const refreshAssignmentsFromServer = async () => {
    if (!scheduleData) return;

    const schedulesResponse = await schedulesApi.getAll({
      academic_year_id: scheduleData.academicYearId,
      session_type: scheduleData.sessionType,
      class_id: scheduleData.classId
    });

    if (schedulesResponse.success && schedulesResponse.data && schedulesResponse.data.length > 0) {
      const assignments = await mapEntriesToAssignments(schedulesResponse.data);
      setScheduleAssignments(assignments);
      const firstEntry = schedulesResponse.data[0];
      setGeneratedScheduleId(firstEntry?.id || null);
      return true;
    }

    throw new Error('لم يتم العثور على حصص محفوظة لهذا الصف بعد عملية الحفظ');
  };

  const handleScheduleGenerated = async (payload: {
    apiResponse: any;
    previewData?: any[] | null;
    generationRequest: any;
  }) => {
    try {
      if (!scheduleData) {
        throw new Error('لم يتم تحديد بيانات الصف');
      }

      const previewEntries = payload.previewData || payload.apiResponse?.preview_data;
      if (!previewEntries || previewEntries.length === 0) {
        throw new Error('لم يتم استلام بيانات المعاينة من الخادم');
      }

      generationRequestRef.current = payload.generationRequest;
      setPreviewData(previewEntries);
      setIsPreviewMode(true);
      setGeneratedScheduleId(null);

      const assignments = await mapEntriesToAssignments(previewEntries);
      setScheduleAssignments(assignments);

      markStepCompleted('generate');
      setStepStatus(prev => ({ ...prev, view: true, export: false }));
      setCurrentStep('view');

      toast({
        title: 'تم إنشاء المعاينة',
        description: `يمكنك الآن مراجعة ${assignments.length} حصة قبل الحفظ النهائي في مرحلة التصدير.`
      });
    } catch (error: any) {
      console.error('Error handling generated preview:', error);
      toast({
        title: 'تعذر عرض المعاينة',
        description: error.message || 'حدث خطأ أثناء تجهيز المعاينة',
        variant: 'destructive'
      });
    }
  };

  const handleConflictsResolved = () => {
    setShowConflictResolver(false);
    setHasConflicts(false);
    markStepCompleted('conflicts');
    setCurrentStep('view');
  };

  const handleSaveAsDraft = () => {
    toast({
      title: 'تم الحفظ كمسودة',
      description: 'يمكنك العودة لحل التعارضات لاحقاً'
    });
    setShowConflictResolver(false);
  };

  const handlePublish = async () => {
    if (!scheduleData || !previewData || !generationRequestRef.current) {
      toast({
        title: 'لا يمكن النشر',
        description: 'يرجى إنشاء معاينة للجدول قبل النشر',
        variant: 'destructive'
      });
      return;
    }

    setIsPublishing(true);
    try {
      const requestPayload = { ...generationRequestRef.current };
      delete requestPayload.preview_only;

      const response = await schedulesApi.savePreview({
        request: requestPayload,
        preview_data: previewData
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل حفظ الجدول في قاعدة البيانات');
      }

      await refreshAssignmentsFromServer();
      setPreviewData(null);
      setIsPreviewMode(false);
      markStepCompleted('export');
      
      // Clear autosave after successful publish
      localStorage.removeItem(AUTOSAVE_KEY);
      
      toast({
        title: 'تم النشر بنجاح',
        description: 'تم حفظ الجدول ويمكنك الآن تصديره أو عرضه ضمن الجداول المحفوظة.'
      });
    } catch (error: any) {
      console.error('Error publishing schedule:', error);
      
      // Check if error is about duplicate schedule name
      const errorMessage = error.response?.data?.detail || error.message || 'حدث خطأ أثناء حفظ الجدول';
      const isDuplicateName = errorMessage.includes('يوجد بالفعل جدول باسم') || errorMessage.includes('already exists');
      
      toast({
        title: isDuplicateName ? '⚠️ جدول مكرر' : 'فشل النشر',
        description: errorMessage,
        variant: 'destructive',
        duration: 6000
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExport = () => {
    setShowExporter(true);
    // Clear autosave cache when exporting since the schedule is now finalized
    localStorage.removeItem(AUTOSAVE_KEY);
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            إدارة الجداول الدراسية
          </h1>
          <p className="text-muted-foreground mt-1">
            إنشاء وإدارة جداول الصفوف بذكاء وكفاءة
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">
            <Plus className="h-4 w-4 ml-2" />
            إنشاء جدول جديد
          </TabsTrigger>
          <TabsTrigger value="view">
            <Eye className="h-4 w-4 ml-2" />
            عرض الجداول
          </TabsTrigger>
        </TabsList>

        {/* Create Schedule Tab */}
        <TabsContent value="create" className="space-y-6">
          {/* Progress Stepper */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">خطوات إنشاء الجدول</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = step.completed;
                  const isPast = getCurrentStepIndex() > index;

                  return (
                    <React.Fragment key={step.id}>
                      <div
                        className={`flex flex-col items-center cursor-pointer transition-all ${
                          isActive ? 'scale-110' : ''
                        }`}
                        onClick={() => {
                          if (isCompleted || isPast) {
                            setCurrentStep(step.id);
                          }
                        }}
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-lg'
                              : isCompleted
                              ? 'bg-green-500 dark:bg-green-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : (
                            <StepIcon className="h-6 w-6" />
                          )}
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}>
                            {step.title}
                          </p>
                          <p className="text-xs text-muted-foreground hidden md:block">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`flex-1 h-1 mx-2 transition-all ${
                            isPast || isCompleted ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {React.createElement(steps.find(s => s.id === currentStep)?.icon || Calendar, {
                      className: 'h-5 w-5 text-primary'
                    })}
                    {steps.find(s => s.id === currentStep)?.title}
                  </CardTitle>
                  <CardDescription>
                    {steps.find(s => s.id === currentStep)?.description}
                  </CardDescription>
                </div>
                {stepStatus[currentStep] && (
                  <Badge variant="default">
                    مكتمل
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent ref={filterSectionRef}>
              {/* Filter Step */}
              {currentStep === 'filter' && (
                <ScheduleFilters onComplete={handleFilterComplete} />
              )}

              {/* Validation Step */}
              {currentStep === 'validate' && scheduleData && (
                <ValidationFeedback
                  data={scheduleData}
                  onContinue={handleValidationComplete}
                  onValidationChange={handleValidationChange}
                />
              )}

              {/* Constraints Step */}
              {currentStep === 'constraints' && scheduleData && (
                <ConstraintManager
                  data={scheduleData}
                  onContinue={handleConstraintsComplete}
                />
              )}

              {/* Generate Step */}
              {currentStep === 'generate' && scheduleData && (
                <ScheduleGenerator
                  projectId="schedule"
                  academicYearId={scheduleData.academicYearId}
                  sessionType={scheduleData.sessionType as 'morning' | 'evening'}
                  classId={scheduleData.classId}
                  section={scheduleData.section}
                  onScheduleGenerated={handleScheduleGenerated}
                />
              )}

              {/* View Step */}
              {currentStep === 'view' && scheduleAssignments.length > 0 && (
                <div className="space-y-4">
                  <WeeklyScheduleGrid
                    scheduleId={generatedScheduleId || undefined}
                    data={scheduleData}
                    assignments={scheduleAssignments}
                    readOnly={isPreviewMode}
                  />
                  {isPreviewMode && (
                    <div className="p-4 bg-primary/10 border border-primary/30 rounded text-sm text-primary">
                      هذه نسخة معاينة فقط. انتقل إلى خطوة "التصدير" لحفظ الجدول بشكل نهائي.
                    </div>
                  )}
                </div>
              )}

              {currentStep === 'view' && scheduleAssignments.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  لا توجد معاينة جاهزة بعد. يرجى إكمال خطوة إنشاء الجدول أولاً.
                </div>
              )}

              {/* Export Step */}
              {currentStep === 'export' && (
                <div className="text-center py-12 space-y-4">
                  {isPreviewMode ? (
                    <>
                      <AlertTriangle className="h-16 w-16 text-accent mx-auto" />
                      <h3 className="text-2xl font-bold text-accent-foreground">لم يتم النشر بعد</h3>
                      <p className="text-muted-foreground">
                        قم بحفظ الجدول في قاعدة البيانات ليظهر ضمن "عرض الجداول" ويصبح متاحًا للتصدير.
                      </p>
                      <div className="flex justify-center">
                        <Button onClick={handlePublish} disabled={isPublishing || !previewData} className="min-w-[200px]">
                          {isPublishing ? (
                            <>
                              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                              جاري النشر...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 ml-2" />
                              نشر الجدول نهائيًا
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : generatedScheduleId ? (
                    <>
                      <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
                      <h3 className="text-2xl font-bold text-green-900">تم النشر بنجاح!</h3>
                      <p className="text-muted-foreground">يمكنك الآن تصدير الجدول أو عرضه في قائمة الجداول.</p>
                      <div className="flex justify-center gap-3 pt-4">
                        <Button onClick={handleExport}>
                          <Download className="h-4 w-4 ml-2" />
                          تصدير الجدول
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab('view')}>
                          <Eye className="h-4 w-4 ml-2" />
                          عرض جميع الجداول
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">لا يوجد جدول محفوظ لعرضه هنا.</p>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <Separator className="my-6" />
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={getCurrentStepIndex() === 0}
                >
                  <ArrowRight className="h-4 w-4 ml-2" />
                  السابق
                </Button>
                <Button
                  onClick={goToNextStep}
                  disabled={!stepStatus[currentStep] || getCurrentStepIndex() === steps.length - 1}
                >
                  التالي
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Schedules Tab */}
        <TabsContent value="view">
          {scheduleData ? (
            <SavedSchedulesViewer
              academicYearId={scheduleData.academicYearId}
              sessionType={scheduleData.sessionType as 'morning' | 'evening'}
            />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <BookOpen className="h-16 w-16 mx-auto text-gray-300" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">اختر سنة دراسية وفترة</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      قم بإنشاء جدول جديد أولاً لاختيار السنة الدراسية والفترة
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>

      {/* Conflict Resolver Dialog */}
      {showConflictResolver && generatedScheduleId && !isPreviewMode && (
        <ConflictResolver
          open={showConflictResolver}
          onOpenChange={setShowConflictResolver}
          scheduleId={generatedScheduleId}
          onSaveAsDraft={handleSaveAsDraft}
          onPublish={handlePublish}
          onResolve={() => {}}
        />
      )}

      {/* Export Dialog */}
      {showExporter && generatedScheduleId && !isPreviewMode && (
        <ScheduleExporter
          open={showExporter}
          onOpenChange={setShowExporter}
          scheduleId={generatedScheduleId}
          scheduleName={scheduleData ? `جدول ${scheduleData.gradeLevel} ${scheduleData.gradeNumber} ${scheduleData.section}` : 'الجدول'}
        />
      )}
    </div>
  );
};

export default ScheduleManagementPage;
