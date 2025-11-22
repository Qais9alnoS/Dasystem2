import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FinancialSummaryCardProps {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  collectionRate: number;
  loading?: boolean;
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  totalIncome,
  totalExpenses,
  netProfit,
  collectionRate,
  loading = false
}) => {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            نظرة مالية شاملة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-muted">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          نظرة مالية شاملة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Total Income */}
          <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">
                    إجمالي الدخل
                  </p>
                  <p className="text-xl font-bold text-green-800 dark:text-green-200">
                    {totalIncome.toLocaleString('ar-SY')}
                  </p>
                </div>
              </div>
              <Wallet className="h-8 w-8 text-green-600 dark:text-green-400 opacity-50" />
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">ل.س</p>
          </div>

          {/* Total Expenses */}
          <div className="p-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-500 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide">
                    إجمالي المصروفات
                  </p>
                  <p className="text-xl font-bold text-red-800 dark:text-red-200">
                    {totalExpenses.toLocaleString('ar-SY')}
                  </p>
                </div>
              </div>
              <CreditCard className="h-8 w-8 text-red-600 dark:text-red-400 opacity-50" />
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">ل.س</p>
          </div>

          {/* Net Profit */}
          <div
            className={`p-3 bg-gradient-to-r border rounded-lg ${
              netProfit >= 0
                ? 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800'
                : 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-lg ${
                    netProfit >= 0 ? 'bg-blue-500' : 'bg-orange-500'
                  }`}
                >
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      netProfit >= 0
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    صافي الربح
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      netProfit >= 0
                        ? 'text-blue-800 dark:text-blue-200'
                        : 'text-orange-800 dark:text-orange-200'
                    }`}
                  >
                    {netProfit >= 0 ? '+' : ''}
                    {netProfit.toLocaleString('ar-SY')}
                  </p>
                </div>
              </div>
              {netProfit >= 0 ? (
                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-50" />
              ) : (
                <TrendingDown className="h-8 w-8 text-orange-600 dark:text-orange-400 opacity-50" />
              )}
            </div>
            <p
              className={`text-xs font-medium mt-1 ${
                netProfit >= 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-orange-600 dark:text-orange-400'
              }`}
            >
              ل.س
            </p>
          </div>

          {/* Collection Rate */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  نسبة التحصيل
                </p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                  {collectionRate.toFixed(1)}%
                </p>
              </div>
              <div className="relative h-16 w-16">
                <svg className="transform -rotate-90" width="64" height="64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-purple-200 dark:text-purple-800"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - collectionRate / 100)}`}
                    className="text-purple-600 dark:text-purple-400"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
