import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { TreasurySection } from './TreasurySection';
import { StudentsFinanceSection } from './StudentsFinanceSection';
import { YearSelectionSection } from './YearSelectionSection';
import { Calendar } from 'lucide-react';
import { academicYearsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const FinanceManagerPage: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const activeTab = searchParams.get('tab') || 'treasury';
  
  // Get preselected card from navigation state (from search or quick actions)
  const preselectedCardId = (location.state as any)?.preselectedCardId;
  const openCardPopup = (location.state as any)?.openCardPopup;
  const openAddCardDialog = (location.state as any)?.openAddCardDialog;

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

  // Render section based on tab parameter (navigation through sidebar only)
  const renderSection = () => {
    switch (activeTab) {
      case 'treasury':
        return <TreasurySection 
          academicYearId={selectedYearId} 
          preselectedCardId={preselectedCardId}
          openCardPopup={openCardPopup}
          openAddCardDialog={openAddCardDialog}
        />;
      case 'students':
        return <StudentsFinanceSection academicYearId={selectedYearId} />;
      case 'year':
        return (
          <YearSelectionSection
            selectedYearId={selectedYearId}
            onYearChange={handleYearChange}
          />
        );
      default:
        return <TreasurySection academicYearId={selectedYearId} />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      {renderSection()}
    </div>
  );
};

export default FinanceManagerPage;

