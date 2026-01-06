// pages/dashboard/index.tsx
import { useState, useEffect } from "react";
import HotspotMetrics from "../../components/ecommerce/HotspotMetrics";
import RevenueChart from "../../components/ecommerce/RevenueChart"; // Renamed from MonthlySalesChart
import DevicePerformanceChart from "../../components/ecommerce/DevicePerformanceChart"; // Renamed from StatisticsChart
import PackageDistribution from "../../components/ecommerce/PackageDistribution"; // Renamed from MonthlyTarget
import RecentTransactions from "../../components/ecommerce/RecentTransactions"; // Renamed from RecentOrders
import PageMeta from "../../components/common/PageMeta";
import DeviceFilter from "../../components/dashboard/DeviceFilter";
import DateRangeFilter from "../../components/dashboard/DateRangeFilter";
import CustomerStatusSummary from "../../components/ecommerce/CustomerStatusSummary";

const API_URL = "http://localhost:5000/api";

interface DashboardData {
  metrics: any;
  revenueData: any;
  devicePerformance: any;
  packageDistribution: any;
  recentTransactions: any;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // 1st of current month
    endDate: new Date(),
    timeRange: "thisMonth" // "today", "thisWeek", "thisMonth", "custom"
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (selectedDevice !== "all") {
        params.append("device", selectedDevice);
      }
      params.append("timeRange", dateRange.timeRange);
      
      // Fetch metrics
      const [metricsRes, devicesRes, paymentsRes] = await Promise.all([
        fetch(`${API_URL}/customers/stats?${params}`),
        fetch(`${API_URL}/devices`),
        fetch(`${API_URL}/payments?${params}&limit=10&sortBy=createdAt&sortOrder=desc`)
      ]);
      
      const [metricsData, devicesData, paymentsData] = await Promise.all([
        metricsRes.json(),
        devicesRes.json(),
        paymentsRes.json()
      ]);
      
      // Fetch additional data for charts
      const revenueRes = await fetch(`${API_URL}/payments/device/${selectedDevice !== "all" ? selectedDevice : "stats"}?period=month`);
      const revenueData = await revenueRes.json();
      
      // Format data for components
      const dashboardData: DashboardData = {
        metrics: {
          customers: metricsData.success ? metricsData.stats : {
            total: 0, online: 0, offline: 0, active: 0, expired: 0, disabled: 0
          },
          devices: {
            total: devicesData.length || 0,
            online: devicesData.filter((d: any) => d.status === 'online').length || 0,
            offline: devicesData.filter((d: any) => d.status === 'offline').length || 0
          },
          revenue: calculateRevenue(paymentsData.payments || []),
          payments: {
            total: paymentsData.total || 0,
            successful: paymentsData.payments?.filter((p: any) => p.status === 'completed').length || 0,
            pending: paymentsData.payments?.filter((p: any) => p.status === 'pending' || p.status === 'initiated').length || 0
          }
        },
        revenueData: formatRevenueData(revenueData),
        devicePerformance: formatDevicePerformance(devicesData),
        packageDistribution: await fetchPackageDistribution(),
        recentTransactions: paymentsData
      };
      
      setData(dashboardData);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [selectedDevice, dateRange.timeRange]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Add this helper function to your main dashboard page
function calculateRevenue(payments: any[]) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let today = 0;
  let month = 0;
  
  payments.forEach((payment: any) => {
    const paymentDate = new Date(payment.createdAt);
    const amount = payment.amount || 0;
    
    if (paymentDate >= startOfMonth) month += amount;
    if (paymentDate >= startOfDay) today += amount;
  });
  
  // Calculate percentage change (simple mock - replace with actual calculation)
  const lastMonthRevenue = month * 0.9; // Mock 10% less
  const changePercentage = lastMonthRevenue > 0 
    ? ((month - lastMonthRevenue) / lastMonthRevenue) * 100 
    : 0;
  
  return { 
    today, 
    month, 
    changePercentage: parseFloat(changePercentage.toFixed(1))
  };
}

  return (
    <>
      <PageMeta
        title="Hotspot Billing Dashboard | Admin Panel"
        description="Hotspot billing system dashboard for monitoring customers, devices, and revenue"
      />
      
      {/* Filters Section */}
      <div className="mb-6 p-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">Dashboard Overview</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Real-time monitoring of your hotspot network
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <DeviceFilter 
              selectedDevice={selectedDevice}
              onDeviceChange={setSelectedDevice}
            />
            <DateRangeFilter 
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Metrics and Revenue Chart */}
        <div className="col-span-12 space-y-6 xl:col-span-8">
          <HotspotMetrics metrics={data?.metrics} />
          <RevenueChart 
            data={data?.revenueData}
            deviceFilter={selectedDevice}
            dateRange={dateRange}
          />
        </div>

        {/* Package Distribution */}
        <div className="col-span-12 xl:col-span-4">
          <PackageDistribution data={data?.packageDistribution} />
        </div>

        {/* Device Performance */}
        <div className="col-span-12">
          <DevicePerformanceChart 
            data={data?.devicePerformance}
            deviceFilter={selectedDevice}
          />
        </div>

        {/* Recent Transactions */}
        <div className="col-span-12 xl:col-span-8">
          <RecentTransactions 
            transactions={data?.recentTransactions}
            loading={loading}
            deviceFilter={selectedDevice}
          />
        </div>

        {/* Customer Status Summary */}
        <div className="col-span-12 xl:col-span-4">
          <CustomerStatusSummary metrics={data?.metrics} />
        </div>
      </div>
    </>
  );
}

// Helper functions
// function calculateRevenue(payments: any[]) {
//   const now = new Date();
//   const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//   const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
//   let today = 0;
//   let month = 0;
  
//   payments.forEach((payment: any) => {
//     const paymentDate = new Date(payment.createdAt);
//     const amount = payment.amount || 0;
    
//     if (paymentDate >= startOfMonth) month += amount;
//     if (paymentDate >= startOfDay) today += amount;
//   });
  
//   return { today, month, changePercentage: 0 };
// }

function formatRevenueData(revenueData: any) {
  // Format revenue data for chart
  return revenueData;
}

function formatDevicePerformance(devices: any[]) {
  // Format device performance data
  return devices.map((device: any) => ({
    name: device.name,
    online: device.status === 'online',
    customers: device.stats?.onlineCustomers || 0,
    revenue: device.stats?.revenueMonth || 0
  }));
}

async function fetchPackageDistribution() {
  try {
    const res = await fetch(`${API_URL}/packages`);
    const packages = await res.json();
    
    // Get customer count per package
    const customersRes = await fetch(`${API_URL}/customers`);
    const customersData = await customersRes.json();
    
    const distribution = packages.map((pkg: any) => {
      const count = customersData.customers?.filter((c: any) => 
        c.currentPackage?.package?._id === pkg._id
      ).length || 0;
      
      return {
        name: pkg.name,
        count,
        revenue: count * pkg.price
      };
    });
    
    return distribution;
  } catch (error) {
    return [];
  }
}