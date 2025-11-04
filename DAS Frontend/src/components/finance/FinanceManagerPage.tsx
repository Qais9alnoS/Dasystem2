import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TreasurySection } from './TreasurySection';
import { StudentsFinanceSection } from './StudentsFinanceSection';
import { YearSelectionSection } from './YearSelectionSection';
import { Wallet, Users, Calendar } from 'lucide-react';
import { academicYearsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const FinanceManagerPage: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const activeTab = searchParams.get('tab') || 'treasury';

  useEffect(() => {
    loadActiveYear();
  }, []);

  const loadActiveYear = async () => {
    try {
      const response = await academicYearsApi.getAll();
      const activeYear = response.data.find(y => y.is_active);
      if (activeYear) {
        setSelectedYearId(activeYear.id);
      } else if (response.data.length > 0) {
        // If no active year, use the first available
        setSelectedYearId(response.data[0].id);
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تحميل السنة الدراسية',
        variant: 'destructive'
      });
    }
  };

  const handleYearChange = (yearId: number) => {
    setSelectedYearId(yearId);
    toast({
      title: 'تم التحديث',
      description: 'تم تغيير السنة الدراسية بنجاح'
    });
  };

  if (!selectedYearId) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
          <Calendar className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium mb-4">يرجى اختيار سنة دراسية</p>
          <YearSelectionSection
            selectedYearId={selectedYearId}
            onYearChange={handleYearChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">الإدارة المالية</h1>
        <p className="text-gray-600">إدارة المعلومات المالية للمدرسة</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })} className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="treasury" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            الصندوق
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            الطلاب
          </TabsTrigger>
          <TabsTrigger value="year" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            السنة الدراسية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="treasury" className="space-y-4">
          <TreasurySection academicYearId={selectedYearId} />
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <StudentsFinanceSection academicYearId={selectedYearId} />
        </TabsContent>

        <TabsContent value="year" className="space-y-4">
          <YearSelectionSection
            selectedYearId={selectedYearId}
            onYearChange={handleYearChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceManagerPage;

