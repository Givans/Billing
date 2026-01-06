// components/ecommerce/HotspotMetrics.tsx
import { FiWifi, FiServer, FiUsers, FiCreditCard, FiArrowUp, FiArrowDown } from "react-icons/fi";
import Badge from "../ui/badge/Badge";

interface HotspotMetricsProps {
  metrics?: {
    customers: {
      total: number;
      online: number;
      active: number;
      expired: number;
      disabled: number;
    };
    devices: {
      total: number;
      online: number;
      offline: number;
    };
    revenue: {
      today: number;
      month: number;
      changePercentage: number;
    };
    payments: {
      successful: number;
    };
  };
}

export default function HotspotMetrics({ metrics }: HotspotMetricsProps) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="animate-pulse">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="mt-5">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-8 mt-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Online Customers */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-900/30">
          <FiWifi className="text-green-600 size-6 dark:text-green-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Online Customers
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(metrics.customers.online)}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatNumber(metrics.customers.active)} Active Total
            </p>
          </div>
          <Badge color={metrics.customers.online > 0 ? "success" : "gray"}>
            {metrics.customers.online > 0 ? (
              <>
                <FiWifi className="size-3" />
                Online
              </>
            ) : (
              "Offline"
            )}
          </Badge>
        </div>
      </div>

      {/* Active Devices */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-900/30">
          <FiServer className="text-blue-600 size-6 dark:text-blue-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Active Devices
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(metrics.devices.online)} / {formatNumber(metrics.devices.total)}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatNumber(metrics.devices.offline)} Offline
            </p>
          </div>
          <Badge color={metrics.devices.online > 0 ? "success" : "error"}>
            {metrics.devices.online > 0 ? (
              <>
                <FiArrowUp className="size-3" />
                {Math.round((metrics.devices.online / metrics.devices.total) * 100)}%
              </>
            ) : (
              <>
                <FiArrowDown className="size-3" />
                0%
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Monthly Revenue */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl dark:bg-purple-900/30">
          <FiCreditCard className="text-purple-600 size-6 dark:text-purple-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Monthly Revenue
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatCurrency(metrics.revenue.month)}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Today: {formatCurrency(metrics.revenue.today)}
            </p>
          </div>
          <Badge color={metrics.revenue.changePercentage >= 0 ? "success" : "error"}>
            {metrics.revenue.changePercentage >= 0 ? (
              <>
                <FiArrowUp className="size-3" />
                {metrics.revenue.changePercentage.toFixed(1)}%
              </>
            ) : (
              <>
                <FiArrowDown className="size-3" />
                {Math.abs(metrics.revenue.changePercentage).toFixed(1)}%
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Total Customers */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl dark:bg-orange-900/30">
          <FiUsers className="text-orange-600 size-6 dark:text-orange-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Customers
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(metrics.customers.total)}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatNumber(metrics.customers.expired)} Expired • {formatNumber(metrics.customers.disabled)} Disabled
            </p>
          </div>
          <Badge color={metrics.payments.successful > 0 ? "success" : "gray"}>
            {formatNumber(metrics.payments.successful)} Paid
          </Badge>
        </div>
      </div>
    </div>
  );
}