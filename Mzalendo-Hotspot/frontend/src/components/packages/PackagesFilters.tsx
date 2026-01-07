// components/packages/PackagesFilters.tsx
import { useState, useEffect } from "react";
import { FiSearch, FiFilter, FiRefreshCw, FiX, FiPlus } from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

interface PackagesFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onRefresh: () => void;
  onCreatePackage: () => void;
}

export default function PackagesFilters({ 
  filters, 
  onFilterChange, 
  onRefresh,
  onCreatePackage 
}: PackagesFiltersProps) {
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
      type: "all",
      isActive: "all",
      minPrice: "",
      maxPrice: "",
      durationUnit: "all",
      device: "all",
      sortBy: "price",
      sortOrder: "asc"
    });
  };

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "hotspot", label: "Hotspot" },
    { value: "wifi", label: "WiFi" },
    { value: "dedicated", label: "Dedicated" }
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" }
  ];

  const durationUnitOptions = [
    { value: "all", label: "All Durations" },
    { value: "minutes", label: "Minutes" },
    { value: "hours", label: "Hours" },
    { value: "days", label: "Days" },
    { value: "weeks", label: "Weeks" },
    { value: "months", label: "Months" }
  ];

  const sortOptions = [
    { value: "price", label: "Price" },
    { value: "name", label: "Name" },
    { value: "createdAt", label: "Date Created" },
    { value: "duration.value", label: "Duration" }
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
              placeholder="Search packages by name or description..."
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

        {/* Quick Filters and Actions */}
        <div className="flex items-center gap-2">
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.isActive}
            onChange={(e) => onFilterChange({ isActive: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {statusOptions.map(option => (
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

          <button
            onClick={onCreatePackage}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            <FiPlus className="size-4" />
            Create Package
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Range (KES)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => onFilterChange({ minPrice: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => onFilterChange({ maxPrice: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>
            </div>

            {/* Duration Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration Unit
              </label>
              <select
                value={filters.durationUnit}
                onChange={(e) => onFilterChange({ durationUnit: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {durationUnitOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

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

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => onFilterChange({ sortBy: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => onFilterChange({ sortOrder: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>
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