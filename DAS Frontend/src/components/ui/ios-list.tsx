import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface IOSListProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

const IOSList = React.forwardRef<HTMLDivElement, IOSListProps>(
  ({ className, inset = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-background rounded-3xl overflow-hidden border border-border shadow-ios",
        inset ? "mx-4" : "",
        className
      )}
      {...props}
    />
  )
);
IOSList.displayName = "IOSList";

interface IOSListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  href?: string;
  chevron?: boolean;
  icon?: React.ReactNode;
}

const IOSListItem = React.forwardRef<HTMLDivElement, IOSListItemProps>(
  ({ className, href, chevron = false, icon, children, ...props }, ref) => {
    const content = (
      <>
        {icon && <div className="mr-3 flex-shrink-0">{icon}</div>}
        <div className="flex-1 min-w-0 py-3">
          {children}
        </div>
        {chevron && <ChevronRight className="ml-2 flex-shrink-0 text-muted-foreground" size={20} />}
      </>
    );

    if (href) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center px-4 text-foreground hover:bg-muted/50 active:bg-muted transition-colors duration-200 cursor-pointer",
            className
          )}
          onClick={(e) => {
            // Handle navigation if needed
            window.location.href = href;
          }}
          {...props}
        >
          {content}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center px-4 text-foreground hover:bg-muted/50 active:bg-muted transition-colors duration-200",
          className
        )}
        {...props}
      >
        {content}
      </div>
    );
  }
);
IOSListItem.displayName = "IOSListItem";

interface IOSListHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const IOSListHeader = React.forwardRef<HTMLDivElement, IOSListHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50",
        className
      )}
      {...props}
    />
  )
);
IOSListHeader.displayName = "IOSListHeader";

interface IOSListFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const IOSListFooter = React.forwardRef<HTMLDivElement, IOSListFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-4 py-2 text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
);
IOSListFooter.displayName = "IOSListFooter";

export { IOSList, IOSListItem, IOSListHeader, IOSListFooter };