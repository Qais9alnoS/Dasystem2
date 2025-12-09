import React from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LineChart from '@/components/analytics/LineChart';
import PieChart from '@/components/analytics/PieChart';

interface FinanceTrendsCardProps {
  incomeTrends: any;
  expenseTrends: any;
  periodFilter: 'daily' | 'weekly' | 'monthly' | 'yearly';
  loading?: boolean;
}

export const FinanceTrendsCard: React.FC<FinanceTrendsCardProps> = ({
  incomeTrends,
  expenseTrends,
  periodFilter,
  loading = false
}) => {
  // Prepare data for income vs expense comparison
  const getComparisonData = () => {
    const studentPayments = incomeTrends?.student_payments || [];
    const expenses = expenseTrends?.expense_trend || [];

    // Get all unique periods
    const periods = new Set([
      ...studentPayments.map((d: any) => d.period),
      ...expenses.map((d: any) => d.period)
    ]);

    return Array.from(periods).sort().map((period: any) => ({
      name: period ? new Date(period).toLocaleDateString('ar-SY', {
        month: 'short',
        ...(periodFilter === 'daily' && { day: 'numeric' })
      }) : '',
      value: 0
    }));
  };

  const getIncomeData = () => {
    return (incomeTrends?.student_payments || []).map((d: any) => d.amount || 0);
  };

  const getExpenseData = () => {
    return (expenseTrends?.expense_trend || []).map((d: any) => d.amount || 0);
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>اتجاهات الدخل والمصروفات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 animate-pulse">
            <div className="h-80 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="h-64 bg-muted rounded-lg"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          اتجاهات الدخل والمصروفات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Income vs Expense Line Chart */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">مقارنة الدخل والمصروفات</h4>
          <LineChart
            data={getComparisonData()}
            height="320px"
            showArea={false}
            yAxisLabel="المبلغ (ل.س)"
            loading={loading}
            series={[
              {
                name: 'الدخل',
                data: getIncomeData(),
                color: '#10b981'
              },
              {
                name: 'المصروفات',
                data: getExpenseData(),
                color: '#ef4444'
              }
            ]}
          />
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income by Category */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              الدخل حسب الفئة
            </h4>
            <PieChart
              data={(incomeTrends?.by_category || []).map((c: any) => ({
                name: c.category === 'student_payment' ? 'مدفوعات الطلاب' :
                      c.category === 'other' ? 'دخل آخر' : c.category,
                value: c.total
              }))}
              height="260px"
              loading={loading}
            />
          </div>

          {/* Expense by Category */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              المصروفات حسب الفئة
            </h4>
            <PieChart
              data={(expenseTrends?.by_category || []).map((c: any) => ({
                name: c.category === 'salary' ? 'رواتب' :
                      c.category === 'maintenance' ? 'صيانة' :
                      c.category === 'supplies' ? 'لوازم' : c.category,
                value: c.total
              }))}
              height="260px"
              donut
              loading={loading}
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
              متوسط الدخل
            </p>
            <p className="text-lg font-bold text-green-800 dark:text-green-200">
              {getIncomeData().length > 0
                ? Math.round(getIncomeData().reduce((a: number, b: number) => a + b, 0) / getIncomeData().length).toLocaleString('ar-SY')
                : 0}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">ل.س</p>
          </div>

          <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
              متوسط المصروفات
            </p>
            <p className="text-lg font-bold text-red-800 dark:text-red-200">
              {getExpenseData().length > 0
                ? Math.round(getExpenseData().reduce((a: number, b: number) => a + b, 0) / getExpenseData().length).toLocaleString('ar-SY')
                : 0}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">ل.س</p>
          </div>

          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              الفرق
            </p>
            <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
              {(() => {
                const avgIncome = getIncomeData().length > 0
                  ? getIncomeData().reduce((a: number, b: number) => a + b, 0) / getIncomeData().length
                  : 0;
                const avgExpense = getExpenseData().length > 0
                  ? getExpenseData().reduce((a: number, b: number) => a + b, 0) / getExpenseData().length
                  : 0;
                const diff = avgIncome - avgExpense;
                return `${diff >= 0 ? '+' : ''}${Math.round(diff).toLocaleString('ar-SY')}`;
              })()}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">ل.س</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
