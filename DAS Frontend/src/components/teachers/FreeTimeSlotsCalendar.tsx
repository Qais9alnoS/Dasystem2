import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FreeTimeSlot } from '@/types/school';
import { cn } from '@/lib/utils';

interface FreeTimeSlotsCalendarProps {
    slots: FreeTimeSlot[];
    readonly?: boolean;
    onSlotsChange?: (slots: FreeTimeSlot[]) => void;
}

export const FreeTimeSlotsCalendar: React.FC<FreeTimeSlotsCalendarProps> = ({
    slots,
    readonly = false,
    onSlotsChange
}) => {
    const [currentSlots, setCurrentSlots] = useState<FreeTimeSlot[]>([]);

    const days = [
        { id: 0, name: 'الأحد', shortName: 'أحد' },
        { id: 1, name: 'الاثنين', shortName: 'إثنين' },
        { id: 2, name: 'الثلاثاء', shortName: 'ثلاثاء' },
        { id: 3, name: 'الأربعاء', shortName: 'أربعاء' },
        { id: 4, name: 'الخميس', shortName: 'خميس' }
    ];

    const periods = [1, 2, 3, 4, 5, 6];

    useEffect(() => {
        // Initialize slots if empty or invalid
        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            const initialSlots: FreeTimeSlot[] = [];
            days.forEach(day => {
                periods.forEach(period => {
                    initialSlots.push({ day: day.id, period: period, is_free: false });
                });
            });
            setCurrentSlots(initialSlots);
        } else {
            // Check if slots is a 2D array (nested) or 1D array (current)
            let processedSlots: FreeTimeSlot[] = [];
            
            if (Array.isArray(slots[0])) {
                // It's a 2D array, flatten it
                processedSlots = (slots as any[]).flat();
            } else {
                // It's already a 1D array
                processedSlots = [...slots] as FreeTimeSlot[];
            }
            
            // Ensure we have exactly 30 slots (5 days × 6 periods)
            if (processedSlots.length !== 30) {
                const initialSlots: FreeTimeSlot[] = [];
                days.forEach(day => {
                    periods.forEach(period => {
                        // Try to find existing slot data
                        const existingSlot = processedSlots.find(
                            s => s.day === day.id && s.period === period
                        );
                        initialSlots.push(
                            existingSlot || { day: day.id, period: period, is_free: false }
                        );
                    });
                });
                setCurrentSlots(initialSlots);
            } else {
                setCurrentSlots(processedSlots);
            }
        }
    }, [slots]);

    const getSlot = (day: number, period: number): FreeTimeSlot | undefined => {
        return currentSlots.find(slot => slot.day === day && slot.period === period);
    };

    const toggleSlot = (day: number, period: number) => {
        if (readonly) return;
        
        const newSlots = currentSlots.map(slot => {
            if (slot.day === day && slot.period === period) {
                return { ...slot, is_free: !slot.is_free };
            }
            return slot;
        });
        
        setCurrentSlots(newSlots);
        if (onSlotsChange) {
            onSlotsChange(newSlots);
        }
    };

    const toggleDay = (day: number) => {
        if (readonly) return;

        // Check if all periods in this day are free
        const daySlots = currentSlots.filter(slot => slot.day === day);
        const allFree = daySlots.every(slot => slot.is_free);

        // Toggle all periods in this day
        const newSlots = currentSlots.map(slot => {
            if (slot.day === day) {
                return { ...slot, is_free: !allFree };
            }
            return slot;
        });

        setCurrentSlots(newSlots);
        if (onSlotsChange) {
            onSlotsChange(newSlots);
        }
    };

    const togglePeriod = (period: number) => {
        if (readonly) return;

        // Check if all days in this period are free
        const periodSlots = currentSlots.filter(slot => slot.period === period);
        const allFree = periodSlots.every(slot => slot.is_free);

        // Toggle all days in this period
        const newSlots = currentSlots.map(slot => {
            if (slot.period === period) {
                return { ...slot, is_free: !allFree };
            }
            return slot;
        });

        setCurrentSlots(newSlots);
        if (onSlotsChange) {
            onSlotsChange(newSlots);
        }
    };

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-sm bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 shadow-sm border border-gray-300/50"></div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">مشغول</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm border border-emerald-500/30"></div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">متاح</span>
                </div>
            </div>

            {/* Calendar Grid - Modern Design */}
            <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        {/* Header Row */}
                        <thead>
                            <tr className="bg-gradient-to-r from-indigo-500 to-purple-500">
                                <th className="px-3 py-3 text-center text-white font-bold text-sm border-l border-white/20 min-w-[100px]">
                                    اليوم
                                </th>
                                {periods.map((period) => (
                                    <th
                                        key={period}
                                        className={cn(
                                            "px-3 py-3 text-center text-white font-bold text-sm border-l border-white/20 min-w-[80px] transition-all",
                                            !readonly && "cursor-pointer hover:bg-white/20 active:bg-white/30"
                                        )}
                                        onClick={() => !readonly && togglePeriod(period)}
                                    >
                                        الحصة {period}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        
                        {/* Days Rows */}
                        <tbody>
                            {days.map((day, dayIndex) => (
                                <tr 
                                    key={day.id}
                                    className={cn(
                                        "transition-colors",
                                        dayIndex % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-900/30" : "bg-white dark:bg-gray-950"
                                    )}
                                >
                                    <td
                                        className={cn(
                                            "px-3 py-3 text-center font-bold text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700 bg-gradient-to-l from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 transition-all",
                                            !readonly && "cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 active:bg-indigo-200 dark:active:bg-indigo-800/40"
                                        )}
                                        onClick={() => !readonly && toggleDay(day.id)}
                                    >
                                        {day.name}
                                    </td>
                                    {periods.map((period) => {
                                        const slot = getSlot(day.id, period);
                                        const isFree = slot?.is_free || false;

                                        return (
                                            <td
                                                key={`${day.id}-${period}`}
                                                className="p-2 border-l border-gray-200 dark:border-gray-700"
                                            >
                                                <div
                                                    className={cn(
                                                        "w-full h-12 rounded-xl transition-all duration-300 ease-in-out flex items-center justify-center",
                                                        isFree
                                                            ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md border-2 border-emerald-500/30"
                                                            : "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 border-2 border-gray-300/30 dark:border-gray-600/30",
                                                        !readonly && "cursor-pointer hover:scale-105 hover:shadow-lg active:scale-95",
                                                        !readonly && isFree && "hover:from-emerald-500 hover:to-teal-600",
                                                        !readonly && !isFree && "hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:to-gray-500"
                                                    )}
                                                    onClick={() => !readonly && toggleSlot(day.id, period)}
                                                >
                                                    {isFree && (
                                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {!readonly && (
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-900">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 نصائح الاستخدام:</p>
                    <ul className="space-y-1.5 text-sm text-blue-800 dark:text-blue-200">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>اضغط على <strong>اسم اليوم</strong> لتحديد/إلغاء تحديد جميع حصص ذلك اليوم</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>اضغط على <strong>رقم الحصة</strong> لتحديد/إلغاء تحديد تلك الحصة في جميع الأيام</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>اضغط على <strong>أي مربع</strong> لتبديل حالته بين متاح ومشغول</span>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

