import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { getChartTheme, chartAnimation } from './chartTheme';

interface DataPoint {
  name: string;
  value: number;
}

interface BarChartProps {
  data: DataPoint[];
  title?: string;
  horizontal?: boolean;
  height?: string;
  stacked?: boolean;
  series?: Array<{
    name: string;
    data: number[];
  }>;
  loading?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  horizontal = false,
  height = '400px',
  stacked = false,
  series,
  loading = false
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current || chartInstance.current.isDisposed()) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const isDark = document.documentElement.classList.contains('dark');
    const theme = getChartTheme();

    // Handle empty or all-zero data
    const hasData = data && data.length > 0;
    const chartData = hasData ? data : [{ name: 'لا توجد بيانات', value: 0 }];

    const option: any = {
      ...theme,
      title: title ? {
        text: title,
        left: 'center',
        textStyle: {
          color: isDark ? '#e5e7eb' : '#374151',
          fontSize: 14,
          fontWeight: 'bold'
        }
      } : undefined,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: isDark ? '#1f2937' : '#fff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        textStyle: {
          color: isDark ? '#e5e7eb' : '#374151'
        }
      },
      legend: series && series.length > 1 ? {
        data: series.map(s => s.name),
        bottom: 0
      } : undefined,
      grid: {
        left: '3%',
        right: '4%',
        bottom: series && series.length > 1 ? '15%' : '10%',
        top: title ? '15%' : '10%',
        containLabel: true
      },
      xAxis: {
        type: horizontal ? 'value' : 'category',
        data: horizontal ? undefined : chartData.map(d => d.name),
        axisLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#e5e7eb'
          }
        },
        axisLabel: {
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#f3f4f6'
          }
        }
      },
      yAxis: {
        type: horizontal ? 'category' : 'value',
        data: horizontal ? chartData.map(d => d.name) : undefined,
        axisLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#e5e7eb'
          }
        },
        axisLabel: {
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#f3f4f6'
          }
        }
      },
      series: series ? series.map((s, index) => ({
        name: s.name,
        type: 'bar',
        data: s.data,
        stack: stacked ? 'total' : undefined,
        itemStyle: {
          color: theme.color[index % theme.color.length],
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]
        },
        animationDuration: chartAnimation.duration,
        animationEasing: chartAnimation.easing
      })) : [{
        name: title || 'البيانات',
        type: 'bar',
        data: chartData.map(d => d.value),
        itemStyle: {
          color: theme.color[0],
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]
        },
        animationDuration: chartAnimation.duration,
        animationEasing: chartAnimation.easing
      }]
    };

    if (chartInstance.current && !chartInstance.current.isDisposed()) {
      chartInstance.current.setOption(option);

      if (loading) {
        chartInstance.current.showLoading();
      } else {
        chartInstance.current.hideLoading();
      }
    }

    const handleResize = () => {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [data, title, horizontal, stacked, series, loading]);

  useEffect(() => {
    return () => {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
};

export default BarChart;
