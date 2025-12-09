import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { FinanceCardSummary } from '@/types/school';

interface FinanceCardProps {
  card: FinanceCardSummary;
  onClick?: () => void;
  onDelete?: (cardId: number) => void;
  className?: string;
}

export const FinanceCard: React.FC<FinanceCardProps> = ({ card, onClick, onDelete, className = '' }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'closed':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'partial':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'مفتوح';
      case 'closed':
        return 'مغلق';
      case 'partial':
        return 'جزئي';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income':
        return 'دخل';
      case 'expense':
        return 'خرج';
      case 'both':
        return 'دخل وخرج';
      default:
        return type;
    }
  };

  const isProfit = card.net_amount > 0;
  const isLoss = card.net_amount < 0;

  return (
    <Card
      className={`ios-card hover:shadow-lg transition-all duration-300 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {card.card_name}
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {getTypeLabel(card.card_type)}
              </Badge>
              <Badge variant="outline" className={`text-xs ${getStatusColor(card.status)}`}>
                {getStatusLabel(card.status)}
              </Badge>
              {card.is_default && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                  افتراضي
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {card.incomplete_transactions_count > 0 && (
              <Badge variant="destructive">
                {card.incomplete_transactions_count}
              </Badge>
            )}
            {!card.is_default && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(card.card_id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Income & Expense Summary */}
        {card.card_type !== 'expense' && (
          <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              المدخولات
            </span>
            <span className="font-semibold text-green-700 dark:text-green-400">
              {card.total_income.toLocaleString('ar-SY')} ل.س
            </span>
          </div>
        )}

        {card.card_type !== 'income' && (
          <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              المصروفات
            </span>
            <span className="font-semibold text-red-700 dark:text-red-400">
              {card.total_expenses.toLocaleString('ar-SY')} ل.س
            </span>
          </div>
        )}

        {/* Net Amount (for 'both' type cards) */}
        {card.card_type === 'both' && (
          <div className={`flex justify-between items-center p-3 rounded-lg border ${
            isProfit
              ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
              : isLoss
              ? 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              {isProfit ? (
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              )}
              الصافي
            </span>
            <span className={`font-bold ${
              isProfit
                ? 'text-blue-700 dark:text-blue-400'
                : isLoss
                ? 'text-orange-700 dark:text-orange-400'
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {isProfit && '+'}
              {card.net_amount.toLocaleString('ar-SY')} ل.س
            </span>
          </div>
        )}

        {/* Incomplete Transactions Warning */}
        {card.incomplete_transactions_count > 0 && (
          <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 p-2 rounded-md">
            <AlertCircle className="w-4 h-4" />
            <span>{card.incomplete_transactions_count} معاملة غير مكتملة</span>
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          عرض التفاصيل ←
        </Button>
      </CardContent>
    </Card>
  );
};

export default FinanceCard;

