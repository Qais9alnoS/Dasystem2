import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Calendar, Users, Check, Settings, Edit, Trash2 } from 'lucide-react';
import { IOSList, IOSListItem } from '@/components/ui/ios-list';
import { IOSNavbar } from '@/components/ui/ios-navbar';
import { academicYearsApi } from '@/services/api';
import { AcademicYear } from '@/types/school';
import { AcademicYearForm } from '@/components/academic/AcademicYearForm';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { IOSSwitch } from '@/components/ui/ios-switch';

interface AcademicYearManagementPageProps {
  onYearSelected?: () => void;
}

export const AcademicYearManagementPage: React.FC<AcademicYearManagementPageProps> = ({ onYearSelected }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [deleteYearId, setDeleteYearId] = useState<number | null>(null);
  const [deleteYearName, setDeleteYearName] = useState<string>('');
  const [currentYearId, setCurrentYearId] = useState<number | null>(null);

  // Get current academic year from localStorage
  useEffect(() => {
    const selectedYearId = localStorage.getItem('selected_academic_year_id');
    if (selectedYearId) {
      setCurrentYearId(parseInt(selectedYearId, 10));
    }
  }, []);

  // Fetch academic years
  const { data: academicYears, isLoading, isError } = useQuery<AcademicYear[]>({
    queryKey: ['academicYears'],
    queryFn: async () => {
      const response = await academicYearsApi.getAll();
      // Handle both response formats
      if (response.success) {
        return response.data || [];
      } else {
        // Direct data format
        return response as unknown as AcademicYear[];
      }
    },
  });

  // Mutation for creating academic years
  const createMutation = useMutation({
    mutationFn: async (data: Omit<AcademicYear, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('=== Create Mutation Called ===');
      console.log('Data:', data);
      const response = await academicYearsApi.create(data);
      console.log('API Response:', response);
      // Handle both response formats
      if (response.success) {
        return response.data;
      } else {
        // Direct data format
        return response as unknown as AcademicYear;
      }
    },
    onSuccess: async (newYear, variables, context) => {
      console.log('=== Create Year Success ===');
      console.log('New Year:', newYear);
      console.log('Variables:', variables);
      
      // Invalidate and wait for refetch to complete
      await queryClient.invalidateQueries({ queryKey: ['academicYears'] });
      await queryClient.refetchQueries({ queryKey: ['academicYears'] });
      
      setShowForm(false);
      setEditingYear(null);
      
      toast({
        title: "نجاح",
        description: "تم إنشاء السنة الدراسية بنجاح!",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating academic years
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; year: Partial<AcademicYear> }) => {
      const response = await academicYearsApi.update(data.id, data.year);
      // Handle both response formats
      if (response.success) {
        return response.data;
      } else {
        // Direct data format
        return response as unknown as AcademicYear;
      }
    },
    onSuccess: async (updatedYear, variables) => {
      console.log('=== Update Success ===');
      console.log('Updated Year:', updatedYear);
      console.log('Variables:', variables);
      
      // Invalidate and refetch to ensure UI updates immediately
      await queryClient.invalidateQueries({ queryKey: ['academicYears'] });
      await queryClient.refetchQueries({ queryKey: ['academicYears'] });
      
      console.log('Queries invalidated and refetched');
      
      // Only show toast when changing year properties (not when just selecting)
      if (editingYear) {
        toast({
          title: "نجاح",
          description: "تم تحديث السنة الدراسية بنجاح!",
          variant: "default",
        });
        
        // Close form after update
        setShowForm(false);
        setEditingYear(null);
      } else {
        // This is a default toggle operation
        console.log('Default toggle operation - is_active:', updatedYear?.is_active);
        
        // Update localStorage to reflect the default year setting
        if (updatedYear?.is_active) {
          localStorage.setItem('auto_open_academic_year', 'true');
          localStorage.setItem('selected_academic_year_id', updatedYear.id?.toString() || '');
          localStorage.setItem('selected_academic_year_name', updatedYear.year_name || '');
        } else {
          localStorage.setItem('auto_open_academic_year', 'false');
        }
      }
      
      // Don't automatically select the year when just setting it as default
      // The user can click on the year to enter it
    },
    onError: (error: Error) => {
      console.error('=== Update Error ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      
      toast({
        title: "خطأ",
        description: error.message || 'فشل في تحديث السنة الدراسية',
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting academic years
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await academicYearsApi.delete(id);
      return response;
    },
    onSuccess: () => {
      // Check if we deleted the current year
      if (deleteYearId === currentYearId) {
        // Clear the selected year from localStorage
        localStorage.removeItem('selected_academic_year_id');
        localStorage.removeItem('selected_academic_year_name');
        localStorage.removeItem('auto_open_academic_year');
        
        toast({
          title: "تم الحذف",
          description: "تم حذف السنة الدراسية الحالية. سيتم إعادة تحميل الصفحة...",
          variant: "default",
        });
        
        // Reload the page after a short delay to show the toast
        setTimeout(() => {
          window.location.href = '/academic-years';
        }, 1500);
      } else {
        // Invalidate queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ['academicYears'] });
        setDeleteYearId(null);
        
        toast({
          title: "نجاح",
          description: "تم حذف السنة الدراسية بنجاح!",
          variant: "default",
        });
      }
    },
    onError: (error: Error) => {
      console.error('=== Delete Year Error ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      
      // Close delete dialog
      setDeleteYearId(null);
      
      const errorMessage = error.message || '';
      const apiError = error as any;
      const errorDetail = apiError?.details?.detail || apiError?.details?.message || errorMessage;
      
      toast({
        title: "خطأ",
        description: errorDetail || errorMessage || 'فشل في حذف السنة الدراسية',
        variant: "destructive",
      });
    },
  });

  // Handle form submission for create
  const handleCreateSubmit = async (data: Omit<AcademicYear, 'id' | 'created_at' | 'updated_at'>) => {
    // Prevent double submission
    if (createMutation.isPending) {
      console.log('Create mutation already in progress, ignoring duplicate submission');
      return;
    }
    
    console.log('=== Creating Academic Year ===');
    console.log('Data:', data);
    createMutation.mutate(data);
  };

  // Handle form submission for update
  const handleUpdateSubmit = async (data: Omit<AcademicYear, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingYear?.id) {
      updateMutation.mutate({ id: editingYear.id, year: data });
    }
  };

  // Handle year selection
  const handleSelectYear = (year: AcademicYear) => {
    // Store selected year in localStorage
    localStorage.setItem('selected_academic_year_id', year.id?.toString() || '');
    localStorage.setItem('selected_academic_year_name', year.year_name);
    
    // If this year is set as active, update the setting
    if (year.is_active) {
      localStorage.setItem('auto_open_academic_year', 'true');
    } else {
      localStorage.setItem('auto_open_academic_year', 'false');
    }
    
    // Show success toast
    toast({
      title: "تم اختيار السنة الدراسية",
      description: `تم اختيار السنة الدراسية: ${year.year_name}`,
      variant: "default",
    });
    
    // Notify parent component that a year has been selected
    if (onYearSelected) {
      onYearSelected();
    }
    
    // Navigate to main dashboard
    navigate('/dashboard');
  };

  // Handle setting as default (active) - toggle functionality
  const handleSetAsDefault = (year: AcademicYear) => {
    console.log('=== Setting year as default ===');
    console.log('Year ID:', year.id);
    console.log('Year Name:', year.year_name);
    console.log('Current is_active:', year.is_active);
    console.log('New is_active:', !year.is_active);
    
    // If the year is already active, deactivate it
    // Otherwise, activate it (which will deactivate others)
    updateMutation.mutate({ 
      id: year.id!, 
      year: { 
        is_active: !year.is_active
      } 
    });
  };

  // Handle edit year
  const handleEditYear = (year: AcademicYear) => {
    setEditingYear(year);
    setShowForm(true);
  };

  // Handle delete year - show confirmation dialog
  const handleDeleteYear = (year: AcademicYear) => {
    setDeleteYearId(year.id!);
    setDeleteYearName(year.year_name);
  };

  // Confirm delete year
  const confirmDeleteYear = () => {
    if (deleteYearId) {
      deleteMutation.mutate(deleteYearId);
    }
  };

  // Reset first run status for testing
  const handleResetFirstRun = () => {
    localStorage.removeItem('first_run_completed');
    localStorage.removeItem('selected_academic_year_id');
    localStorage.removeItem('selected_academic_year_name');
    localStorage.removeItem('auto_open_academic_year');
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>خطأ</CardTitle>
            <CardDescription>فشل في تحميل السنوات الدراسية</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['academicYears'] })}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const years = academicYears || [];

  return (
    <div className="min-h-screen bg-background">
      <IOSNavbar 
        title="إدارة السنوات الدراسية" 
        onBack={() => navigate(-1)} 
        largeTitle={true}
      />
      
      <div className="p-4 pb-24">
        {showForm ? (
          <AcademicYearForm
            onSubmit={editingYear ? handleUpdateSubmit : handleCreateSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingYear(null);
            }}
            initialData={editingYear || undefined}
            mode={editingYear ? "edit" : "create"}
          />
        ) : (
          <>
            {years.length === 0 ? (
              // Empty state - no academic years
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                <div className="bg-muted rounded-full p-4 mb-4">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">لا توجد سنوات دراسية</h2>
                <p className="text-muted-foreground mb-6">
                  ابدأ بإنشاء أول سنة دراسية لك
                </p>
                <Button 
                  size="lg" 
                  className="w-full max-w-xs"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  إضافة سنة دراسية
                </Button>
                
                {/* Hidden button for testing - remove in production */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-8 text-xs"
                  onClick={handleResetFirstRun}
                >
                  إعادة تعيين الإعداد الأولي (للاختبار فقط)
                </Button>
              </div>
            ) : (
              // List of academic years
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-2">اختر السنة الدراسية</h2>
                  <p className="text-muted-foreground text-sm">
                    اختر سنة دراسية للعمل معها
                  </p>
                </div>
                
                <IOSList>
                  {years.map((year) => (
                    <IOSListItem
                      key={year.id}
                      icon={<Calendar className="h-5 w-5" />}
                      chevron
                      onClick={() => handleSelectYear(year)}
                    >
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <div className="font-medium">{year.year_name}</div>
                          {year.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {year.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditYear(year);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <div 
                              className="flex items-center justify-center mx-1"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <span className="text-xs text-muted-foreground mr-2">افتراضية</span>
                              <IOSSwitch 
                                checked={year.is_active}
                                onCheckedChange={() => handleSetAsDefault(year)}
                                disabled={updateMutation.isPending}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteYear(year);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </IOSListItem>
                  ))}
                </IOSList>
                
                <div className="mt-6">
                  <Button 
                    className="w-full"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    إضافة سنة دراسية جديدة
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteYearId} onOpenChange={() => setDeleteYearId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteYearId === currentYearId ? (
                <div className="space-y-2">
                  <p className="text-destructive font-semibold">⚠️ تحذير: أنت على وشك حذف السنة الدراسية الحالية!</p>
                  <p>هل أنت متأكد من حذف السنة الدراسية "{deleteYearName}"؟</p>
                  <p>سيتم إخراجك من النظام وسيتعين عليك اختيار سنة دراسية جديدة.</p>
                  <p className="text-muted-foreground text-sm">هذا الإجراء لا يمكن التراجع عنه.</p>
                </div>
              ) : (
                <p>هل أنت متأكد من حذف السنة الدراسية "{deleteYearName}"؟ هذا الإجراء لا يمكن التراجع عنه.</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteYearId(null)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteYear} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};