// components/accounts/PaymentStats.tsx
import { FiTrendingUp, FiPercent } from "react-icons/fi";

interface PaymentStatsProps {
  stats: {
    totalAmount: number;
    totalCount: number;
    completedAmount: number;
    completedCount: number;
    pendingCount: number;
    failedCount: number;
  };
}

export default function PaymentStats({ stats }: PaymentStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const successRate = stats.totalCount > 0 
    ? (stats.completedCount / stats.totalCount) * 100 
    : 0;

  const avgTransactionValue = stats.completedCount > 0
    ? stats.completedAmount / stats.completedCount
    : 0;

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Success Rate */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FiPercent className="text-green-600 dark:text-green-400 size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Success Rate
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Completed transactions
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800 dark:text-white/90">
                {successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {stats.completedCount} of {stats.totalCount}
              </div>
            </div>
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Average Transaction */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FiTrendingUp className="text-blue-600 dark:text-blue-400 size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Avg. Transaction
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Per completed payment
              </p>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white/90">
              {formatCurrency(avgTransactionValue)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Based on {stats.completedCount} transactions
            </div>
          </div>
        </div>

        {/* Pending Value */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
              Pending Value
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Awaiting completion
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Transactions</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {stats.pendingCount}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Estimated value not available
            </div>
          </div>
        </div>

        {/* Failed Transactions */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
              Failed Transactions
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Require attention
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Count</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {stats.failedCount}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stats.failedCount > 0 ? "Review and retry failed payments" : "No failed payments"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}