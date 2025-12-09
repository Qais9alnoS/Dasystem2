import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { TreasurySection } from './TreasurySection';
import { StudentsFinanceSection } from './StudentsFinanceSection';
import { Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const FinanceManagerPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [yearName, setYearName] = useState<string>('');
  const activeTab = searchParams.get('tab') || 'treasury';

  // Get preselected card from navigation state (from search or quick actions)
  const preselectedCardId = (location.state as any)?.preselectedCardId;
  const openCardPopup = (location.state as any)?.openCardPopup;
  const openAddCardDialog = (location.state as any)?.openAddCardDialog;

  // Get preselected student from navigation state (from search)
  const preselectedStudentId = (location.state as any)?.preselectedStudentId;
  const openFinancePopup = (location.state as any)?.openFinancePopup;
  const studentData = (location.state as any)?.studentData;

  // Load selected academic year from localStorage
  useEffect(() => {
    const yearId = localStorage.getItem('selected_academic_year_id');
    const yearNameStored = localStorage.getItem('selected_academic_year_name');

    if (yearId) {
      setSelectedYearId(parseInt(yearId, 10));
      setYearName(yearNameStored || '');
    }
  }, []);

  // Listen for changes in academic year selection
  useEffect(() => {
    const handleStorageChange = () => {
      const yearId = localStorage.getItem('selected_academic_year_id');
      const yearNameStored = localStorage.getItem('selected_academic_year_name');

      if (yearId) {
        setSelectedYearId(parseInt(yearId, 10));
        setYearName(yearNameStored || '');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!selectedYearId) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
          <Calendar className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium mb-4">لم يتم اختيار سنة دراسية</p>
          <p className="text-sm text-muted-foreground mb-6">يرجى اختيار سنة دراسية من صفحة إدارة السنوات الدراسية</p>
          <button
            onClick={() => navigate('/academic-years')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            الذهاب إلى إدارة السنوات الدراسية
          </button>
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
        return <StudentsFinanceSection
          academicYearId={selectedYearId}
          preselectedStudentId={preselectedStudentId}
          openFinancePopup={openFinancePopup}
          studentData={studentData}
        />;
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

