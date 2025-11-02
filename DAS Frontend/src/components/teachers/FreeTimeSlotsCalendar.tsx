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
        { id: 0, name: 'الأحد' },
        { id: 1, name: 'الاثنين' },
        { id: 2, name: 'الثلاثاء' },
        { id: 3, name: 'الأربعاء' },
        { id: 4, name: 'الخميس' }
    ];

    const periods = [1, 2, 3, 4, 5, 6];

    useEffect(() => {
        // Initialize slots if empty or invalid
        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            const initialSlots: FreeTimeSlot[] = [];
            days.forEach(day => {
                periods.forEach(period => {
                    initialSlots.push({ day: day.id, period, is_free: false });
                });
            });
            setCurrentSlots(initialSlots);
        } else {
            // Check if slots is a 2D array (nested) and flatten it
            if (Array.isArray(slots[0])) {
                // Flatten the array
                const flatSlots = (slots as any[]).flat();
                setCurrentSlots(flatSlots);
            } else {
                setCurrentSlots(slots);
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
            <div className="flex items-center gap-6 text-sm bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-slate-300 to-slate-400 shadow-sm"></div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">مشغول</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm"></div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">متاح</span>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto shadow-sm bg-white dark:bg-slate-950">
                <div className="min-w-max">
                    {/* Header Row */}
                    <div className="grid grid-cols-7 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
                        <div className="border-l border-slate-200 dark:border-slate-700 px-1 py-1 text-center w-16">
                            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">اليوم</span>
                        </div>
                        {periods.map((period) => (
                            <div
                                key={period}
                                className={cn(
                                    "border-l border-slate-200 dark:border-slate-700 px-0.5 py-1 text-center w-12 transition-all duration-300",
                                    !readonly && "cursor-pointer hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-950 dark:hover:to-purple-950 hover:scale-105 active:scale-95"
                                )}
                                onClick={() => togglePeriod(period)}
                            >
                                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">ح{period}</span>
                            </div>
                        ))}
                    </div>

                    {/* Days Rows */}
                    {days.map((day, dayIndex) => (
                        <div key={day.id} className={cn(
                            "grid grid-cols-7",
                            dayIndex !== days.length - 1 && "border-b border-slate-200 dark:border-slate-700"
                        )}>
                            <div
                                className={cn(
                                    "border-l border-slate-200 dark:border-slate-700 px-0.5 py-1 text-center w-16 bg-gradient-to-l from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-300",
                                    !readonly && "cursor-pointer hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-950 dark:hover:to-purple-950 hover:scale-105 active:scale-95"
                                )}
                                onClick={() => toggleDay(day.id)}
                            >
                                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{day.name}</span>
                            </div>
                            {periods.map((period) => {
                                const slot = getSlot(day.id, period);
                                const isFree = slot?.is_free || false;

                                return (
                                    <div
                                        key={`${day.id}-${period}`}
                                        className={cn(
                                            "border-l border-slate-200 dark:border-slate-700 p-0.5 w-12 transition-all duration-500 ease-out",
                                            isFree
                                                ? "bg-gradient-to-br from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 shadow-inner"
                                                : "bg-gradient-to-br from-slate-300 to-slate-400 hover:from-slate-400 hover:to-slate-500",
                                            !readonly && "cursor-pointer hover:scale-110 active:scale-95 hover:shadow-lg hover:z-10 relative"
                                        )}
                                        onClick={() => toggleSlot(day.id, period)}
                                        style={{
                                            transformOrigin: 'center',
                                        }}
                                    >
                                        <div className="w-full h-full min-h-[14px] rounded-sm flex items-center justify-center">
                                            {isFree && (
                                                <div className="w-1 h-1 rounded-full bg-white/80 animate-pulse"></div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {!readonly && (
                <div className="text-sm text-muted-foreground">
                    <p>💡 نصيحة:</p>
                    <ul className="list-disc list-inside space-y-1 mr-4">
                        <li>اضغط على اسم اليوم لتحديد/إلغاء تحديد جميع حصص ذلك اليوم</li>
                        <li>اضغط على رقم الحصة لتحديد/إلغاء تحديد تلك الحصة في جميع الأيام</li>
                        <li>اضغط على أي مربع لتبديل حالته</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

