import * as React from "react";
import { cn } from "@/lib/utils";

interface IOSSwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  thumbColor?: string;
  trackColor?: string;
  trackActiveColor?: string;
  onCheckedChange?: (checked: boolean) => void;
}

const IOSSwitch = React.forwardRef<HTMLInputElement, IOSSwitchProps>(
  ({ className, thumbColor = "white", trackColor = "hsl(var(--muted))", trackActiveColor = "hsl(var(--primary))", onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className={cn("sr-only peer", className)}
          ref={ref}
          {...props}
          onChange={handleChange}
        />
        <div
          className="w-12 h-7 bg-muted peer-checked:bg-primary rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:bg-white border-0"
          style={{
            backgroundColor: props.checked ? trackActiveColor : trackColor,
          }}
        >
          <div
            className="absolute top-0.5 left-[2px] bg-white rounded-full h-6 w-6 transition-all duration-300 ease-out"
            style={{
              transform: props.checked ? 'translateX(1.25rem)' : 'translateX(0)',
              backgroundColor: thumbColor,
            }}
          />
        </div>
      </label>
    );
  }
);
IOSSwitch.displayName = "IOSSwitch";

export { IOSSwitch };