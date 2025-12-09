import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'وضع النهار';
      case 'dark':
        return 'وضع الليل';
      default:
        return 'تلقائي';
    }
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return (
          <Sun
            className="h-4 w-4"
            style={{ color: 'hsl(38, 92%, 58%)' }} // Accent yellow
            strokeWidth={2}
          />
        );
      case 'dark':
        return (
          <Moon
            className="h-4 w-4"
            style={{ color: 'hsl(211, 86%, 56%)' }} // Primary blue
            strokeWidth={2}
          />
        );
      default:
        return (
          <Monitor
            className="h-4 w-4 dark:text-white text-black"
            strokeWidth={2}
          />
        );
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="group relative flex items-center">
      <button
        onClick={cycleTheme}
        className="h-9 w-10 flex items-center justify-center rounded-xl bg-[hsl(var(--muted))]/60 border border-[hsl(var(--border))]/40 transition-all duration-200 hover:bg-[hsl(var(--muted))]/80"
        aria-label={getThemeLabel()}
      >
        {getIcon()}
      </button>

      {/* Label that appears below the button on hover */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-popover border border-border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        <span className="text-xs text-popover-foreground">{getThemeLabel()}</span>
      </div>
    </div>
  );
};
