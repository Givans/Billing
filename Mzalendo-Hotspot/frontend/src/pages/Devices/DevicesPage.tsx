// pages/devices/index.tsx
import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DevicesTable from "../../components/devices/DevicesTable";
import DeviceStats from "../../components/devices/DeviceStats";
import AddDeviceModal from "../../components/devices/AddDeviceModal";
import {
    FiServer,
    FiCheckCircle,
    FiXCircle,
    FiUsers,
    FiTrendingUp,
    FiPlus,
    FiRefreshCw
} from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

interface DevicePageData {
    devices: any[];
    stats: {
        total: number;
        online: number;
        offline: number;
        totalCustomers: number;
        onlineCustomers: number;
        monthlyRevenue: number;
        avgUptime: number;
        avgCpu?: number;  // Add optional
        avgRam?: number;  // Add optional
    };
    recentActivity: any[];
    healthStatus: {
        healthy: number;
        warning: number;
        critical: number;
    };
}

export default function Devices() {
    const [data, setData] = useState<DevicePageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filters, setFilters] = useState({
        status: "all",
        search: "",
        sortBy: "status",
        sortOrder: "desc"
    });

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== "all") {
                    params.append(key, value.toString());
                }
            });

            const res = await fetch(`${API_URL}/devices?${params}`);
            const result = await res.json();

            if (result.success) {
                setData(result.data);
            } else {
                // If no success property, assume direct devices array
                setData({
                    devices: result,
                    stats: calculateStats(result),
                    recentActivity: [],
                    healthStatus: calculateHealthStatus(result)
                });
            }
        } catch (error) {
            console.error("Error fetching devices:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateStats = (devices: any[]) => {
        const online = devices.filter(d => d.status === 'online').length;
        const offline = devices.filter(d => d.status === 'offline').length;
        const totalCustomers = devices.reduce((sum, d) => sum + (d.stats?.totalCustomers || 0), 0);
        const onlineCustomers = devices.reduce((sum, d) => sum + (d.stats?.onlineCustomers || 0), 0);
        const monthlyRevenue = devices.reduce((sum, d) => sum + (d.stats?.revenueMonth || 0), 0);
        const avgUptime = devices.reduce((sum, d) => sum + (d.uptime || 0), 0) / devices.length || 0;

        // Calculate average CPU and RAM
        const onlineDevices = devices.filter(d => d.status === 'online');
        const avgCpu = onlineDevices.length > 0
            ? onlineDevices.reduce((sum, d) => sum + (d.cpu || 0), 0) / onlineDevices.length
            : 0;
        const avgRam = onlineDevices.length > 0
            ? onlineDevices.reduce((sum, d) => sum + (d.ram?.percentage || 0), 0) / onlineDevices.length
            : 0;

        return {
            total: devices.length,
            online,
            offline,
            totalCustomers,
            onlineCustomers,
            monthlyRevenue,
            avgUptime: Math.round(avgUptime),
            avgCpu: Math.round(avgCpu),
            avgRam: Math.round(avgRam)
        };
    };

    const calculateHealthStatus = (devices: any[]) => {
        let healthy = 0;
        let warning = 0;
        let critical = 0;

        devices.forEach(device => {
            if (device.status === 'online') {
                const uptime = device.uptime || 0;
                if (uptime > 99) healthy++;
                else if (uptime > 90) warning++;
                else critical++;
            } else {
                critical++;
            }
        });

        return { healthy, warning, critical };
    };

    useEffect(() => {
        fetchDevices();
    }, [filters]);

    const handleFilterChange = (newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDevices();
    };

    const handleDeviceAdded = () => {
        setShowAddModal(false);
        handleRefresh();
    };

    const handleDeviceStatusUpdate = async (deviceId: string, status: 'online' | 'offline') => {
        try {
            const res = await fetch(`${API_URL}/devices/${deviceId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                handleRefresh();
            }
        } catch (error) {
            console.error("Error updating device status:", error);
        }
    };

    const quickStats = [
        {
            icon: FiServer,
            label: "Total Devices",
            value: data?.stats.total || 0,
            color: "text-blue-600",
            bgColor: "bg-blue-100 dark:bg-blue-900/30",
            trend: "+2 this month"
        },
        {
            icon: FiCheckCircle,
            label: "Online",
            value: data?.stats.online || 0,
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900/30",
            trend: `${data?.stats.online || 0}/${data?.stats.total || 0} active`
        },
        {
            icon: FiXCircle,
            label: "Offline",
            value: data?.stats.offline || 0,
            color: "text-red-600",
            bgColor: "bg-red-100 dark:bg-red-900/30",
            trend: data?.stats.offline ? "Requires attention" : "All online"
        },
        {
            icon: FiUsers,
            label: "Connected Users",
            value: data?.stats.onlineCustomers || 0,
            color: "text-purple-600",
            bgColor: "bg-purple-100 dark:bg-purple-900/30",
            trend: `${data?.stats.onlineCustomers || 0}/${data?.stats.totalCustomers || 0} active`
        },
        {
            icon: FiTrendingUp,
            label: "Monthly Revenue",
            value: data?.stats.monthlyRevenue || 0,
            color: "text-emerald-600",
            bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
            isCurrency: true,
            trend: "From all devices"
        }
    ];

    return (
        <>
            <PageMeta
                title="Devices Management | Hotspot Billing"
                description="Monitor and manage all hotspot devices with real-time status, CPU/RAM usage, and uptime tracking"
            />
            <PageBreadcrumb pageTitle="Devices Management" />

            {/* Header with Actions */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                        Network Devices
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Monitor and manage all your MikroTik hotspot devices
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <FiRefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                    >
                        <FiPlus className="size-4" />
                        Add Device
                    </button>
                </div>
            </div>

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
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {stat.trend}
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`size-6 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Device Stats Overview */}
            {data && <DeviceStats stats={data.stats} healthStatus={data.healthStatus} />}

            {/* Devices Table */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <DevicesTable
                    devices={data?.devices || []}
                    loading={loading}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onRefresh={handleRefresh}
                    onStatusUpdate={handleDeviceStatusUpdate}
                />
            </div>

            {/* Add Device Modal */}
            {/* {showAddModal && (
                <AddDeviceModal
                    onClose={() => setShowAddModal(false)}
                    onDeviceAdded={handleDeviceAdded}
                />
            )} */}

            <AddDeviceModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onDeviceAdded={handleDeviceAdded}
            />
        </>
    );
}