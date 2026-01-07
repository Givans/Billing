// components/accounts/PaymentCharts.tsx
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { FiPieChart, FiBarChart2, FiServer } from "react-icons/fi";

interface PaymentChartsProps {
  data: {
    dailyRevenue: any[];
    paymentMethod: any[];
    deviceRevenue: any[];
  };
}

export default function PaymentCharts({ data }: PaymentChartsProps) {
  // Daily Revenue Chart
  const dailyChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 250,
      toolbar: { show: false }
    },
    colors: ['#465FFF'],
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: data.dailyRevenue.map(item => 
        `${item._id.month}/${item._id.day}`
      ),
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Revenue (KES)',
        style: {
          fontSize: '12px'
        }
      },
      labels: {
        formatter: function(val) {
          return 'KES ' + val.toLocaleString();
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return 'KES ' + val.toLocaleString();
        }
      }
    }
  };

  const dailyChartSeries = [{
    name: 'Revenue',
    data: data.dailyRevenue.map(item => item.revenue || 0)
  }];

  // Payment Method Breakdown Chart
  const paymentMethodOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 250
    },
    colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'],
    labels: data.paymentMethod.map(item => item._id?.toUpperCase() || 'Unknown'),
    legend: {
      position: 'bottom',
      fontSize: '12px'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: function () {
                const total = data.paymentMethod.reduce((sum, item) => sum + (item.amount || 0), 0);
                return 'KES ' + total.toLocaleString();
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return 'KES ' + val.toLocaleString();
        }
      }
    }
  };

  const paymentMethodSeries = data.paymentMethod.map(item => item.amount || 0);

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiBarChart2 className="text-blue-500 size-5" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              7-Day Revenue Trend
            </h3>
          </div>
          
          <Chart 
            options={dailyChartOptions} 
            series={dailyChartSeries} 
            type="area" 
            height={250}
          />
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Highest Day</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white/90">
                KES {Math.max(...data.dailyRevenue.map(d => d.revenue || 0)).toLocaleString()}
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">7-Day Total</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white/90">
                KES {data.dailyRevenue.reduce((sum, d) => sum + (d.revenue || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiPieChart className="text-green-500 size-5" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Payment Method Breakdown
            </h3>
          </div>
          
          <Chart 
            options={paymentMethodOptions} 
            series={paymentMethodSeries} 
            type="donut" 
            height={250}
          />
          
          <div className="mt-4 space-y-2">
            {data.paymentMethod.slice(0, 3).map((method, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ 
                      backgroundColor: (paymentMethodOptions.colors as string[])?.[index] || '#3498db' 
                    }}
                  />
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white/90">
                      {method._id?.toUpperCase() || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {method.count} transactions
                    </div>
                  </div>
                </div>
                <div className="font-bold text-gray-800 dark:text-white/90">
                  KES {(method.amount || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Device Revenue Breakdown */}
      {data.deviceRevenue.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiServer className="text-purple-500 size-5" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Top Performing Devices
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.deviceRevenue.map((device, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white/90">
                        {device.device?.name || 'Unknown Device'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {device.device?.nasIp || ''}
                      </div>
                    </div>
                  </div>
                  {index === 0 && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      #1
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Revenue</span>
                    <span className="font-bold text-gray-800 dark:text-white/90">
                      KES {(device.revenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Transactions</span>
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {device.count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Avg. Transaction</span>
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      KES {device.count > 0 ? Math.round(device.revenue / device.count).toLocaleString() : 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}