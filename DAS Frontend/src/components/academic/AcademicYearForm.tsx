import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Calendar,
    Save,
    X,
    AlertTriangle,
    BookOpen
} from 'lucide-react';
import { IOSSwitch } from '@/components/ui/ios-switch';
import { academicYearsApi } from '@/services/api';
import { AcademicYear } from '@/types/school';
import { useToast } from '@/hooks/use-toast';

// Academic Year Schema
const academicYearSchema = z.object({
    year_name: z.string().min(1, 'اسم السنة الدراسية مطلوب').regex(
        /^\d{4}-\d{4}$/,
        'يجب أن يكون تنسيق السنة الدراسية مثل 2025-2026'
    ),
    description: z.string().optional(),
    is_active: z.boolean().default(false)
});

type AcademicYearFormData = z.infer<typeof academicYearSchema>;

interface AcademicYearFormProps {
    onSubmit?: (data: AcademicYearFormData) => void;
    onCancel?: () => void;
    initialData?: Partial<AcademicYearFormData> & { id?: number };
    mode?: 'create' | 'edit';
}

export const AcademicYearForm: React.FC<AcademicYearFormProps> = ({
    onSubmit,
    onCancel,
    initialData,
    mode = 'create'
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        watch,
        setValue
    } = useForm<AcademicYearFormData>({
        resolver: zodResolver(academicYearSchema),
        defaultValues: {
            year_name: initialData?.year_name || '',
            description: initialData?.description || '',
            is_active: initialData?.is_active || false
        }
    });

    const watchedValues = watch();

    const handleFormSubmit = async (data: AcademicYearFormData) => {
        if (isSubmitting) {

            return;
        }

        setIsSubmitting(true);
        try {
            // Convert form data to API format
            const apiData: Omit<AcademicYear, 'id' | 'created_at' | 'updated_at'> = {
                year_name: data.year_name,
                description: data.description,
                is_active: data.is_active
            };

            // Only call onSubmit - let the parent handle the API call
            if (onSubmit) {
                await onSubmit(apiData);
            }

            // If this is edit mode, close the form after successful update
            if (mode === 'edit' && onCancel) {
                // Small delay to allow toast to be seen
                setTimeout(() => {
                    onCancel();
                }, 1000);
            }
        } catch (error: any) {
            // Check if this is a duplicate year error
            const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء الحفظ';

            // Show a more user-friendly error message for duplicate years
            if (errorMessage.includes('already exists') || errorMessage.includes('موجودة')) {
                toast({
                    title: "خطأ",
                    description: "السنة الدراسية موجودة بالفعل. يرجى اختيار اسم مختلف.",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "خطأ",
                    description: errorMessage,
                    variant: "destructive"
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateYearName = () => {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        setValue('year_name', `${currentYear}-${nextYear}`);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-3 space-x-reverse">
                            <BookOpen className="w-6 h-6 text-primary" />
                            <div>
                                <CardTitle>
                                    {mode === 'create' ? 'إنشاء سنة دراسية جديدة' : 'تعديل السنة الدراسية'}
                                </CardTitle>
                                <CardDescription>
                                    {mode === 'create'
                                        ? 'أنشئ سنة دراسية جديدة لإدارة الطلاب والمعلمين'
                                        : 'تحديث بيانات السنة الدراسية'
                                    }
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Year Name */}
                        <div className="space-y-2">
                            <Label htmlFor="year_name" className="flex items-center space-x-2 space-x-reverse">
                                <Calendar className="w-4 h-4" />
                                <span>اسم السنة الدراسية *</span>
                            </Label>
                            <div className="flex space-x-2 space-x-reverse">
                                <Controller
                                    name="year_name"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            placeholder="مثال: 2025-2026"
                                            className={`flex-1 ${errors.year_name ? 'border-red-500' : ''}`}
                                        />
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={generateYearName}
                                    className="whitespace-nowrap"
                                >
                                    السنة الحالية
                                </Button>
                            </div>
                            {errors.year_name && (
                                <p className="text-sm text-red-500">{errors.year_name.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                تنسيق السنة الدراسية يجب أن يكون بالشكل: السنة الحالية - السنة التالية
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">وصف السنة الدراسية</Label>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        placeholder="وصف مختصر للسنة الدراسية (اختياري)"
                                        rows={3}
                                    />
                                )}
                            />
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                                <Label className="text-base font-medium">تعيين كافتراضية</Label>
                                <p className="text-sm text-muted-foreground">
                                    السنة الدراسية الافتراضية سيتم اختيارها تلقائياً عند الوصول إلى التطبيق
                                </p>
                            </div>
                            <Controller
                                name="is_active"
                                control={control}
                                render={({ field }) => (
                                    <IOSSwitch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                        </div>

                        {watchedValues.is_active && (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>تنبيه:</strong> تفعيل هذه السنة الدراسية سيؤدي إلى إلغاء تفعيل السنة الدراسية الحالية (إن وجدت).
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex space-x-2 space-x-reverse">
                        {onCancel && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onCancel}
                            >
                                <X className="w-4 h-4 ml-2" />
                                إلغاء
                            </Button>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={!isValid || isSubmitting}
                        className="flex items-center space-x-2 space-x-reverse"
                    >
                        <Save className="w-4 h-4" />
                        <span>
                            {isSubmitting ? 'جاري الحفظ...' :
                                mode === 'create' ? 'إنشاء السنة الدراسية' : 'حفظ التغييرات'}
                        </span>
                    </Button>
                </div>
            </form>
        </div>
    );
};