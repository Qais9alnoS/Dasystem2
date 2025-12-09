import React, { useEffect, useRef } from 'react';
import echarts, { type EChartsOption, type ECharts } from '@/lib/echarts-custom';
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
  color?: string; // Custom color for single series
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
  loading = false,
  color
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstance.current || chartInstance.current.isDisposed()) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const updateChart = () => {
      // Detect dark mode
      const isDark = document.documentElement.classList.contains('dark');
      const theme = getChartTheme();

    // Handle empty or all-zero data
    const hasData = data && data.length > 0;
    const chartData = hasData ? data : [{ name: 'لا توجد بيانات', value: 0 }];

    // Filter theme to only include components we have imported
    const { timeline, visualMap, dataZoom, markPoint, ...filteredTheme } = theme;

    // Prepare chart options
    const option: EChartsOption = {
      ...filteredTheme,
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
        textStyle: {
          color: isDark ? '#e5e7eb' : '#374151',
          fontSize: 12
        },
        ...theme.legend
      } : {
        show: false
      },
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
          width: 2,
          color: s.color || theme.color[index % theme.color.length]
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
          color: color ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${color}4D` }, // 30% opacity
            { offset: 1, color: `${color}0D` }  // 5% opacity
          ]) : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
          ])
        } : undefined,
        itemStyle: {
          color: color || theme.color[0]
        },
        lineStyle: {
          width: 2,
          color: color || theme.color[0]
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
    };

    updateChart();

    // Handle window resize
    const handleResize = () => {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.resize();
      }
    };

    // Observer for dark mode changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateChart();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [data, title, subtitle, showArea, smooth, xAxisType, yAxisLabel, series, loading, color]);

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
