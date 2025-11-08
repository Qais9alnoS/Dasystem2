import React, { useState } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import {
  ScheduleFilters,
  ValidationFeedback,
  ConstraintManager,
  WeeklyScheduleGrid,
  ConflictResolver,
  TeacherAvailabilityPanel,
  ScheduleExporter
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

export const ScheduleManagementPage: React.FC = () => {
  // State management
  const [currentStep, setCurrentStep] = useState<Step>('filter');
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [generatedScheduleId, setGeneratedScheduleId] = useState<number | null>(null);
  const [scheduleAssignments, setScheduleAssignments] = useState<any[]>([]);
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
    markStepCompleted('filter');
    setCurrentStep('validate');
  };

  const handleValidationComplete = () => {
    markStepCompleted('validate');
    setCurrentStep('constraints');
  };

  const handleConstraintsComplete = () => {
    markStepCompleted('constraints');
    setCurrentStep('generate');
  };

  const handleScheduleGenerated = async (result: any) => {
    console.log('Schedule generation result:', result);
    
    // If generation was successful, fetch the actual schedule data
    if (result.generation_status === 'completed' || result.generation_status === 'success') {
      try {
        // Fetch schedules for this academic year and session type
        if (scheduleData) {
          console.log('Fetching schedules with params:', {
            academic_year_id: scheduleData.academicYearId,
            session_type: scheduleData.sessionType,
            class_id: scheduleData.classId
          });
          
          const schedulesResponse = await schedulesApi.getAll({
            academic_year_id: scheduleData.academicYearId,
            session_type: scheduleData.sessionType,
            class_id: scheduleData.classId
          });

          console.log('Schedules fetched:', schedulesResponse);

          if (schedulesResponse.success && schedulesResponse.data && schedulesResponse.data.length > 0) {
            const schedules = schedulesResponse.data;
            
            console.log(`Found ${schedules.length} schedule entries`);
            
            // Fetch subjects and teachers for mapping
            const subjectsResponse = await subjectsApi.getAll();
            const teachersResponse = await teachersApi.getAll();
            
            const subjectsMap = new Map();
            const teachersMap = new Map();
            
            if (subjectsResponse.success && subjectsResponse.data) {
              subjectsResponse.data.forEach((s: any) => subjectsMap.set(s.id, s.subject_name));
            }
            
            if (teachersResponse.success && teachersResponse.data) {
              teachersResponse.data.forEach((t: any) => teachersMap.set(t.id, t.full_name));
            }
            
            // Transform schedules to assignments format
            const assignments = schedules.map((schedule: any) => ({
              id: schedule.id,
              time_slot_id: schedule.id,
              day_of_week: schedule.day_of_week,
              period_number: schedule.period_number,
              subject_id: schedule.subject_id,
              subject_name: subjectsMap.get(schedule.subject_id) || schedule.subject?.subject_name || 'مادة غير محددة',
              teacher_id: schedule.teacher_id,
              teacher_name: teachersMap.get(schedule.teacher_id) || schedule.teacher?.full_name || 'معلم غير محدد',
              room: schedule.room,
              notes: schedule.notes,
              has_conflict: false,
              conflict_type: undefined
            }));

            console.log('Transformed assignments:', assignments.length);

            setScheduleAssignments(assignments);
            setGeneratedScheduleId(result.schedule_id || schedules[0]?.id || 1);
            markStepCompleted('generate');
            setCurrentStep('view');
            
            toast({
              title: "تم العرض بنجاح",
              description: `تم عرض ${assignments.length} حصة في الجدول`,
            });
          } else {
            throw new Error('No schedules found in response');
          }
        }
      } catch (error: any) {
        console.error('Error fetching generated schedules:', error);
        toast({
          title: "خطأ في عرض الجدول",
          description: error.message || "تم إنشاء الجداول لكن حدث خطأ في عرضها. يرجى تحديث الصفحة.",
          variant: "destructive"
        });
      }
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

  const handlePublish = () => {
    toast({
      title: 'تم النشر',
      description: 'تم نشر الجدول وتحديث توفر المعلمين'
    });
    markStepCompleted('export');
  };

  const handleExport = () => {
    setShowExporter(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            إدارة الجداول الدراسية
          </h1>
          <p className="text-muted-foreground mt-1">
            إنشاء وإدارة جداول الصفوف بذكاء وكفاءة
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">
            <Plus className="h-4 w-4 ml-2" />
            إنشاء جدول جديد
          </TabsTrigger>
          <TabsTrigger value="view">
            <Eye className="h-4 w-4 ml-2" />
            عرض الجداول
          </TabsTrigger>
          <TabsTrigger value="availability">
            <Users className="h-4 w-4 ml-2" />
            توفر المعلمين
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
                              ? 'bg-blue-600 text-white shadow-lg'
                              : isCompleted
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : (
                            <StepIcon className="h-6 w-6" />
                          )}
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
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
                            isPast || isCompleted ? 'bg-green-500' : 'bg-gray-200'
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
                      className: 'h-5 w-5 text-blue-600'
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
            <CardContent>
              {/* Filter Step */}
              {currentStep === 'filter' && (
                <ScheduleFilters onComplete={handleFilterComplete} />
              )}

              {/* Validation Step */}
              {currentStep === 'validate' && scheduleData && (
                <ValidationFeedback
                  data={scheduleData}
                  onContinue={handleValidationComplete}
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
              {currentStep === 'view' && generatedScheduleId && (
                <div className="space-y-4">
                  <WeeklyScheduleGrid
                    scheduleId={generatedScheduleId}
                    data={scheduleData}
                    assignments={scheduleAssignments}
                    readOnly={false}
                  />
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setShowConflictResolver(true)}>
                      <AlertTriangle className="h-4 w-4 ml-2" />
                      مراجعة التعارضات
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={handleSaveAsDraft}>
                        حفظ كمسودة
                      </Button>
                      <Button onClick={handlePublish}>
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                        نشر الجدول
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Step */}
              {currentStep === 'export' && generatedScheduleId && (
                <div className="text-center py-12 space-y-4">
                  <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
                  <h3 className="text-2xl font-bold text-green-900">تم بنجاح!</h3>
                  <p className="text-muted-foreground">تم نشر الجدول وتحديث توفر المعلمين</p>
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
          <Card>
            <CardHeader>
              <CardTitle>الجداول المنشأة</CardTitle>
              <CardDescription>عرض وإدارة جميع الجداول الدراسية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>قريباً: عرض قائمة الجداول المنشأة</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teacher Availability Tab */}
        <TabsContent value="availability">
          {scheduleData && (
            <TeacherAvailabilityPanel
              academicYearId={scheduleData.academicYearId}
              sessionType={scheduleData.sessionType}
              classId={scheduleData.classId}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Conflict Resolver Dialog */}
      {showConflictResolver && generatedScheduleId && (
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
      {showExporter && generatedScheduleId && (
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
