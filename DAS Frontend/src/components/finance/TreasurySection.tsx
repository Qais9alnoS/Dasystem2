import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FinanceCard } from './FinanceCard';
import { FinanceCardDetailModal } from './FinanceCardDetailModal';
import { AddFinanceCardModal } from './AddFinanceCardModal';
import { Plus, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { financeManagerApi } from '@/services/api';
import { FinanceManagerDashboard, FinanceCardSummary } from '@/types/school';
import { useToast } from '@/hooks/use-toast';

interface TreasurySectionProps {
  academicYearId: number;
}

export const TreasurySection: React.FC<TreasurySectionProps> = ({ academicYearId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<FinanceManagerDashboard | null>(null);
  const [selectedCardType, setSelectedCardType] = useState<'all' | 'activity' | 'student' | 'custom'>('all');
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (academicYearId) {
      loadDashboard();
    }
  }, [academicYearId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await financeManagerApi.getDashboard(academicYearId);
      setDashboard(response.data);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تحميل بيانات الصندوق',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (card: FinanceCardSummary) => {
    setSelectedCard(card.card_id);
    setShowDetailModal(true);
  };

  const handleAddCard = () => {
    setShowAddModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCard(null);
  };

  const handleUpdate = () => {
    loadDashboard();
  };

  const filteredCards = dashboard?.finance_cards.filter(card => {
    if (selectedCardType === 'all') return true;
    
    // Determine card category based on name or properties
    if (card.card_name.includes('طلاب') || card.card_name.includes('Students')) {
      return selectedCardType === 'student';
    }
    if (card.card_name.includes('نشاط') || card.card_name.includes('Activity')) {
      return selectedCardType === 'activity';
    }
    return selectedCardType === 'custom';
  }) || [];

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* صافي الربح */}
        <Card className="ios-card border-t-4 border-t-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              صافي الربح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (dashboard?.net_profit || 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {(dashboard?.net_profit || 0).toLocaleString('ar-SY')} ل.س
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              دخل: {(dashboard?.summary.total_income || 0).toLocaleString('ar-SY')} - 
              خرج: {(dashboard?.summary.total_expenses || 0).toLocaleString('ar-SY')}
            </div>
          </CardContent>
        </Card>

        {/* الديون المستحقة للمدرسة */}
        <Card className="ios-card border-t-4 border-t-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              الديون المستحقة للمدرسة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(dashboard?.total_receivables || 0).toLocaleString('ar-SY')} ل.س
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              المبالغ التي لم تُحصّل بعد
            </div>
          </CardContent>
        </Card>

        {/* الديون المستحقة على المدرسة */}
        <Card className="ios-card border-t-4 border-t-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              الديون المستحقة على المدرسة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {(dashboard?.total_payables || 0).toLocaleString('ar-SY')} ل.س
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              المبالغ التي لم تُدفع بعد
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Add Button */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={selectedCardType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCardType('all')}
          >
            الكل
          </Button>
          <Button
            variant={selectedCardType === 'student' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCardType('student')}
          >
            الطلاب
          </Button>
          <Button
            variant={selectedCardType === 'activity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCardType('activity')}
          >
            النشاطات
          </Button>
          <Button
            variant={selectedCardType === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCardType('custom')}
          >
            مخصص
          </Button>
        </div>
        
        <Button onClick={handleAddCard} size="sm">
          <Plus className="w-4 h-4 ml-2" />
          إضافة كارد
        </Button>
      </div>

      {/* Finance Cards Grid */}
      {filteredCards.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            لا توجد كاردات مالية. قم بإضافة كارد جديد للبدء.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
            <FinanceCard
              key={card.card_id}
              card={card}
              onClick={() => handleCardClick(card)}
            />
          ))}
        </div>
      )}

      {/* Finance Card Detail Modal */}
      {selectedCard && (
        <FinanceCardDetailModal
          open={showDetailModal}
          onClose={handleCloseDetailModal}
          cardId={selectedCard}
          academicYearId={academicYearId}
          onUpdate={handleUpdate}
        />
      )}

      {/* Add Finance Card Modal */}
      <AddFinanceCardModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        academicYearId={academicYearId}
        onSuccess={handleUpdate}
      />
    </div>
  );
};

export default TreasurySection;

