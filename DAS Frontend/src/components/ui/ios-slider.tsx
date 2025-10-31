import * as React from "react";
import { cn } from "@/lib/utils";

interface IOSSliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  thumbColor?: string;
  trackColor?: string;
  progressColor?: string;
}

const IOSSlider = React.forwardRef<HTMLInputElement, IOSSliderProps>(
  ({ className, thumbColor = "hsl(var(--primary))", trackColor = "hsl(var(--muted))", progressColor = "hsl(var(--primary))", ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          type="range"
          className={cn(
            "w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-ios [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0",
            className
          )}
          ref={ref}
          style={{
            background: `linear-gradient(to right, ${progressColor} 0%, ${progressColor} ${props.value || 0}%, ${trackColor} ${props.value || 0}%, ${trackColor} 100%)`,
          }}
          {...props}
        />
      </div>
    );
  }
);
IOSSlider.displayName = "IOSSlider";

export { IOSSlider };