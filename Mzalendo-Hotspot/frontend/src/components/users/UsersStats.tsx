// components/users/UsersStats.tsx
import { FiPieChart, FiShield, FiActivity } from "react-icons/fi";

interface UsersStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    roles: {
      super_admin: number;
      admin: number;
      operator: number;
      viewer: number;
      custom: number;
    };
  };
}

export default function UsersStats({ stats }: UsersStatsProps) {
  const calculatePercentage = (value: number) => {
    return stats.total > 0 ? ((value / stats.total) * 100).toFixed(1) : 0;
  };

  const roleDistribution = [
    { name: 'Super Admin', count: stats.roles.super_admin || 0, color: 'bg-red-500' },
    { name: 'Admin', count: stats.roles.admin || 0, color: 'bg-orange-500' },
    { name: 'Operator', count: stats.roles.operator || 0, color: 'bg-blue-500' },
    { name: 'Viewer', count: stats.roles.viewer || 0, color: 'bg-green-500' },
    { name: 'Custom', count: stats.roles.custom || 0, color: 'bg-purple-500' }
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Activity Rate */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FiActivity className="text-blue-600 dark:text-blue-400 size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Activity Rate
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active users
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800 dark:text-white/90">
                {calculatePercentage(stats.active)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {stats.active} of {stats.total}
              </div>
            </div>
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${calculatePercentage(stats.active)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Role Distribution */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FiPieChart className="text-purple-600 dark:text-purple-400 size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Role Distribution
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                User roles breakdown
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {roleDistribution.slice(0, 3).map((role, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${role.color}`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {role.name}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {role.count}
                </div>
              </div>
            ))}
            {stats.roles.custom > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{stats.roles.custom} custom roles
              </div>
            )}
          </div>
        </div>

        {/* Inactive Users */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
              Inactive Users
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Require attention
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Count</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {stats.inactive}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stats.inactive > 0 ? "Review inactive accounts" : "No inactive users"}
            </div>
          </div>
        </div>

        {/* Admin Ratio */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <FiShield className="text-red-600 dark:text-red-400 size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Admin Ratio
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Administrative users
              </p>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white/90">
              {calculatePercentage((stats.roles.admin || 0) + (stats.roles.super_admin || 0))}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {((stats.roles.admin || 0) + (stats.roles.super_admin || 0))} of {stats.total} users
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}