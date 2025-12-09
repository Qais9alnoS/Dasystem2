import * as React from "react";
import { cn } from "@/lib/utils";
import { Home, Calendar, User, Settings } from "lucide-react";

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface IOSTabBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs?: TabItem[];
  className?: string;
}

const defaultTabs: TabItem[] = [
  { id: "home", label: "Home", icon: <Home className="h-6 w-6" /> },
  { id: "schedule", label: "Schedule", icon: <Calendar className="h-6 w-6" /> },
  { id: "profile", label: "Profile", icon: <User className="h-6 w-6" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-6 w-6" /> },
];

const IOSTabBar = React.forwardRef<HTMLDivElement, IOSTabBarProps>(
  ({ activeTab, onTabChange, tabs = defaultTabs, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background border-t border-border backdrop-blur-md pb-safe",
          className
        )}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
              onClick={() => onTabChange(tab.id)}
            >
              <div className={cn(
                "transition-transform duration-200",
                activeTab === tab.id ? "scale-110" : "scale-100"
              )}>
                {tab.icon}
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
);
IOSTabBar.displayName = "IOSTabBar";

export { IOSTabBar, defaultTabs };