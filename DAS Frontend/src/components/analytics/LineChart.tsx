import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { getChartTheme, chartAnimation } from './chartTheme';

interface DataPoint {
  name: string;
  value: number | number[];
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  height?: string;
  showArea?: boolean;
  smooth?: boolean;
  xAxisType?: 'category' | 'value' | 'time';
  yAxisLabel?: string;
  series?: Array<{
    name: string;
    data: number[];
    color?: string;
  }>;
  loading?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  subtitle,
  height = '400px',
  showArea = false,
  smooth = true,
  xAxisType = 'category',
  yAxisLabel,
  series,
  loading = false
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstance.current || chartInstance.current.isDisposed()) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Detect dark mode
    const isDark = document.documentElement.classList.contains('dark');
    const theme = getChartTheme();

    // Handle empty or all-zero data
    const hasData = data && data.length > 0;
    const chartData = hasData ? data : [{ name: 'لا توجد بيانات', value: 0 }];

    // Prepare options
    const option: echarts.EChartsOption = {
      ...theme,
      title: title ? {
        text: title,
        subtext: subtitle,
        left: 'center',
        textStyle: {
          color: isDark ? '#e5e7eb' : '#374151',
          fontSize: 14,
          fontWeight: 'bold'
        },
        subtextStyle: {
          color: isDark ? '#9ca3af' : '#6b7280'
        }
      } : undefined,
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1f2937' : '#fff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        textStyle: {
          color: isDark ? '#e5e7eb' : '#374151'
        },
        formatter: (params: any) => {
          if (Array.isArray(params)) {
            let result = `<strong>${params[0].axisValue}</strong><br/>`;
            params.forEach((param: any) => {
              result += `${param.marker} ${param.seriesName}: <strong>${param.value.toLocaleString()}</strong><br/>`;
            });
            return result;
          }
          return '';
        }
      },
      legend: series && series.length > 1 ? {
        data: series.map(s => s.name),
        bottom: 0,
        ...theme.legend
      } : undefined,
      grid: {
        ...theme.grid,
        top: title ? '15%' : '10%',
        bottom: series && series.length > 1 ? '15%' : '10%'
      },
      xAxis: {
        type: xAxisType as any,
        data: chartData.map(d => d.name),
        boundaryGap: !showArea,
        axisLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#e5e7eb'
          }
        },
        axisLabel: {
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        name: yAxisLabel,
        nameTextStyle: {
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: 11
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: 11,
          formatter: (value: number) => value.toLocaleString()
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series: (series ? series.map((s, index) => ({
        name: s.name,
        type: 'line',
        data: s.data,
        smooth,
        areaStyle: showArea ? {
          opacity: 0.3
        } : undefined,
        itemStyle: {
          color: s.color || theme.color[index % theme.color.length]
        },
        lineStyle: {
          width: 2
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          focus: 'series',
          blurScope: 'coordinateSystem'
        },
        animationDuration: chartAnimation.duration,
        animationEasing: chartAnimation.easing as any
      })) : [{
        name: title || 'البيانات',
        type: 'line',
        data: chartData.map(d => d.value),
        smooth,
        areaStyle: showArea ? {
          opacity: 0.3,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
          ])
        } : undefined,
        itemStyle: {
          color: theme.color[0]
        },
        lineStyle: {
          width: 2
        },
        symbol: 'circle',
        symbolSize: 6,
        animationDuration: chartAnimation.duration,
        animationEasing: chartAnimation.easing as any
      }]) as any
    };

    if (chartInstance.current && !chartInstance.current.isDisposed()) {
      chartInstance.current.setOption(option);

      // Handle loading state
      if (loading) {
        chartInstance.current.showLoading({
          text: 'جاري التحميل...',
          color: theme.color[0],
          textColor: isDark ? '#9ca3af' : '#6b7280',
          maskColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.8)'
        });
      } else {
        chartInstance.current.hideLoading();
      }
    }

    // Handle window resize
    const handleResize = () => {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, title, subtitle, showArea, smooth, xAxisType, yAxisLabel, series, loading]);

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

export default LineChart;
