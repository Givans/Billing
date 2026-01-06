// components/dashboard/DateRangeFilter.tsx
import { useState } from "react";
import { FiCalendar, FiChevronDown } from "react-icons/fi";

interface DateRangeFilterProps {
  dateRange: any;
  onDateRangeChange: (range: any) => void;
}

export default function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const timeRanges = [
    { id: "today", label: "Today" },
    { id: "thisWeek", label: "This Week" },
    { id: "thisMonth", label: "This Month" },
    { id: "lastMonth", label: "Last Month" },
    { id: "custom", label: "Custom Range" }
  ];

  const handleSelect = (timeRange: string) => {
    let startDate = new Date();
    let endDate = new Date();
    
    switch (timeRange) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "thisWeek":
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(startDate.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        break;
      case "thisMonth":
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        break;
      case "lastMonth":
        startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        break;
      case "custom":
        // Would implement date picker here
        break;
    }
    
    onDateRangeChange({
      startDate,
      endDate,
      timeRange
    });
    setIsOpen(false);
  };

  const getDisplayText = () => {
    const range = timeRanges.find(r => r.id === dateRange.timeRange);
    return range?.label || "Select Date";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 min-w-[160px]"
      >
        <FiCalendar className="size-4" />
        <span className="flex-1 text-left">{getDisplayText()}</span>
        <FiChevronDown className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
          <div className="py-2">
            {timeRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => handleSelect(range.id)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  dateRange.timeRange === range.id ? "bg-gray-100 dark:bg-gray-700" : ""
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}