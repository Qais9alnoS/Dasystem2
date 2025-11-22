import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MetricCard from './MetricCard';
import LineChart from './LineChart';
import BarChart from './BarChart';
import PieChart from './PieChart';
import TimePeriodToggle, { PeriodType } from './TimePeriodToggle';
import api from '../../services/api';

const FinanceAnalyticsDashboard: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [incomeTrends, setIncomeTrends] = useState<any>(null);
  const [expenseTrends, setExpenseTrends] = useState<any>(null);
  const [outstanding, setOutstanding] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<number>(1);

  useEffect(() => {
    fetchFinancialData();
  }, [period, academicYear]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        academic_year_id: academicYear.toString(),
        period_type: period
      }).toString();

      const [overviewRes, incomeRes, expenseRes, outstandingRes] = await Promise.all([
        api.get(`/analytics/finance/overview?${queryParams}`),
        api.get(`/analytics/finance/income-trends?${queryParams}`),
        api.get(`/analytics/finance/expense-trends?${queryParams}`),
        api.get(`/analytics/finance/outstanding-payments?academic_year_id=${academicYear}&limit=20`)
      ]);

      setOverview(overviewRes.data);
      setIncomeTrends(incomeRes.data);
      setExpenseTrends(expenseRes.data);
      setOutstanding(outstandingRes.data);
    } catch (error) {
      console.error('Failed to fetch financial analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">التحليلات المالية</h1>
          <p className="text-muted-foreground mt-1">تحليل شامل للدخل والمصروفات</p>
        </div>
        <TimePeriodToggle value={period} onChange={setPeriod} />
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="إجمالي الدخل"
          value={overview?.summary?.total_income?.toLocaleString() || 0}
          icon={DollarSign}
          color="success"
          loading={loading}
          subtitle="ل.س"
        />
        <MetricCard
          title="إجمالي المصروفات"
          value={overview?.summary?.total_expenses?.toLocaleString() || 0}
          icon={Wallet}
          color="danger"
          loading={loading}
          subtitle="ل.س"
        />
        <MetricCard
          title="صافي الربح"
          value={overview?.summary?.net_profit?.toLocaleString() || 0}
          icon={TrendingUp}
          color={overview?.summary?.net_profit >= 0 ? 'accent' : 'warning'}
          loading={loading}
          subtitle="ل.س"
        />
        <MetricCard
          title="نسبة التحصيل"
          value={`${overview?.collection?.collection_rate || 0}%`}
          icon={CreditCard}
          color="primary"
          loading={loading}
        />
      </div>

      {/* Income & Expense Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>اتجاه الدخل</CardTitle>
          </CardHeader>
          <CardContent>
          <LineChart
            series={[
              {
                name: 'مدفوعات الطلاب',
                data: incomeTrends?.student_payments?.map((d: any) => d.amount) || []
              },
              {
                name: 'دخل آخر',
                data: incomeTrends?.other_income?.map((d: any) => d.amount) || []
              }
            ]}
            data={incomeTrends?.student_payments?.map((d: any) => ({
              name: d.period ? new Date(d.period).toLocaleDateString('ar-SY', { month: 'short' }) : '',
              value: d.amount
            })) || []}
            height="350px"
            showArea
            yAxisLabel="المبلغ (ل.س)"
            loading={loading}
          />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>اتجاه المصروفات</CardTitle>
          </CardHeader>
          <CardContent>
          <LineChart
            data={expenseTrends?.expense_trend?.map((d: any) => ({
              name: d.period ? new Date(d.period).toLocaleDateString('ar-SY', { month: 'short' }) : '',
              value: d.amount
            })) || []}
            height="350px"
            showArea
            yAxisLabel="المبلغ (ل.س)"
            loading={loading}
          />
          </CardContent>
        </Card>
      </div>

      {/* Income & Expense by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>الدخل حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
          <PieChart
            data={incomeTrends?.by_category?.map((c: any) => ({
              name: c.category,
              value: c.total
            })) || []}
            height="350px"
            loading={loading}
          />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المصروفات حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
          <PieChart
            data={expenseTrends?.by_category?.map((c: any) => ({
              name: c.category,
              value: c.total
            })) || []}
            donut
            height="350px"
            loading={loading}
          />
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Payments */}
      {outstanding?.outstanding_payments && outstanding.outstanding_payments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>المدفوعات المستحقة</CardTitle>
              <div className="text-sm text-muted-foreground">
                الإجمالي: <span className="font-bold text-red-600 dark:text-red-400">
                  {outstanding.total_outstanding?.toLocaleString()} ل.س
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">اسم الطالب</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">الصف</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">المبلغ المستحق</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">المبلغ المدفوع</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">الرصيد</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">نسبة الدفع</th>
                  </tr>
                </thead>
                <tbody>
                  {outstanding.outstanding_payments.map((payment: any, index: number) => (
                    <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {payment.student_name}
                      </td>
                      <td className="px-4 py-3 text-sm">{payment.grade}</td>
                      <td className="px-4 py-3 text-sm">
                        {payment.total_due?.toLocaleString()} <span className="text-xs text-muted-foreground">ل.س</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                        {payment.total_paid?.toLocaleString()} <span className="text-xs">ل.س</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          {payment.balance?.toLocaleString()} ل.س
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-green-500 dark:bg-green-600 h-2 rounded-full"
                              style={{ width: `${payment.payment_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{payment.payment_percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinanceAnalyticsDashboard;
