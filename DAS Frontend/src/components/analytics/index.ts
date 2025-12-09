/**
 * Analytics Components Index
 * Central export file for all analytics-related components
 */

// Chart Components
export { default as LineChart } from './LineChart';
export { default as BarChart } from './BarChart';
export { default as PieChart } from './PieChart';

// Utility Components
export { default as MetricCard } from './MetricCard';
export { default as TimePeriodToggle } from './TimePeriodToggle';

// Dashboard Components
export { default as FinanceAnalyticsDashboard } from './FinanceAnalyticsDashboard';
export { default as StudentAnalyticsPage } from './StudentAnalyticsPage';

// Theme Configuration
export { getChartTheme, chartAnimation, getResponsiveOptions } from './chartTheme';
