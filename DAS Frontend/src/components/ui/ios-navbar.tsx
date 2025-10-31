import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MoreHorizontal } from "lucide-react";

interface IOSNavbarProps {
  title: string;
  onBack?: () => void;
  onMore?: () => void;
  className?: string;
  backButtonLabel?: string;
  moreButtonLabel?: string;
  largeTitle?: boolean;
}

const IOSNavbar = React.forwardRef<HTMLDivElement, IOSNavbarProps>(
  ({ title, onBack, onMore, className, backButtonLabel = "Back", moreButtonLabel = "More", largeTitle = false }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          "sticky top-0 z-10 bg-background border-b border-border backdrop-blur-md",
          className
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            {onBack && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onBack}
                className="rounded-full"
              >
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">{backButtonLabel}</span>
              </Button>
            )}
          </div>
          
          <div className="flex-1 text-center">
            <h1 className={cn(
              "font-semibold text-foreground truncate px-4",
              largeTitle ? "text-2xl" : "text-lg"
            )}>
              {title}
            </h1>
          </div>
          
          <div className="flex items-center">
            {onMore && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onMore}
                className="rounded-full"
              >
                <MoreHorizontal className="h-6 w-6" />
                <span className="sr-only">{moreButtonLabel}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);
IOSNavbar.displayName = "IOSNavbar";

export { IOSNavbar };