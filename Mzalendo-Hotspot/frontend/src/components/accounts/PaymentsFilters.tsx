// components/accounts/PaymentsFilters.tsx
import { useState, useEffect } from "react";
import { FiSearch, FiFilter, FiRefreshCw, FiX, FiDownload } from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

interface PaymentsFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onRefresh: () => void;
  onExport: (format: 'json' | 'csv') => void;
  exporting: boolean;
}

export default function PaymentsFilters({ 
  filters, 
  onFilterChange, 
  onRefresh,
  onExport,
  exporting
}: PaymentsFiltersProps) {
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
      paymentMethod: "all",
      minAmount: "",
      maxAmount: "",
      startDate: "",
      endDate: "",
      customer: "",
      package: "",
      sortBy: "createdAt",
      sortOrder: "desc"
    });
  };

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "completed", label: "Completed" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
    { value: "initiated", label: "Initiated" },
    { value: "refunded", label: "Refunded" }
  ];

  const paymentMethodOptions = [
    { value: "all", label: "All Methods" },
    { value: "mpesa", label: "M-Pesa" },
    { value: "card", label: "Card" },
    { value: "cash", label: "Cash" },
    { value: "kopokopo", label: "KopoKopo" },
    { value: "voucher", label: "Voucher" }
  ];

  const sortOptions = [
    { value: "createdAt", label: "Date" },
    { value: "amount", label: "Amount" },
    { value: "status", label: "Status" }
  ];

//   const formatDateForInput = (dateString: string) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     return date.toISOString().split('T')[0];
//   };

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
              placeholder="Search by transaction ID, phone, receipt..."
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
            value={filters.paymentMethod}
            onChange={(e) => onFilterChange({ paymentMethod: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {paymentMethodOptions.map(option => (
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

          <div className="relative">
            <button
              onClick={() => onExport('csv')}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <FiRefreshCw className="size-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FiDownload className="size-4" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount Range (KES)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount}
                  onChange={(e) => onFilterChange({ minAmount: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount}
                  onChange={(e) => onFilterChange({ maxAmount: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => onFilterChange({ startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => onFilterChange({ endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>
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
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer and Package Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer (MAC or Phone)
              </label>
              <input
                type="text"
                value={filters.customer}
                onChange={(e) => onFilterChange({ customer: e.target.value })}
                placeholder="Filter by customer..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Package
              </label>
              <input
                type="text"
                value={filters.package}
                onChange={(e) => onFilterChange({ package: e.target.value })}
                placeholder="Filter by package..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              />
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