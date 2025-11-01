import React from 'react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-primary">Welcome</h1>
        <p className="text-2xl text-muted-foreground">مرحباً بك في نظام إدارة المدرسة</p>
      </div>
    </div>
  );
};