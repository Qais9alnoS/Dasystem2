import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FreeTimeSlot } from "@/types/school";
import { cn } from "@/lib/utils";

interface OccupiedSlot {
  day: number;
  period: number;
  className: string;
  subject: string;
}

interface FreeTimeSlotsCalendarProps {
  slots: FreeTimeSlot[];
  readonly?: boolean;
  onSlotsChange?: (slots: FreeTimeSlot[]) => void;
  occupiedSlots?: OccupiedSlot[]; // New prop for showing occupied slots
}

export const FreeTimeSlotsCalendar: React.FC<FreeTimeSlotsCalendarProps> = ({
  slots,
  readonly = false,
  onSlotsChange,
  occupiedSlots = [],
}) => {
  const [currentSlots, setCurrentSlots] = useState<FreeTimeSlot[]>([]);

  const days = [
    { id: 0, name: "الأحد", shortName: "أحد" },
    { id: 1, name: "الاثنين", shortName: "إثنين" },
    { id: 2, name: "الثلاثاء", shortName: "ثلاثاء" },
    { id: 3, name: "الأربعاء", shortName: "أربعاء" },
    { id: 4, name: "الخميس", shortName: "خميس" },
  ];

  const periods = [0, 1, 2, 3, 4, 5]; // 0-based indexing to match backend

  useEffect(() => {
    // Initialize slots if empty or invalid
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      const initialSlots: FreeTimeSlot[] = [];
      days.forEach((day) => {
        periods.forEach((period) => {
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
        days.forEach((day) => {
          periods.forEach((period) => {
            // Try to find existing slot data
            const existingSlot = processedSlots.find(
              (s) => s.day === day.id && s.period === period
            );
            // Add status field if missing from existing slot
            if (existingSlot && !existingSlot.status) {
              existingSlot.status = existingSlot.is_free
                ? "free"
                : "unavailable";
            }
            initialSlots.push(
              existingSlot || {
                day: day.id,
                period: period,
                is_free: false,
                status: "unavailable",
              }
            );
          });
        });
        setCurrentSlots(initialSlots);
      } else {
        // Ensure all loaded slots have status field
        const slotsWithStatus = processedSlots.map((slot) => {
          if (!slot.status) {
            return {
              ...slot,
              status: (slot.is_free ? "free" : "unavailable") as
                | "free"
                | "assigned"
                | "unavailable",
            };
          }
          return slot;
        });
        setCurrentSlots(slotsWithStatus);
      }
    }
  }, [slots]);

  const getSlot = (day: number, period: number): FreeTimeSlot | undefined => {
    return currentSlots.find(
      (slot) => slot.day === day && slot.period === period
    );
  };

  const getOccupiedSlot = (
    day: number,
    period: number
  ): OccupiedSlot | undefined => {
    return occupiedSlots.find(
      (slot) => slot.day === day && slot.period === period
    );
  };

  const isSlotOccupied = (day: number, period: number): boolean => {
    return !!getOccupiedSlot(day, period);
  };

  const toggleSlot = (day: number, period: number) => {
    if (readonly) return;

    const newSlots = currentSlots.map((slot) => {
      if (slot.day === day && slot.period === period) {
        // Don't toggle assigned slots or occupied slots
        if (slot.status === "assigned" || isSlotOccupied(day, period)) {
          return slot;
        }
        const newIsFree = !slot.is_free;
        return {
          ...slot,
          is_free: newIsFree,
          status: (newIsFree ? "free" : "unavailable") as
            | "free"
            | "assigned"
            | "unavailable",
          assignment: newIsFree ? undefined : slot.assignment, // Clear assignment if making free
        };
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

    // Check if all NON-ASSIGNED and NON-OCCUPIED periods in this day are free
    const daySlots = currentSlots.filter(
      (slot) => slot.day === day && slot.status !== "assigned" && !isSlotOccupied(slot.day, slot.period)
    );
    const allFree = daySlots.every((slot) => slot.is_free);

    // Toggle all NON-ASSIGNED and NON-OCCUPIED periods in this day
    const newSlots = currentSlots.map((slot) => {
      if (slot.day === day && slot.status !== "assigned" && !isSlotOccupied(slot.day, slot.period)) {
        const newIsFree = !allFree;
        return {
          ...slot,
          is_free: newIsFree,
          status: (newIsFree ? "free" : "unavailable") as
            | "free"
            | "assigned"
            | "unavailable",
          assignment: newIsFree ? undefined : slot.assignment,
        };
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

    // Check if all NON-ASSIGNED and NON-OCCUPIED days in this period are free
    const periodSlots = currentSlots.filter(
      (slot) => slot.period === period && slot.status !== "assigned" && !isSlotOccupied(slot.day, slot.period)
    );
    const allFree = periodSlots.every((slot) => slot.is_free);

    // Toggle all NON-ASSIGNED and NON-OCCUPIED days in this period
    const newSlots = currentSlots.map((slot) => {
      if (slot.period === period && slot.status !== "assigned" && !isSlotOccupied(slot.day, slot.period)) {
        const newIsFree = !allFree;
        return {
          ...slot,
          is_free: newIsFree,
          status: (newIsFree ? "free" : "unavailable") as
            | "free"
            | "assigned"
            | "unavailable",
          assignment: newIsFree ? undefined : slot.assignment,
        };
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
      {/* Legend - Flat iOS Design */}
      <div className="flex items-center justify-center gap-6 text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gray-300 dark:bg-gray-600"></div>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            مشغول
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-500"></div>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            متاح
          </span>
        </div>
        {occupiedSlots.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              محجوز (مجدول)
            </span>
          </div>
        )}
      </div>

      {/* Calendar Grid - Flat iOS Design */}
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Header Row */}
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-3 text-center text-gray-700 dark:text-gray-200 font-semibold text-sm border-b border-gray-200 dark:border-gray-600 min-w-[100px]">
                  اليوم
                </th>
                {periods.map((period) => (
                  <th
                    key={period}
                    className={cn(
                      "px-3 py-3 text-center text-gray-700 dark:text-gray-200 font-semibold text-sm border-b border-gray-200 dark:border-gray-600 min-w-[90px] transition-colors",
                      !readonly &&
                        "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500"
                    )}
                    onClick={() => !readonly && togglePeriod(period)}
                  >
                    الحصة {period + 1}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Days Rows */}
            <tbody>
              {days.map((day, dayIndex) => (
                <tr
                  key={day.id}
                  className="border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <td
                    className={cn(
                      "px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 transition-colors",
                      !readonly &&
                        "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
                    )}
                    onClick={() => !readonly && toggleDay(day.id)}
                  >
                    {day.name}
                  </td>
                  {periods.map((period) => {
                    const slot = getSlot(day.id, period);
                    const occupiedSlot = getOccupiedSlot(day.id, period);
                    const isFree = slot?.is_free || false;
                    const isOccupied = !!occupiedSlot;

                    return (
                      <td
                        key={`${day.id}-${period}`}
                        className="p-2.5"
                      >
                        <div
                          className={cn(
                            "w-full h-14 rounded-lg transition-all duration-200 ease-out flex flex-col items-center justify-center text-[10px] font-medium leading-tight",
                            isOccupied
                              ? "bg-blue-500 text-white"
                              : isFree
                              ? "bg-green-500 text-white"
                              : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300",
                            !readonly &&
                              !isOccupied &&
                              "cursor-pointer hover:opacity-80 active:scale-95",
                            isOccupied && "cursor-not-allowed"
                          )}
                          onClick={() =>
                            !readonly &&
                            !isOccupied &&
                            toggleSlot(day.id, period)
                          }
                          title={
                            isOccupied
                              ? `${occupiedSlot.subject} - ${occupiedSlot.className}`
                              : undefined
                          }
                        >
                          {isOccupied ? (
                            <div className="text-center px-1 space-y-0.5">
                              <div className="text-[11px] font-semibold">
                                {occupiedSlot.subject}
                              </div>
                              <div className="text-[9px] opacity-90">
                                صف {occupiedSlot.className}
                              </div>
                            </div>
                          ) : isFree ? (
                            <svg
                              className="w-6 h-6 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : null}
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
        <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-2xl border border-blue-200 dark:border-gray-700">
          <p className="font-semibold text-blue-900 dark:text-gray-100 mb-2">
            💡 نصائح الاستخدام:
          </p>
          <ul className="space-y-1.5 text-sm text-blue-800 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>
                اضغط على <strong>اسم اليوم</strong> لتحديد/إلغاء تحديد جميع حصص
                ذلك اليوم
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>
                اضغط على <strong>رقم الحصة</strong> لتحديد/إلغاء تحديد تلك الحصة
                في جميع الأيام
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>
                اضغط على <strong>أي مربع</strong> لتبديل حالته بين متاح ومشغول
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
