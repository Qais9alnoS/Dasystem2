import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { getChartTheme } from './chartTheme';

interface DataPoint {
  name: string;
  value: number;
}

interface PieChartProps {
  data: DataPoint[];
  title?: string;
  height?: string;
  donut?: boolean;
  loading?: boolean;
  colors?: string[];
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  height = '400px',
  donut = false,
  loading = false,
  colors
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    try {
      if (!chartInstance.current || chartInstance.current.isDisposed()) {
        chartInstance.current = echarts.init(chartRef.current);
      }
    } catch (error) {
      console.error('PieChart: Failed to initialize', error);
      return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const theme = getChartTheme();

    // Handle empty or all-zero data
    const hasData = data && data.length > 0 && data.some(d => d.value > 0);
    const chartData = hasData ? data : [{ name: 'لا توجد بيانات', value: 1 }];

    const option: any = {
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
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
        backgroundColor: isDark ? '#1f2937' : '#fff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        textStyle: {
          color: isDark ? '#e5e7eb' : '#374151'
        }
      },
      legend: hasData ? {
        orient: 'horizontal',
        bottom: '5%',
        left: 'center',
        textStyle: {
          color: isDark ? '#9ca3af' : '#374151',
          fontSize: 12
        },
        itemGap: 15,
        itemWidth: 14,
        itemHeight: 14
      } : undefined,
      series: [{
        name: title || 'البيانات',
        type: 'pie',
        radius: donut ? ['35%', '55%'] : '55%',
        center: ['50%', '40%'],
        data: chartData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: false // Hide labels, use legend instead
        },
        labelLine: {
          show: false
        },
        itemStyle: {
          borderRadius: 4,
          borderColor: isDark ? '#1f2937' : '#fff',
          borderWidth: 2
        }
      }],
      color: colors || theme.color
    };

    try {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.setOption(option);
        
        if (loading) {
          chartInstance.current.showLoading();
        } else {
          chartInstance.current.hideLoading();
        }
      }
    } catch (error) {
      console.error('PieChart: Failed to set option', error);
      return;
    }

    const handleResize = () => {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [data, title, donut, loading, colors]);

  useEffect(() => {
    return () => {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height, minHeight: height }}>
      <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default PieChart;
