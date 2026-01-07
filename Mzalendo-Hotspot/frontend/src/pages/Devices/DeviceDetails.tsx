// pages/Devices/DeviceDetails.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { 
  FiArrowLeft, 
  FiServer, 
  FiCpu, 
//   FiDatabase, 
  FiActivity,
  FiWifi, 
  FiUsers,
  FiDollarSign,
//   FiBarChart2,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiGlobe,
  FiClock,
  FiShield
} from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

interface DeviceDetailsData {
  device: {
    _id: string;
    name: string;
    nasIp: string;
    location: string;
    status: 'online' | 'offline';
    secret: string;
    lastSeen: string;
    createdAt: string;
    stats: {
      onlineCustomers: number;
      totalCustomers: number;
      revenueToday: number;
      revenueMonth: number;
    };
  };
  systemResources: {
    cpu: number;
    ram: {
      total: number;
      used: number;
      percentage: number;
    };
    disk: {
      total: number;
      used: number;
      percentage: number;
    };
    uptime: number;
  };
  onlineCustomers: any[];
  recentPayments: any[];
}

export default function DeviceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DeviceDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
//   const [statsPeriod, setStatsPeriod] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  const fetchDeviceDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/devices/${id}`);
      const result = await res.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching device details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/devices/${id}/status`);
      const result = await res.json();
      
      if (result.success && data) {
        setData(prev => ({
          ...prev!,
          device: {
            ...prev!.device,
            status: result.data.device.status,
            lastSeen: result.data.device.lastSeen
          },
          systemResources: result.data.systemResources,
          onlineCustomers: result.data.onlineCustomers || []
        }));
      }
    } catch (error) {
      console.error("Error fetching device status:", error);
    }
  };

  useEffect(() => {
    fetchDeviceDetails();
    
    // Start polling for status updates
    const interval = window.setInterval(fetchDeviceStatus, 30000);
    setPollingInterval(interval);
    
    return () => {
      if (pollingInterval) {
        window.clearInterval(pollingInterval);
      }
    };
  }, [id]);

  const formatUptime = (seconds: number) => {
    if (!seconds) return "0s";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'text-green-600' : 'text-red-600';
  };

  const getHealthColor = (percentage: number) => {
    if (percentage > 80) return 'text-red-600';
    if (percentage > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <FiServer className="size-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          Device Not Found
        </h3>
        <button
          onClick={() => navigate('/routers')}
          className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
        >
          Back to Devices
        </button>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${data.device.name} | Device Details`}
        description={`Detailed view of ${data.device.name} hotspot device`}
      />
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/routers')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <FiArrowLeft className="size-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <PageBreadcrumb pageTitle={data.device.name} />

          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${data.device.status === 'online' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <FiServer className={`size-6 ${getStatusColor(data.device.status)}`} />
              </div>
              {data.device.name}
              <span className={`text-sm font-normal px-2 py-1 rounded-full ${data.device.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                {data.device.status.toUpperCase()}
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {data.device.nasIp} • {data.device.location || 'No location specified'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDeviceStatus}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <FiRefreshCw className="size-4" />
              Refresh
            </button>
            <button
              onClick={() => navigate(`/routers/${id}/edit`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              <FiEdit2 className="size-4" />
              Edit Device
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Online Customers */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FiUsers className="text-blue-600 dark:text-blue-400 size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Connected Users
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Currently active
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-gray-800 dark:text-white/90">
              {data.device.stats.onlineCustomers}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              of {data.device.stats.totalCustomers} total
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <FiDollarSign className="text-emerald-600 dark:text-emerald-400 size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Monthly Revenue
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This month
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-gray-800 dark:text-white/90">
              KES {data.device.stats.revenueMonth.toLocaleString()}
            </div>
            <div className="text-sm text-emerald-600 dark:text-emerald-400">
              Today: KES {data.device.stats.revenueToday.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Uptime */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FiClock className="text-purple-600 dark:text-purple-400 size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Uptime
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current session
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-gray-800 dark:text-white/90">
              {formatUptime(data.systemResources.uptime)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {formatDate(data.device.lastSeen)}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <FiActivity className="text-orange-600 dark:text-orange-400 size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                System Health
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Resource usage
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-gray-800 dark:text-white/90">
              {data.systemResources.cpu}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              CPU • RAM {data.systemResources.ram.percentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - System Resources */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Resources Card */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6 flex items-center gap-2">
              <FiCpu className="text-blue-500 size-5" />
              System Resources
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CPU Usage */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white/90">CPU Usage</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Processor load</p>
                  </div>
                  <span className={`text-xl font-bold ${getHealthColor(data.systemResources.cpu)}`}>
                    {data.systemResources.cpu}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      data.systemResources.cpu > 80 ? 'bg-red-500' : 
                      data.systemResources.cpu > 60 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    style={{ width: `${data.systemResources.cpu}%` }}
                  />
                </div>
              </div>

              {/* RAM Usage */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white/90">RAM Usage</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Memory consumption</p>
                  </div>
                  <span className={`text-xl font-bold ${getHealthColor(data.systemResources.ram.percentage)}`}>
                    {data.systemResources.ram.percentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      data.systemResources.ram.percentage > 80 ? 'bg-red-500' : 
                      data.systemResources.ram.percentage > 60 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    style={{ width: `${data.systemResources.ram.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formatBytes(data.systemResources.ram.used)} / {formatBytes(data.systemResources.ram.total)}
                </p>
              </div>

              {/* Disk Usage */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white/90">Disk Usage</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Storage space</p>
                  </div>
                  <span className={`text-xl font-bold ${getHealthColor(data.systemResources.disk.percentage)}`}>
                    {data.systemResources.disk.percentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      data.systemResources.disk.percentage > 80 ? 'bg-red-500' : 
                      data.systemResources.disk.percentage > 60 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    style={{ width: `${data.systemResources.disk.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formatBytes(data.systemResources.disk.used)} / {formatBytes(data.systemResources.disk.total)}
                </p>
              </div>
            </div>

            {/* Device Information */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-800 dark:text-white/90 mb-4 flex items-center gap-2">
                <FiServer className="text-gray-500 size-4" />
                Device Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">NAS IP Address</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">{data.device.nasIp}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">{data.device.location || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">{formatDate(data.device.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">{formatDate(data.device.lastSeen)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Users */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6 flex items-center gap-2">
              <FiWifi className="text-green-500 size-5" />
              Currently Connected Users ({data.onlineCustomers?.length || 0})
            </h3>
            
            {data.onlineCustomers && data.onlineCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">MAC Address</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Package</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Connected</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.onlineCustomers.map((customer, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3">
                          <div className="font-medium text-gray-800 dark:text-white/90">
                            {customer.macAddress}
                          </div>
                          {customer.phoneNumber && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {customer.phoneNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-3">
                          {customer.currentPackage?.package ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full">
                              {customer.currentPackage.package.name}
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400 text-sm">No package</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="text-sm text-gray-800 dark:text-white/90">
                            {customer.session?.startTime ? formatDate(customer.session.startTime) : 'N/A'}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-sm text-gray-800 dark:text-white/90">
                            {customer.session?.ipAddress || 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FiWifi className="size-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No users currently connected</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Device Actions & Info */}
        <div className="space-y-6">
          {/* Device Actions */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
              Device Actions
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => fetchDeviceStatus()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
              >
                <FiRefreshCw className="size-4" />
                Refresh Status
              </button>
              
              <button
                onClick={() => navigate(`/routers/${id}/edit`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <FiEdit2 className="size-4" />
                Edit Device
              </button>
              
              <button
                onClick={() => {
                  const newStatus = data.device.status === 'online' ? 'offline' : 'online';
                  // Implement status update
                  console.log('Update status to:', newStatus);
                }}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${
                  data.device.status === 'online'
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {data.device.status === 'online' ? '🚫 Take Offline' : '✅ Bring Online'}
              </button>
              
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this device?')) {
                    // Implement delete
                    console.log('Delete device:', id);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <FiTrash2 className="size-4" />
                Delete Device
              </button>
            </div>
          </div>

          {/* Network Info */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6 flex items-center gap-2">
              <FiGlobe className="text-purple-500 size-5" />
              Network Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">NAS IP</p>
                <p className="font-medium text-gray-800 dark:text-white/90">{data.device.nasIp}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${data.device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium text-gray-800 dark:text-white/90 capitalize">
                    {data.device.status}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Uptime</p>
                <p className="font-medium text-gray-800 dark:text-white/90">
                  {formatUptime(data.systemResources.uptime)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Activity</p>
                <p className="font-medium text-gray-800 dark:text-white/90">
                  {formatDate(data.device.lastSeen)}
                </p>
              </div>
            </div>
          </div>

          {/* Secret Key */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6 flex items-center gap-2">
              <FiShield className="text-orange-500 size-5" />
              Security
            </h3>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Secret Key</p>
              <div className="relative">
                <input
                  type="password"
                  value={data.device.secret}
                  readOnly
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 font-mono text-sm"
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    input.type = input.type === 'password' ? 'text' : 'password';
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  type="button"
                >
                  👁️
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Used for RADIUS authentication. Keep this secret.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}