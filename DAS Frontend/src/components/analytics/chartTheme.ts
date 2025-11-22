/**
 * ECharts Theme Configuration - iOS-Inspired Pro Design
 * Premium design with glassmorphism and modern AI aesthetics
 */

export const getChartTheme = () => {
  // Get CSS variables from document
  const root = document.documentElement;
  const primaryColor = getComputedStyle(root).getPropertyValue('--primary-color').trim() || '#007AFF';
  const accentColor = getComputedStyle(root).getPropertyValue('--accent-color').trim() || '#34C759';
  const secondaryAccent = getComputedStyle(root).getPropertyValue('--secondary-accent').trim() || '#AF52DE';

  return {
    color: [
      primaryColor,     // iOS Blue
      accentColor,      // iOS Green
      secondaryAccent,  // iOS Purple
      '#FF9500',        // iOS Orange
      '#FF3B30',        // iOS Red
      '#5AC8FA',        // iOS Teal
      '#FF2D55',        // iOS Pink
      '#5856D6',        // iOS Indigo
      '#FFCC00',        // iOS Yellow
    ],
    backgroundColor: 'transparent',
    textStyle: {
      fontFamily: '"Tajawal", "Plus Jakarta Sans", sans-serif',
      fontSize: 13,
      color: '#1d1d1f',
      fontWeight: 500
    },
    title: {
      textStyle: {
        color: '#1d1d1f',
        fontSize: 20,
        fontWeight: 700,
        fontFamily: '"Tajawal", "Plus Jakarta Sans", sans-serif'
      },
      subtextStyle: {
        color: '#86868b',
        fontSize: 14,
        fontWeight: 400
      }
    },
    line: {
      smooth: 0.4, // iOS-style smooth curves
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 3,
        shadowBlur: 8,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffsetY: 2
      }
    },
    bar: {
      barMaxWidth: 48,
      barGap: '20%',
      itemStyle: {
        borderRadius: [8, 8, 0, 0], // iOS rounded corners
        shadowBlur: 12,
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        shadowOffsetY: 4
      }
    },
    pie: {
      itemStyle: {
        borderRadius: 8,
        borderColor: '#ffffff',
        borderWidth: 3,
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffsetY: 2
      },
      label: {
        color: '#1d1d1f',
        fontWeight: 600,
        fontSize: 13
      },
      labelLine: {
        lineStyle: {
          color: '#d2d2d7'
        }
      }
    },
    radar: {
      shape: 'circle' as const,
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      splitArea: {
        show: false
      }
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '3%',
      top: '12%',
      containLabel: true
    },
    legend: {
      textStyle: {
        color: '#1d1d1f',
        fontSize: 13,
        fontWeight: 600
      },
      pageIconColor: primaryColor,
      pageIconInactiveColor: '#d2d2d7',
      pageTextStyle: {
        color: '#86868b',
        fontWeight: 500
      },
      icon: 'roundRect',
      itemGap: 16,
      itemWidth: 12,
      itemHeight: 12
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: 'rgba(0, 0, 0, 0.04)',
      borderWidth: 0,
      borderRadius: 12,
      padding: [12, 16],
      textStyle: {
        color: '#1d1d1f',
        fontSize: 13,
        fontWeight: 500
      },
      shadowBlur: 24,
      shadowColor: 'rgba(0, 0, 0, 0.12)',
      shadowOffsetY: 8,
      axisPointer: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.15)',
          width: 1.5
        },
        crossStyle: {
          color: 'rgba(0, 0, 0, 0.15)'
        }
      }
    },
    axisPointer: {
      lineStyle: {
        color: '#d1d5db',
        width: 1
      },
      crossStyle: {
        color: '#d1d5db',
        width: 1
      }
    },
    timeline: {
      lineStyle: {
        color: primaryColor
      },
      itemStyle: {
        color: primaryColor
      },
      controlStyle: {
        color: primaryColor,
        borderColor: primaryColor
      }
    },
    visualMap: {
      textStyle: {
        color: '#374151'
      },
      inRange: {
        color: [accentColor, primaryColor]
      }
    },
    dataZoom: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      dataBackgroundColor: '#e5e7eb',
      fillerColor: 'rgba(59, 130, 246, 0.2)',
      handleColor: primaryColor,
      handleSize: '100%',
      textStyle: {
        color: '#374151'
      }
    },
    markPoint: {
      label: {
        color: '#fff'
      },
      emphasis: {
        label: {
          color: '#fff'
        }
      }
    }
  };
};

// iOS-style spring animation
export const chartAnimation = {
  duration: 1000,
  easing: 'elasticOut' // iOS spring effect
};

export const getResponsiveOptions = (isMobile: boolean = false) => {
  return {
    grid: {
      left: isMobile ? '5%' : '2%',
      right: isMobile ? '5%' : '2%',
      bottom: isMobile ? '15%' : '3%',
      top: isMobile ? '20%' : '12%',
      containLabel: true
    },
    legend: {
      orient: isMobile ? 'horizontal' : 'vertical',
      left: isMobile ? 'center' : 'auto',
      top: isMobile ? 'top' : 'middle',
      right: isMobile ? 'auto' : '2%',
      itemGap: isMobile ? 12 : 16
    }
  };
};

// iOS color gradients for premium look
export const getIOSGradient = (color: string, opacity: number = 0.2) => {
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` },
      { offset: 1, color: `${color}05` }
    ]
  };
};
