import React from 'react';
import { HistoryCard } from '@/components/history/HistoryCard';

export const DashboardPage: React.FC = () => {
  return (
    <div className="h-full p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Left: History Card */}
        <div className="h-[600px]">
          <HistoryCard />
        </div>
        
        {/* Right: Welcome message or other widgets */}
        <div className="flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold text-primary">Welcome</h1>
            <p className="text-2xl text-muted-foreground">مرحباً بك في نظام إدارة المدرسة</p>
          </div>
        </div>
      </div>
    </div>
  );
};