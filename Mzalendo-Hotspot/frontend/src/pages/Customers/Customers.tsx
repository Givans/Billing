// pages/customers/index.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import CustomersTable from "../../components/customers/CustomersTable";
import CustomersFilters from "../../components/customers/CustomersFilters";
import { FiUsers, FiWifi, FiUserCheck, FiUserX, FiClock } from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

interface CustomersPageData {
  customers: any[];
  counts: {
    total: number;
    online: number;
    active: number;
    expired: number;
    disabled: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function Customers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CustomersPageData | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    device: "all",
    connection: "all",
    timeRange: "weekly",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 20
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const res = await fetch(`${API_URL}/customers?${params}`);
      const result = await res.json();
      
      if (result.success) {
        setData(result);
      } else {
        console.error("Failed to fetch customers:", result.error);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchCustomers, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleCustomerClick = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  const handleQuickAction = async (customerId: string, action: string) => {
    try {
      const res = await fetch(`${API_URL}/customers/${customerId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const result = await res.json();
      
      if (result.success) {
        fetchCustomers(); // Refresh data
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    }
  };

  const stats = [
    {
      icon: FiUsers,
      label: "Total Customers",
      value: data?.counts.total || 0,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      icon: FiWifi,
      label: "Online",
      value: data?.counts.online || 0,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30"
    },
    {
      icon: FiUserCheck,
      label: "Active",
      value: data?.counts.active || 0,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30"
    },
    {
      icon: FiClock,
      label: "Expired",
      value: data?.counts.expired || 0,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30"
    },
    {
      icon: FiUserX,
      label: "Disabled",
      value: data?.counts.disabled || 0,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30"
    }
  ];

  return (
    <>
      <PageMeta
        title="Customers Management | Hotspot Billing"
        description="Manage hotspot customers with filters, search, and quick actions"
      />
      <PageBreadcrumb pageTitle="Customers Management" />
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                  {stat.value.toLocaleString()}
                </h3>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`size-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <CustomersFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onRefresh={fetchCustomers}
        />
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <CustomersTable
          customers={data?.customers || []}
          loading={loading}
          onCustomerClick={handleCustomerClick}
          onQuickAction={handleQuickAction}
          pagination={data?.pagination}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  );
}