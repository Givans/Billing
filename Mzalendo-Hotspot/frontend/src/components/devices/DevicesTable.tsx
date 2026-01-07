// components/devices/DevicesTable.tsx
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import {
    FiServer,
    FiWifi,
    FiGlobe,
    FiActivity,
    FiCpu,
    FiDatabase,
    FiEdit2,
    //   FiTrash2,
    FiRefreshCw,
    FiEye,
    //   FiMoreVertical
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

interface DevicesTableProps {
    devices: any[];
    loading: boolean;
    filters: any;
    onFilterChange: (filters: any) => void;
    onRefresh: () => void;
    onStatusUpdate: (deviceId: string, status: 'online' | 'offline') => void;
}

export default function DevicesTable({
    devices,
    loading,
    filters,
    onFilterChange,
    onRefresh,
    onStatusUpdate
}: DevicesTableProps) {
    const navigate = useNavigate();
    const [deviceStatuses, setDeviceStatuses] = useState<Record<string, any>>({});
    //   const [pollingIntervals, setPollingIntervals] = useState<NodeJS.Timeout[]>([]);
    const [pollingIntervals, setPollingIntervals] = useState<number[]>([]);

    const fetchDeviceStatus = async (deviceId: string) => {
        try {
            const res = await fetch(`${API_URL}/devices/${deviceId}/status`);
            const data = await res.json();

            if (data && data.device) {
                setDeviceStatuses(prev => ({
                    ...prev,
                    [deviceId]: data
                }));
            }
        } catch (error) {
            console.error(`Error fetching status for device ${deviceId}:`, error);
        }
    };

    const startPolling = (deviceId: string) => {
        fetchDeviceStatus(deviceId);
        // const interval = setInterval(() => fetchDeviceStatus(deviceId), 30000); // Poll every 30 seconds
        // setPollingIntervals(prev => [...prev, interval]);
        const intervalId = window.setInterval(() => fetchDeviceStatus(deviceId), 30000);
        setPollingIntervals(prev => [...prev, intervalId]);
        
    };

    useEffect(() => {
        // Start polling for all devices
        devices.forEach(device => {
            startPolling(device._id);
        });

        // Cleanup intervals on unmount
        return () => {
            pollingIntervals.forEach(interval => clearInterval(interval));
        };
    }, [devices]);

    const formatUptime = (seconds: number) => {
        if (!seconds) return "N/A";

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) return `${days}d ${hours}h`;
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'success';
            case 'offline': return 'error';
            default: return 'gray';
        }
    };

    const getHealthColor = (cpu: number, ram: number) => {
        if (cpu > 80 || ram > 80) return "error";
        if (cpu > 60 || ram > 60) return "warning";
        return "success";
    };

    const handleManualRefresh = (deviceId: string) => {
        fetchDeviceStatus(deviceId);
        onRefresh();
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (devices.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <FiServer className="size-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                    No Devices Found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    Add your first device to get started
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Filters */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <select
                            value={filters.status}
                            onChange={(e) => onFilterChange({ status: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                            <option value="all">All Status</option>
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                        </select>

                        <select
                            value={filters.sortBy}
                            onChange={(e) => onFilterChange({ sortBy: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                            <option value="status">Sort by Status</option>
                            <option value="name">Sort by Name</option>
                            <option value="customers">Sort by Customers</option>
                            <option value="revenue">Sort by Revenue</option>
                        </select>

                        <select
                            value={filters.sortOrder}
                            onChange={(e) => onFilterChange({ sortOrder: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => onFilterChange({ search: e.target.value })}
                                placeholder="Search devices..."
                                className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            />
                            <FiServer className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="border-b border-gray-200 dark:border-gray-800">
                        <TableRow>
                            <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                                Device
                            </TableCell>
                            <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                                Status & Uptime
                            </TableCell>
                            <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                                System Resources
                            </TableCell>
                            <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                                Network & Connections
                            </TableCell>
                            <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                                Performance
                            </TableCell>
                            <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {devices.map((device) => {
                            const statusData = deviceStatuses[device._id];
                            const cpu = statusData?.cpu || 0;
                            const ram = statusData?.ram || { used: 0, total: 0, percentage: 0 };
                            const uptime = statusData?.uptime || 0;
                            const onlineCustomers = statusData?.onlineCustomers || device.stats?.onlineCustomers || 0;

                            return (
                                <TableRow key={device._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                    <TableCell className="px-6 py-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${device.status === 'online' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                                    <FiServer className={device.status === 'online' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-800 dark:text-white/90">
                                                        {device.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {device.nasIp}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                {device.location || 'No location specified'}
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-6 py-4">
                                        <div className="space-y-2">
                                            <Badge
                                                color={getStatusColor(device.status)}
                                                variant="light"
                                            >
                                                <span className="flex items-center gap-1">
                                                    <span className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    {device.status}
                                                </span>
                                            </Badge>

                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <FiActivity className="size-3" />
                                                    <span>Uptime: {formatUptime(uptime)}</span>
                                                </div>
                                                <div className="mt-1 text-xs text-gray-500">
                                                    Last seen: {new Date(device.lastSeen || device.updatedAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-6 py-4">
                                        <div className="space-y-3">
                                            {/* CPU Usage */}
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                    <span className="flex items-center gap-1">
                                                        <FiCpu className="size-3" />
                                                        CPU
                                                    </span>
                                                    <span>{cpu}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${cpu > 80 ? 'bg-red-500' :
                                                            cpu > 60 ? 'bg-yellow-500' :
                                                                'bg-green-500'
                                                            }`}
                                                        style={{ width: `${cpu}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* RAM Usage */}
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                    <span className="flex items-center gap-1">
                                                        <FiDatabase className="size-3" />
                                                        RAM
                                                    </span>
                                                    <span>{ram.percentage}% ({formatBytes(ram.used)}/{formatBytes(ram.total)})</span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${ram.percentage > 80 ? 'bg-red-500' :
                                                            ram.percentage > 60 ? 'bg-yellow-500' :
                                                                'bg-green-500'
                                                            }`}
                                                        style={{ width: `${ram.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-6 py-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                    <FiWifi className="text-blue-600 dark:text-blue-400 size-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-800 dark:text-white/90">
                                                        {onlineCustomers}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Active users
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                    <FiGlobe className="text-purple-600 dark:text-purple-400 size-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-800 dark:text-white/90">
                                                        {device.stats?.totalCustomers || 0}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Total registered
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-6 py-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Health</span>
                                                <Badge
                                                    color={getHealthColor(cpu, ram.percentage)}
                                                    variant="light"
                                                    size="sm"
                                                >
                                                    {getHealthColor(cpu, ram.percentage) === 'success' ? 'Healthy' :
                                                        getHealthColor(cpu, ram.percentage) === 'warning' ? 'Warning' : 'Critical'}
                                                </Badge>
                                            </div>

                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 dark:text-gray-400">Monthly Revenue</span>
                                                    <span className="font-medium text-gray-800 dark:text-white/90">
                                                        KES {(device.stats?.revenueMonth || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 dark:text-gray-400">Today</span>
                                                    <span className="font-medium text-gray-800 dark:text-white/90">
                                                        KES {(device.stats?.revenueToday || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/devices/${device._id}`)}
                                                className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                                                title="View Details"
                                            >
                                                <FiEye className="size-4" />
                                            </button>

                                            <button
                                                onClick={() => handleManualRefresh(device._id)}
                                                className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400"
                                                title="Refresh Status"
                                            >
                                                <FiRefreshCw className="size-4" />
                                            </button>

                                            <button
                                                onClick={() => onStatusUpdate(device._id, device.status === 'online' ? 'offline' : 'online')}
                                                className={`p-2 ${device.status === 'online'
                                                    ? 'text-amber-500 hover:text-amber-600'
                                                    : 'text-green-500 hover:text-green-600'
                                                    }`}
                                                title={device.status === 'online' ? 'Take Offline' : 'Bring Online'}
                                            >
                                                {device.status === 'online' ? '🚫' : '✅'}
                                            </button>

                                            <button
                                                onClick={() => console.log('Edit device', device._id)}
                                                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                                title="Edit Device"
                                            >
                                                <FiEdit2 className="size-4" />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}