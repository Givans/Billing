// components/customers/CustomersFilters.tsx
import { useState, useEffect } from "react";
import { FiSearch, FiFilter, FiRefreshCw, FiX } from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

interface CustomersFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onRefresh: () => void;
}

export default function CustomersFilters({ filters, onFilterChange, onRefresh }: CustomersFiltersProps) {
  const [devices, setDevices] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetch(`${API_URL}/devices`);
      const data = await res.json();
      setDevices(data);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchInput });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    onFilterChange({
      search: "",
      status: "all",
      device: "all",
      connection: "all",
      timeRange: "weekly"
    });
  };

  const timeRanges = [
    { value: "today", label: "Today" },
    { value: "weekly", label: "This Week" },
    { value: "monthly", label: "This Month" },
    { value: "yearly", label: "This Year" },
    { value: "all", label: "All Time" }
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "expired", label: "Expired" },
    { value: "disabled", label: "Disabled" }
  ];

  const connectionOptions = [
    { value: "all", label: "All Connections" },
    { value: "online", label: "Online" },
    { value: "offline", label: "Offline" }
  ];

  return (
    <div className="p-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by MAC, Phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 placeholder-gray-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-brand-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  onFilterChange({ search: "" });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="size-4" />
              </button>
            )}
          </div>
        </form>

        {/* Quick Filters */}
        <div className="flex items-center gap-2">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.connection}
            onChange={(e) => onFilterChange({ connection: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {connectionOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <FiFilter className="size-4" />
            More Filters
          </button>

          <button
            onClick={onRefresh}
            className="p-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title="Refresh"
          >
            <FiRefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Device Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Device
              </label>
              <select
                value={filters.device}
                onChange={(e) => onFilterChange({ device: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="all">All Devices</option>
                {devices.map(device => (
                  <option key={device._id} value={device._id}>
                    {device.name} ({device.status === 'online' ? '🟢' : '🔴'})
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Range
              </label>
              <select
                value={filters.timeRange}
                onChange={(e) => onFilterChange({ timeRange: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="createdAt">Date Created</option>
                <option value="lastSeen">Last Seen</option>
                <option value="macAddress">MAC Address</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}