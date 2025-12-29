'use client';

import { useState } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  maxDays?: number;
}

const PRESET_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export function DateRangePicker({ value, onChange, maxDays }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (days: number) => {
    if (maxDays && days > maxDays) {
      alert(`Your plan allows up to ${maxDays} days of history`);
      return;
    }

    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, days - 1));
    onChange({ start, end });
    setIsOpen(false);
  };

  const formatDateRange = (range: DateRange) => {
    return `${format(range.start, 'MMM d, yyyy')} - ${format(range.end, 'MMM d, yyyy')}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm">📅</span>
        <span className="text-sm font-medium text-gray-700">
          {formatDateRange(value)}
        </span>
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1 mb-1">
                Quick Select
              </div>
              {PRESET_RANGES.map((preset) => {
                const isDisabled = Boolean(maxDays && preset.days > maxDays);
                return (
                  <button
                    key={preset.label}
                    onClick={() => !isDisabled && handlePresetClick(preset.days)}
                    disabled={isDisabled}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors ${
                      isDisabled
                        ? 'text-gray-400 cursor-not-allowed hover:bg-transparent'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{preset.label}</span>
                      {isDisabled && (
                        <span className="text-xs text-orange-500">🔒 Pro</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {maxDays && (
              <div className="border-t p-3 bg-gray-50 rounded-b-lg">
                <p className="text-xs text-gray-600">
                  Your plan includes {maxDays} days of history
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
