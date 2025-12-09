import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IOSSwitch } from '@/components/ui/ios-switch';
import { useToast } from '@/hooks/use-toast';
import { academicYearsApi } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, School, CheckCircle, Settings } from 'lucide-react';
import { IOSNavbar } from '@/components/ui/ios-navbar';

interface FirstRunSetupProps {
  onComplete: () => void;
}

export function FirstRunSetup({ onComplete }: FirstRunSetupProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    year_name: '',
    description: ''
  });
  const [autoOpenYear, setAutoOpenYear] = useState(true);

  // Check if this is first run on component mount
  useEffect(() => {
    const checkFirstRun = async () => {
      try {
        const response = await academicYearsApi.checkFirstRun();
        // Handle both response formats
        if (response.success && response.data) {
          setIsFirstRun(response.data.is_first_run);
        } else {
          // Direct data format
          setIsFirstRun((response as any).is_first_run);
        }
      } catch (error) {

        toast({
          title: "خطأ",
          description: "فشل التحقق من حالة التشغيل الأول",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    checkFirstRun();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.year_name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم السنة الدراسية",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const response = await academicYearsApi.initializeFirstYear({
        year_name: formData.year_name,
        description: formData.description,
        is_active: true
      });

      // Handle both response formats
      let resultData;
      if (response.success && response.data) {
        resultData = response.data;
      } else {
        // Direct data format
        resultData = response as any;
      }

      if (resultData) {
        // Save the auto-open preference to localStorage instead
        if (autoOpenYear) {
          localStorage.setItem('auto_open_academic_year', 'true');
        }

        // Store the created academic year ID and name
        if (resultData.id) {
          localStorage.setItem('selected_academic_year_id', resultData.id.toString());
          localStorage.setItem('selected_academic_year_name', resultData.year_name);
          // Dispatch custom event to notify other components
          window.dispatchEvent(new Event('academicYearChanged'));
        }

        toast({
          title: "نجح",
          description: "تم إنشاء السنة الدراسية الأولى بنجاح"
        });

        // Mark first run as complete
        localStorage.setItem('first_run_completed', 'true');

        // Call onComplete callback to indicate setup is complete
        onComplete();
      } else {
        throw new Error(response.message || 'Failed to create first academic year');
      }
    } catch (error: any) {

      toast({
        title: "خطأ",
        description: error.message || "فشل إنشاء السنة الدراسية الأولى",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not first run, redirect to academic years page
  if (isFirstRun === false) {
    onComplete();
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <IOSNavbar title="الإعداد الأولي" largeTitle={true} />

      <div className="p-4 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3 space-x-reverse">
              <School className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>الإعداد الأولي</CardTitle>
                <CardDescription>
                  لنبدأ بإنشاء السنة الدراسية الأولى
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  هذه المرة الأولى لاستخدام النظام. لنقم بإنشاء السنة الدراسية الأولى للبدء.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="year_name">اسم السنة الدراسية *</Label>
                <Input
                  id="year_name"
                  value={formData.year_name}
                  onChange={(e) => handleInputChange('year_name', e.target.value)}
                  placeholder="مثال: 2025-2026"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  الصيغة: السنة الحالية - السنة التالية (مثال: 2025-2026)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف (اختياري)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="وصف مختصر لهذه السنة الدراسية"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">فتح السنة الدراسية تلقائياً</Label>
                  <p className="text-sm text-muted-foreground">
                    فتح آخر سنة دراسية نشطة تلقائياً عند بدء التشغيل
                  </p>
                </div>
                <IOSSwitch
                  checked={autoOpenYear}
                  onCheckedChange={setAutoOpenYear}
                />
              </div>

              <div className="flex space-x-3 space-x-reverse">
                <Button
                  type="submit"
                  disabled={creating}
                  className="flex-1"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      إنشاء السنة الدراسية الأولى
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}