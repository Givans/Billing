// components/ecommerce/CustomerStatusSummary.tsx
import { FiUser, FiUserCheck, FiUserX, FiClock } from "react-icons/fi";
import Badge from "../ui/badge/Badge";

interface CustomerStatusSummaryProps {
  metrics?: {
    customers: {
      total: number;
      online: number;
      active: number;
      expired: number;
      disabled: number;
    };
  };
}

export default function CustomerStatusSummary({ metrics }: CustomerStatusSummaryProps) {
  if (!metrics) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statusItems = [
    {
      icon: FiUserCheck,
      label: "Active",
      count: metrics.customers.active,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30"
    },
    {
      icon: FiUser,
      label: "Online",
      count: metrics.customers.online,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      icon: FiClock,
      label: "Expired",
      count: metrics.customers.expired,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30"
    },
    {
      icon: FiUserX,
      label: "Disabled",
      count: metrics.customers.disabled,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30"
    }
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Customer Status
      </h3>
      <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
        Breakdown of customer status
      </p>

      <div className="mt-6 space-y-4">
        {statusItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${item.bgColor}`}>
                <item.icon className={`size-5 ${item.color}`} />
              </div>
              <div>
                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  {item.label}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800 text-theme-sm dark:text-white/90">
                {item.count.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {((item.count / metrics.customers.total) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Total Customers</span>
          <Badge color="primary" variant="solid">
            {metrics.customers.total.toLocaleString()}
          </Badge>
        </div>
      </div>
    </div>
  );
}