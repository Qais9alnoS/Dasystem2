import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle } from 'lucide-react';
import { academicYearsApi } from '@/services/api';
import { AcademicYear } from '@/types/school';
import { useToast } from '@/hooks/use-toast';

interface YearSelectionSectionProps {
  selectedYearId: number | null;
  onYearChange: (yearId: number) => void;
}

export const YearSelectionSection: React.FC<YearSelectionSectionProps> = ({
  selectedYearId,
  onYearChange
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  useEffect(() => {
    loadAcademicYears();
  }, []);

  const loadAcademicYears = async () => {
    try {
      setLoading(true);
      const response = await academicYearsApi.getAll();
      setAcademicYears(response.data);
      
      // Auto-select active year if no year is selected
      if (!selectedYearId) {
        const activeYear = response.data.find(y => y.is_active);
        if (activeYear) {
          onYearChange(activeYear.id);
        }
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تحميل السنوات الدراسية',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedYear = academicYears.find(y => y.id === selectedYearId);

  return (
    <div className="space-y-6">
      <Card className="ios-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            اختيار السنة الدراسية
          </CardTitle>
          <CardDescription>
            اختر السنة الدراسية لعرض المعلومات المالية الخاصة بها
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>السنة الدراسية</Label>
            <Select
              value={selectedYearId?.toString() || ''}
              onValueChange={(value) => onYearChange(parseInt(value))}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر السنة الدراسية" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{year.year_name}</span>
                      {year.is_active && (
                        <Badge variant="default" className="text-xs">
                          نشطة
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedYear && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">
                      السنة المختارة
                    </span>
                  </div>
                  {selectedYear.is_active && (
                    <Badge variant="default" className="bg-blue-600">
                      السنة النشطة
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">السنة الدراسية:</span>
                    <span className="font-medium text-blue-900">
                      {selectedYear.year_name}
                    </span>
                  </div>
                  
                  {selectedYear.description && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">الوصف:</span>
                      <span className="font-medium text-blue-900">
                        {selectedYear.description}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">الحالة:</span>
                    <Badge
                      variant={selectedYear.is_active ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {selectedYear.is_active ? 'نشطة' : 'غير نشطة'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Information Alert */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
            <p className="font-medium mb-2">ملاحظة:</p>
            <ul className="space-y-1 text-xs">
              <li>• يمكنك اختيار السنة الدراسية فقط، ولا يمكن التعديل عليها من هنا</li>
              <li>• لإضافة أو تعديل السنوات الدراسية، اتصل بالمدير</li>
              <li>• سيتم عرض جميع البيانات المالية بناءً على السنة المختارة</li>
              <li>• يتم حفظ اختيارك تلقائياً</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Recent Years Quick Access */}
      <Card className="ios-card">
        <CardHeader>
          <CardTitle className="text-base">الوصول السريع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {academicYears.slice(0, 5).map((year) => (
              <Button
                key={year.id}
                variant={selectedYearId === year.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onYearChange(year.id)}
                className="relative"
              >
                {year.year_name}
                {year.is_active && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YearSelectionSection;

