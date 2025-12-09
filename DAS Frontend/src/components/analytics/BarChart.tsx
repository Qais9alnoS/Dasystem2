import React, { useEffect, useRef } from 'react';
import echarts, { type ECharts } from '@/lib/echarts-custom';
import { chartAnimation } from './chartTheme';

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
    color?: string;
  }>;
  colors?: string[];
  categories?: string[];
  loading?: boolean;
  showLegend?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  horizontal = false,
  height = '400px',
  stacked = false,
  series,
  colors,
  categories,
  loading = false,
  showLegend = true
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current || chartInstance.current.isDisposed()) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const updateChart = () => {
      const isDark = document.documentElement.classList.contains('dark');

      // Default colors if not provided
      const defaultColors = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];
      const chartColors = colors || defaultColors;

      // Handle empty or all-zero data
      const hasData = data && data.length > 0;
      const chartData = hasData ? data : [{ name: 'لا توجد بيانات', value: 0 }];
      const xAxisData = categories || chartData.map(d => d.name);

      const option: any = {
        backgroundColor: 'transparent',
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
          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: isDark ? '#374151' : '#e5e7eb',
          borderRadius: 8,
          textStyle: {
            color: isDark ? '#e5e7eb' : '#374151',
            fontSize: 13
          }
        },
        legend: (series && series.length > 1 && showLegend) ? {
          data: series.map(s => s.name),
          bottom: 0,
          selectedMode: true, // Enable clickable legend
          textStyle: {
            color: isDark ? '#e5e7eb' : '#374151',
            fontSize: 12
          },
          itemWidth: 14,
          itemHeight: 14,
          itemGap: 16,
          icon: 'roundRect'
        } : undefined,
        grid: {
          left: '3%',
          right: '4%',
          bottom: (series && series.length > 1 && showLegend) ? '15%' : '8%',
          top: title ? '15%' : '8%',
          containLabel: true
        },
        xAxis: {
          type: horizontal ? 'value' : 'category',
          data: horizontal ? undefined : xAxisData,
          axisLine: {
            lineStyle: {
              color: isDark ? '#374151' : '#e5e7eb'
            }
          },
          axisLabel: {
            color: isDark ? '#e5e7eb' : '#374151',
            fontSize: 11,
            fontWeight: 500,
            rotate: xAxisData.length > 6 ? 45 : 0
          },
          splitLine: {
            show: false
          }
        },
        yAxis: {
          type: horizontal ? 'category' : 'value',
          data: horizontal ? xAxisData : undefined,
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
              color: isDark ? '#374151' : '#f3f4f6',
              type: 'dashed'
            }
          }
        },
        series: series ? series.map((s, index) => ({
          name: s.name,
          type: 'bar',
          data: s.data,
          stack: stacked ? 'total' : undefined,
          barMaxWidth: 40,
          barGap: '20%',
          itemStyle: {
            color: s.color || chartColors[index % chartColors.length],
            borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
            }
          },
          animationDuration: chartAnimation.duration,
          animationEasing: chartAnimation.easing
        })) : [{
          name: title || 'البيانات',
          type: 'bar',
          data: chartData.map(d => d.value),
          barMaxWidth: 40,
          itemStyle: {
            color: chartColors[0],
            borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
            }
          },
          animationDuration: chartAnimation.duration,
          animationEasing: chartAnimation.easing
        }]
      };

      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.setOption(option, true); // true = replace all options

        if (loading) {
          chartInstance.current.showLoading({
            text: '',
            color: isDark ? '#3B82F6' : '#F59E0B',
            maskColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)'
          });
        } else {
          chartInstance.current.hideLoading();
        }
      }
    };

    updateChart();

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
  }, [data, title, horizontal, stacked, series, colors, categories, loading, showLegend]);

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
