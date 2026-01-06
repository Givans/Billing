// components/ecommerce/PackageDistribution.tsx (renamed from MonthlyTarget)
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { FiMoreVertical, FiPackage } from "react-icons/fi";

interface PackageDistributionProps {
    data?: Array<{
        name: string;
        count: number;
        revenue: number;
    }>;
}

export default function PackageDistribution({ data }: PackageDistributionProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Prepare chart data from props
    const chartData = data || [
        { name: "Basic 1hr", count: 45, revenue: 4500 },
        { name: "Premium 24hr", count: 30, revenue: 15000 },
        { name: "Standard 12hr", count: 25, revenue: 7500 },
    ];

    const series = chartData.map(item => item.count);
    const labels = chartData.map(item => item.name);

    const options: ApexOptions = {
        chart: {
            fontFamily: "Outfit, sans-serif",
            type: "donut",
            height: 330,
        },
        colors: ["#465FFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
        labels: labels,
        legend: {
            show: true,
            position: "bottom",
            horizontalAlign: "center",
            fontSize: "12px",
            fontFamily: "Outfit, sans-serif",
            markers: {
                size: 8,
                strokeWidth: 0,
            },
            itemMargin: {
                horizontal: 10,
                vertical: 5,
            },
        },
        plotOptions: {
            pie: {
                donut: {
                    size: "65%",
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#6B7280",
                        },
                        value: {
                            show: true,
                            fontSize: "28px",
                            fontWeight: 600,
                            color: "#1D2939",
                            formatter: function (val) {
                                return val;
                            },
                        },
                        total: {
                            show: true,
                            label: "Total Customers",
                            color: "#6B7280",
                            fontSize: "14px",
                            formatter: function (w) {
                                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString();
                            },
                        },
                    },
                },
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            width: 1,
            colors: ["transparent"],
        },
        responsive: [
            {
                breakpoint: 640,
                options: {
                    chart: {
                        height: 300,
                    },
                },
            },
        ],
    };

    function toggleDropdown() {
        setIsOpen(!isOpen);
    }

    function closeDropdown() {
        setIsOpen(false);
    }

    // const totalCustomers = chartData.reduce((sum, item) => sum + item.count, 0);
    const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="px-5 pt-5 rounded-2xl pb-6 sm:px-6 sm:pt-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Package Distribution
                        </h3>
                        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                            Customer count by package type
                        </p>
                    </div>
                    <div className="relative inline-block">
                        <button className="dropdown-toggle" onClick={toggleDropdown}>
                            <FiMoreVertical className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-5" />
                        </button>
                        <Dropdown
                            isOpen={isOpen}
                            onClose={closeDropdown}
                            className="w-40 p-2"
                        >
                            <DropdownItem
                                onItemClick={closeDropdown}
                                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                            >
                                View Details
                            </DropdownItem>
                            <DropdownItem
                                onItemClick={closeDropdown}
                                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                            >
                                Export Data
                            </DropdownItem>
                        </Dropdown>
                    </div>
                </div>

                <div className="relative">
                    <div className="max-h-[330px]" id="packageDistributionChart">
                        <Chart
                            options={options}
                            series={series}
                            type="donut"
                            height={330}
                        />
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800">
                    <div className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <FiPackage className="text-gray-500 size-4 dark:text-gray-400" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Total Packages
                            </p>
                        </div>
                        <p className="text-xl font-semibold text-gray-800 dark:text-white/90">
                            {chartData.length}
                        </p>
                    </div>

                    <div className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <svg className="text-gray-500 size-4 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Total Revenue
                            </p>
                        </div>
                        <p className="text-xl font-semibold text-gray-800 dark:text-white/90">
                            KES {totalRevenue.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}