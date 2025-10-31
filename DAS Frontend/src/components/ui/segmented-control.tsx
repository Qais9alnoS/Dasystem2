import * as React from "react";
import { cn } from "@/lib/utils";

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  ({ options, value, onValueChange, className }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          "inline-flex h-11 items-center rounded-2xl bg-muted p-1",
          className
        )}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "relative z-10 flex-1 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200",
              value === option.value
                ? "text-primary-foreground shadow-ios"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onValueChange(option.value)}
            style={{
              backgroundColor: value === option.value ? "hsl(var(--primary))" : "transparent",
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }
);
SegmentedControl.displayName = "SegmentedControl";

export { SegmentedControl };