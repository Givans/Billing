// components/packages/PackageStats.tsx
import { FiTrendingUp, FiTrendingDown, FiDollarSign } from "react-icons/fi";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface PackageStatsProps {
  stats: {
    topPackages: any[];
    leastUsedPackages: any[];
    revenueStats: any[];
  };
}

export default function PackageStats({ stats }: PackageStatsProps) {
  // Top packages chart
  const topPackagesOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 200,
      toolbar: { show: false }
    },
    colors: ['#465FFF'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: stats.topPackages.map(p => p.package?.name || 'Unknown').slice(0, 5),
      labels: {
        formatter: function(val) {
          return parseInt(val).toString();
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + " customers";
        }
      }
    }
  };

  const topPackagesSeries = [{
    name: 'Customers',
    data: stats.topPackages.map(p => p.count).slice(0, 5)
  }];

  // Revenue chart
  const revenueChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 200
    },
    colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'],
    labels: stats.revenueStats.map(r => r.packageName).slice(0, 5),
    legend: {
      position: 'bottom'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '50%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Revenue',
              formatter: function () {
                const total = stats.revenueStats.reduce((sum, r) => sum + r.totalRevenue, 0);
                return 'KES ' + total.toLocaleString();
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    }
  };

  const revenueChartSeries = stats.revenueStats.map(r => r.totalRevenue).slice(0, 5);

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Packages */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiTrendingUp className="text-emerald-500 size-5" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Most Popular Packages
            </h3>
          </div>
          
          <Chart 
            options={topPackagesOptions} 
            series={topPackagesSeries} 
            type="bar" 
            height={200}
          />
          
          <div className="mt-4 space-y-2">
            {stats.topPackages.slice(0, 3).map((pkg, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-semibold text-gray-500">#{index + 1}</div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white/90">
                      {pkg.package?.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      KES {pkg.package?.price || 0}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800 dark:text-white/90">
                    {pkg.count} customers
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    KES {(pkg.package?.price || 0) * pkg.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiDollarSign className="text-green-500 size-5" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Revenue Breakdown
            </h3>
          </div>
          
          <Chart 
            options={revenueChartOptions} 
            series={revenueChartSeries} 
            type="donut" 
            height={200}
          />
          
          <div className="mt-4 space-y-2">
            {stats.revenueStats.slice(0, 3).map((revenue, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: revenueChartOptions.colors?.[index] as string || '#3498db' }}
                  />
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white/90">
                      {revenue.packageName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {revenue.customerCount} customers
                    </div>
                  </div>
                </div>
                <div className="font-bold text-gray-800 dark:text-white/90">
                  KES {revenue.totalRevenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Least Used Packages */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiTrendingDown className="text-amber-500 size-5" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Least Used Packages
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.leastUsedPackages.slice(0, 3).map((pkg, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: pkg.package?.colorCode || '#3498db' }}
                  />
                  <div className="font-medium text-gray-800 dark:text-white/90">
                    {pkg.package?.name || 'Unknown'}
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {pkg.count}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Price</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    KES {pkg.package?.price || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Duration</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {pkg.package?.duration?.value} {pkg.package?.duration?.unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Speed</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {pkg.package?.speed?.download}/{pkg.package?.speed?.upload} Mbps
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}