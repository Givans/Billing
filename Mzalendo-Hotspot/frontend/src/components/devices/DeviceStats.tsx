// components/devices/DeviceStats.tsx
import { FiActivity, FiBarChart2, FiCpu, FiDatabase } from "react-icons/fi";

interface DeviceStatsProps {
  stats: {
    total: number;
    online: number;
    offline: number;
    totalCustomers: number;
    onlineCustomers: number;
    monthlyRevenue: number;
    avgUptime: number;
    avgCpu?: number;
    avgRam?: number;
  };
  healthStatus: {
    healthy: number;
    warning: number;
    critical: number;
  };
}

export default function DeviceStats({ stats, healthStatus }: DeviceStatsProps) {
  const formatUptime = (seconds: number) => {
    if (!seconds) return "0s";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const healthPercentage = stats.total > 0
    ? (((healthStatus?.healthy || 0) / stats.total) * 100).toFixed(1)
    : 100;

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* System Health */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <FiActivity className="text-emerald-600 dark:text-emerald-400 size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                System Health
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Overall device status
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800 dark:text-white/90">
                {healthPercentage}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {healthStatus ? `${healthStatus.healthy}/${stats.total}` : '0/0'} healthy
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                Healthy: {healthStatus?.healthy || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-1"></span>
                Warning: {healthStatus?.warning || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                Critical: {healthStatus?.critical || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Average Uptime */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FiBarChart2 className="text-blue-600 dark:text-blue-400 size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Avg. Uptime
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Across all devices
              </p>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white/90">
              {formatUptime(stats.avgUptime)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Average device uptime
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <FiCpu className="text-purple-500 size-5" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Resource Usage
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Average across online devices
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span>CPU Usage</span>
                <span>{stats.avgCpu || 0}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${(stats.avgCpu || 0) > 80 ? 'bg-red-500' :
                    (stats.avgCpu || 0) > 60 ? 'bg-yellow-500' :
                      'bg-purple-500'
                    }`}
                  style={{ width: `${stats.avgCpu || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span>RAM Usage</span>
                <span>{stats.avgRam || 0}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${(stats.avgRam || 0) > 80 ? 'bg-red-500' :
                    (stats.avgRam || 0) > 60 ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}
                  style={{ width: `${stats.avgRam || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Connection Density */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FiDatabase className="text-green-600 dark:text-green-400 size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Connection Density
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Users per device
              </p>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white/90">
              {stats.total > 0 ? Math.round(stats.totalCustomers / stats.total) : 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {stats.onlineCustomers} active of {stats.totalCustomers} total
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}