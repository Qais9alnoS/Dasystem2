import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Loader2, BookOpen, Users, DollarSign, Calendar } from 'lucide-react';

// Generic loading spinner
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
    size = 'md',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    return (
        <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
    );
};

// Page loading overlay
export const PageLoadingOverlay: React.FC<{ message?: string }> = ({
    message = 'جارِ التحميل...'
}) => {
    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" className="text-blue-600" />
                <p className="text-lg font-medium text-gray-700">{message}</p>
            </div>
        </div>
    );
};

// Button loading state
export const ButtonLoadingState: React.FC<{
    children: React.ReactNode;
    loading: boolean;
    loadingText?: string;
    className?: string;
}> = ({ children, loading, loadingText, className = '' }) => {
    return (
        <button className={`${className} ${loading ? 'opacity-75 cursor-not-allowed' : ''}`} disabled={loading}>
            {loading ? (
                <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    {loadingText && <span>{loadingText}</span>}
                </div>
            ) : children}
        </button>
    );
};

// Table skeleton loader
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 5,
    columns = 4
}) => {
    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex gap-4 p-4 border-b">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 p-4 border-b">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-4 flex-1" />
                    ))}
                </div>
            ))}        </div>
    );
};

// Card skeleton loader
export const CardSkeleton: React.FC = () => {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardContent>
        </Card>
    );
};

// Dashboard cards skeleton
export const DashboardCardsSkeleton: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-2" />
                        <Skeleton className="h-3 w-20" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

// Student list skeleton
export const StudentListSkeleton: React.FC = () => {
    return (
        <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

// Form skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 6 }) => {
    return (
        <div className="space-y-6">
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
            <div className="flex gap-3 pt-4">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-16" />
            </div>
        </div>
    );
};

// Chart skeleton
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
                <div className="flex items-end gap-2" style={{ height }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="flex-1"
                            style={{ height: `${Math.random() * 60 + 40}%` }}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

// Search results skeleton
export const SearchResultsSkeleton: React.FC = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
            </div>

            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                        {i % 2 === 0 ? (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-blue-600" />
                            </div>
                        ) : (
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-green-600" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                </div>
            ))}
        </div>
    );
};

// Schedule skeleton
export const ScheduleSkeleton: React.FC = () => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const periods = Array.from({ length: 8 }, (_, i) => i + 1);

    return (
        <div className="bg-white rounded-lg border overflow-hidden">
            <div className="grid grid-cols-6 bg-gray-50">
                <div className="p-3 font-medium border-l">الحصة</div>
                {days.map(day => (
                    <div key={day} className="p-3 font-medium text-center border-l last:border-l-0">
                        {day}
                    </div>
                ))}
            </div>

            {periods.map(period => (
                <div key={period} className="grid grid-cols-6 border-t">
                    <div className="p-3 bg-gray-50 border-l font-medium">
                        {period}
                    </div>
                    {days.map((day, dayIndex) => (
                        <div key={`${period}-${dayIndex}`} className="p-2 border-l last:border-l-0">
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

// Activity card skeleton
export const ActivityCardSkeleton: React.FC = () => {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <Skeleton className="h-3 w-28" />
                </div>
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-8 w-full" />
            </CardContent>
        </Card>
    );
};

// Generic list skeleton
export const ListSkeleton: React.FC<{
    items?: number;
    showAvatar?: boolean;
    showActions?: boolean
}> = ({
    items = 5,
    showAvatar = false,
    showActions = false
}) => {
        return (
            <div className="space-y-3">
                {Array.from({ length: items }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                        {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                        {showActions && (
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

export default {
    LoadingSpinner,
    PageLoadingOverlay,
    ButtonLoadingState,
    TableSkeleton,
    CardSkeleton,
    DashboardCardsSkeleton,
    StudentListSkeleton,
    FormSkeleton,
    ChartSkeleton,
    SearchResultsSkeleton,
    ScheduleSkeleton,
    ActivityCardSkeleton,
    ListSkeleton,
};