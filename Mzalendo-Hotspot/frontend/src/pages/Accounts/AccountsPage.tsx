// pages/accounts/index.tsx
import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PaymentsTable from "../../components/accounts/PaymentsTable";
import PaymentsFilters from "../../components/accounts/PaymentsFilters";
import PaymentStats from "../../components/accounts/PaymentStats";
import PaymentCharts from "../../components/accounts/PaymentCharts";
import { 
  FiCreditCard, 
  FiDollarSign, 
  FiCheckCircle, 
  FiClock,
  FiXCircle,
} from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

interface AccountsPageData {
  payments: any[];
  stats: {
    totalAmount: number;
    totalCount: number;
    completedAmount: number;
    completedCount: number;
    pendingCount: number;
    failedCount: number;
  };
  breakdowns: {
    dailyRevenue: any[];
    paymentMethod: any[];
    deviceRevenue: any[];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function Accounts() {
  const [data, setData] = useState<AccountsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
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
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.append(key, value.toString());
        }
      });
      
      const res = await fetch(`${API_URL}/payments?${params}`);
      const result = await res.json();
      
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleExport = async (format: 'json' | 'csv' = 'csv') => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      
      // Add date range if specified
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('format', format);
      
      const res = await fetch(`${API_URL}/payments/export?${params}`);
      
      if (format === 'csv') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const result = await res.json();
        // Download as JSON file
        const dataStr = JSON.stringify(result.payments, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting payments:", error);
      alert("Failed to export payments");
    } finally {
      setExporting(false);
    }
  };

  const quickStats = [
    {
      icon: FiDollarSign,
      label: "Total Revenue",
      value: data?.stats.totalAmount || 0,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      isCurrency: true
    },
    {
      icon: FiCreditCard,
      label: "Total Transactions",
      value: data?.stats.totalCount || 0,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      isCurrency: false
    },
    {
      icon: FiCheckCircle,
      label: "Completed",
      value: data?.stats.completedCount || 0,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      subValue: data?.stats.completedAmount || 0,
      isCurrency: false
    },
    {
      icon: FiClock,
      label: "Pending",
      value: data?.stats.pendingCount || 0,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      isCurrency: false
    },
    {
      icon: FiXCircle,
      label: "Failed",
      value: data?.stats.failedCount || 0,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      isCurrency: false
    }
  ];

  return (
    <>
      <PageMeta
        title="Accounts & Payments | Hotspot Billing"
        description="View and manage payment records with analytics and filtering"
      />
      <PageBreadcrumb pageTitle="Accounts & Payments" />
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-5">
        {quickStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                  {stat.isCurrency 
                    ? `KES ${(stat.value || 0).toLocaleString()}`
                    : (stat.value || 0).toLocaleString()
                  }
                </h3>
                {stat.subValue !== undefined && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    KES {(stat.subValue || 0).toLocaleString()}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`size-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      {data && <PaymentCharts data={data.breakdowns} />}

      {/* Stats Overview */}
      {data && <PaymentStats stats={data.stats} />}

      {/* Filters and Actions */}
      <div className="mb-6">
        <PaymentsFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onRefresh={fetchPayments}
          onExport={handleExport}
          exporting={exporting}
        />
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <PaymentsTable
          payments={data?.payments || []}
          loading={loading}
          pagination={data?.pagination}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  );
}