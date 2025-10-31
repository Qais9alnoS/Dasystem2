import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, School } from 'lucide-react';
import { useProject, projectService } from '@/contexts/ProjectContext';
import { Loader2 } from 'lucide-react';
import { DEFAULT_SUBJECTS } from '@/lib/defaultSubjects';

interface ProjectWizardProps {
  onProjectCreated?: (projectId: number) => void;
}

const EDUCATION_LEVELS = [
  { id: 'primary', label: 'ابتدائي', grades: '1-6' },
  { id: 'preparatory', label: 'إعدادي', grades: '7-9' },
  { id: 'secondary', label: 'ثانوي', grades: '10-11' },
  { id: 'baccalaureate', label: 'بكالوريا', grades: '12' }
];

const SCHOOL_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];

export const ProjectWizard: React.FC<ProjectWizardProps> = ({ onProjectCreated }) => {
  const navigate = useNavigate();
  const { dispatch } = useProject();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    enabledLevels: ['primary', 'preparatory', 'secondary', 'baccalaureate'],
    schoolDays: SCHOOL_DAYS,
    periodsPerDay: 6
  });

  const totalSteps = 3;

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0:
        return projectData.name.trim().length >= 3;
      case 1:
        return projectData.enabledLevels.length > 0;
      case 2:
        return projectData.schoolDays.length >= 5;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleEducationLevel = (levelId: string) => {
    const updatedLevels = projectData.enabledLevels.includes(levelId)
      ? projectData.enabledLevels.filter(id => id !== levelId)
      : [...projectData.enabledLevels, levelId];
    
    setProjectData(prev => ({ ...prev, enabledLevels: updatedLevels }));
  };

  const toggleSchoolDay = (day: string) => {
    const updatedDays = projectData.schoolDays.includes(day)
      ? projectData.schoolDays.filter(d => d !== day)
      : [...projectData.schoolDays, day];
    
    setProjectData(prev => ({ ...prev, schoolDays: updatedDays }));
  };

  const handleCreateProject = async () => {
    if (!validateCurrentStep()) {
      setError('يرجى إكمال جميع الحقول المطلوبة');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const project = await projectService.createProject(projectData.name.trim());
      dispatch({ type: 'ADD_PROJECT', payload: project });
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
      
      if (onProjectCreated) {
        onProjectCreated(project.id);
      }
      
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء المشروع');
    } finally {
      setIsCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <School className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold">معلومات المشروع الأساسية</h2>
              <p className="text-muted-foreground">ابدأ بإدخال اسم المشروع والمعلومات الأساسية</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">اسم المشروع *</Label>
                <Input
                  id="projectName"
                  value={projectData.name}
                  onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: مدرسة الأمل الابتدائية"
                  className="text-right"
                  dir="rtl"
                  required
                />
              </div>
              <div>
                <Label htmlFor="projectDescription">وصف المشروع (اختياري)</Label>
                <Input
                  id="projectDescription"
                  value={projectData.description}
                  onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر للمشروع"
                  className="text-right"
                  dir="rtl"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">المراحل الدراسية</h2>
              <p className="text-muted-foreground">اختر المراحل الدراسية المتوفرة في مدرستك</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EDUCATION_LEVELS.map((level) => {
                const isSelected = projectData.enabledLevels.includes(level.id);
                return (
                  <Card 
                    key={level.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => toggleEducationLevel(level.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{level.label}</h3>
                          <p className="text-sm text-muted-foreground">الصفوف {level.grades}</p>
                        </div>
                        {isSelected ? (
                          <CheckCircle className="h-6 w-6 text-primary" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">إعدادات الجدولة</h2>
              <p className="text-muted-foreground">حدد أيام الدوام وعدد الحصص اليومية</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>أيام الدوام المدرسي</CardTitle>
                <CardDescription>اختر الأيام التي تعمل فيها المدرسة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((day) => {
                    const isSelected = projectData.schoolDays.includes(day);
                    return (
                      <Button
                        key={day}
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => toggleSchoolDay(day)}
                        className="h-12"
                      >
                        {day}
                      </Button>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  أيام مختارة: {projectData.schoolDays.length} من 7
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>عدد الحصص اليومية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Label>عدد الحصص:</Label>
                  <Input
                    type="number"
                    min="4"
                    max="10"
                    value={projectData.periodsPerDay}
                    onChange={(e) => setProjectData(prev => ({ ...prev, periodsPerDay: parseInt(e.target.value) }))}
                    className="w-24 text-center"
                  />
                  <span className="text-sm text-muted-foreground">حصة يومياً</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">إنشاء مشروع جديد</h1>
          <p className="text-muted-foreground">اتبع الخطوات لإنشاء مشروع جدولة جديد</p>
        </div>

        <div className="mb-8">
          <Progress value={((currentStep + 1) / totalSteps) * 100} className="mb-4" />
          <div className="text-center text-sm text-muted-foreground">
            الخطوة {currentStep + 1} من {totalSteps}
          </div>
        </div>

        <Card className="mb-8">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 ml-1" />
            السابق
          </Button>
          
          {currentStep < totalSteps - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!validateCurrentStep()}
            >
              التالي
              <ArrowRight className="h-4 w-4 mr-1" />
            </Button>
          ) : (
            <Button
              onClick={handleCreateProject}
              disabled={isCreating || !validateCurrentStep()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-1" />
                  جاري الإنشاء...
                </>
              ) : (
                'إنشاء المشروع'
              )}
            </Button>
          )}
        </div>

        {error && (
          <Card className="mt-4 border-destructive">
            <CardContent className="p-4">
              <div className="text-destructive text-sm text-center">
                {error}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};