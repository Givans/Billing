// pages/customers/CustomerDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import {
    FiArrowLeft,
    FiWifi,
    FiWifiOff,
    FiSmartphone,
    FiServer,
    FiPackage,
    FiClock,
    FiCalendar,
    FiActivity,
    FiEdit,
    FiTrash2,
    FiCreditCard,
    FiUser,
    FiDatabase,
    FiRefreshCw,
    FiCheckCircle,
    FiXCircle,
    FiPlus,
    FiDownload,
    FiUpload
} from "react-icons/fi";
import Badge from "../../components/ui/badge/Badge";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const API_URL = "http://localhost:5000/api";

interface CustomerData {
    customer: any;
    payments: any[];
    sessions: any[];
    usageStats: {
        totalDownload: number;
        totalUpload: number;
        totalSessions: number;
        totalDuration: number;
        totalDataGB: number;
    };
}

export default function CustomerDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<CustomerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // const [showPayments, setShowPayments] = useState(true);
    // const [showSessions, setShowSessions] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        if (id) {
            fetchCustomerData();

            // Refresh every 30 seconds for real-time updates
            const interval = setInterval(fetchCustomerData, 30000);
            return () => clearInterval(interval);
        }
    }, [id]);

    const fetchCustomerData = async () => {
        try {
            setLoading(true);

            // Fetch all data in parallel
            const [customerRes, paymentsRes, sessionsRes, usageRes] = await Promise.all([
                fetch(`${API_URL}/customers/${id}`),
                fetch(`${API_URL}/customers/${id}/payments?limit=20`),
                fetch(`${API_URL}/customers/${id}/sessions?limit=20`),
                fetch(`${API_URL}/customers/${id}/usage`)
            ]);

            const [customerData, paymentsData, sessionsData, usageData] = await Promise.all([
                customerRes.json(),
                paymentsRes.json(),
                sessionsRes.json(),
                usageRes.json()
            ]);

            if (customerData.success) {
                setData({
                    customer: customerData.customer,
                    payments: paymentsData.success ? paymentsData.payments : [],
                    sessions: sessionsData.success ? sessionsData.sessions : [],
                    usageStats: usageData.success ? usageData.usage : {
                        totalDownload: 0,
                        totalUpload: 0,
                        totalSessions: 0,
                        totalDuration: 0,
                        totalDataGB: 0
                    }
                });
                setError(null);
            } else {
                setError(customerData.error || 'Customer not found');
            }
        } catch (err) {
            setError('Failed to load customer data');
            console.error('Error fetching customer data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAction = async (action: string) => {
        if (!id) return;

        try {
            const res = await fetch(`${API_URL}/customers/${id}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            const result = await res.json();
            if (result.success) {
                fetchCustomerData(); // Refresh data
            }
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDuration = (seconds: number) => {
        if (!seconds) return '0s';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    };

    const getStatusColor = (customer: any) => {
        if (customer.session?.isOnline) return "success";
        if (customer.status === "active") return "primary";
        if (customer.status === "expired") return "warning";
        if (customer.status === "disabled") return "error";
        return "gray";
    };

    const getStatusText = (customer: any) => {
        if (customer.session?.isOnline) return "Online";
        if (customer.status === "active") return "Active";
        if (customer.status === "expired") return "Expired";
        if (customer.status === "disabled") return "Disabled";
        return "Unknown";
    };

    // Usage chart options
    // Replace the usageChartOptions section with this:

    // Calculate total data before using it in options
    const totalData = data ? data.usageStats.totalDownload + data.usageStats.totalUpload : 0;

    const usageChartOptions: ApexOptions = {
        chart: {
            type: 'donut',
            height: 250,
        },
        colors: ['#10B981', '#3B82F6'],
        labels: ['Download', 'Upload'],
        legend: {
            position: 'bottom',
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '60%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total Data',
                            formatter: function () {
                                return formatBytes(totalData);
                            }
                        }
                    }
                }
            }
        },
        dataLabels: {
            enabled: false,
        },
    };

    const usageChartSeries = [
        data?.usageStats.totalDownload || 0,
        data?.usageStats.totalUpload || 0
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading customer details...</p>
                </div>
            </div>
        );
    }

    if (error || !data?.customer) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-400 dark:text-red-500 mb-4">
                    <FiUser className="size-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                    {error || 'Customer not found'}
                </h3>
                <button
                    onClick={() => navigate('/clients')}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                >
                    <FiArrowLeft className="size-4" />
                    Back to Customers
                </button>
            </div>
        );
    }

    const customer = data.customer;
    const isExpired = new Date(customer.currentPackage?.expiryDate || 0) < new Date();

    return (
        <>
            <PageMeta
                title={`${customer.macAddress} | Customer Details`}
                description="Complete customer information, payments, sessions, and management"
            />

            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/clients')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 mb-4"
                >
                    <FiArrowLeft className="size-4" />
                    Back to Customers
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                            {customer.macAddress}
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <Badge color={getStatusColor(customer)} variant="solid">
                                {getStatusText(customer)}
                            </Badge>
                            <span className="text-gray-500 dark:text-gray-400">
                                Created {formatDate(customer.createdAt)}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={fetchCustomerData}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                            title="Refresh"
                        >
                            <FiRefreshCw className="size-5" />
                        </button>
                        <button className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 flex items-center gap-2">
                            <FiEdit className="size-4" />
                            Edit
                        </button>
                        <button
                            onClick={() => handleQuickAction('delete')}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                        >
                            <FiTrash2 className="size-4" />
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
                <nav className="-mb-px flex space-x-8">
                    {['overview', 'payments', 'sessions', 'usage'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                py-2 px-1 border-b-2 font-medium text-sm capitalize
                ${activeTab === tab
                                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }
              `}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Customer Info & Package */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer Information Card */}
                        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Customer Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">MAC Address</label>
                                        <p className="font-mono font-medium text-gray-800 dark:text-white/90">{customer.macAddress}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Phone Number</label>
                                        <div className="flex items-center gap-2">
                                            <FiSmartphone className="text-gray-500 size-4" />
                                            <p className="font-medium text-gray-800 dark:text-white/90">
                                                {customer.phoneNumber || 'Not provided'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Device</label>
                                        <div className="flex items-center gap-2">
                                            <FiServer className="text-gray-500 size-4" />
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-white/90">
                                                    {customer.device?.name || 'N/A'}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {customer.device?.nasIp || ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Session Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Connection Status</label>
                                        <div className="flex items-center gap-2">
                                            {customer.session?.isOnline ? (
                                                <>
                                                    <FiWifi className="text-green-500 size-4" />
                                                    <span className="font-medium text-green-600 dark:text-green-400">Online</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FiWifiOff className="text-gray-500 size-4" />
                                                    <span className="font-medium text-gray-600 dark:text-gray-400">Offline</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Last Seen</label>
                                        <div className="flex items-center gap-2">
                                            <FiClock className="text-gray-500 size-4" />
                                            <p className="font-medium text-gray-800 dark:text-white/90">
                                                {customer.lastSeen ? formatDate(customer.lastSeen) : 'Never'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Total Connections</label>
                                        <p className="font-medium text-gray-800 dark:text-white/90">
                                            {customer.totalConnections || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Package Information Card */}
                        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Package Information</h3>
                                {isExpired && (
                                    <Badge color="warning" variant="solid">
                                        Expired
                                    </Badge>
                                )}
                            </div>

                            {customer.currentPackage ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="p-4 rounded-xl"
                                                style={{ backgroundColor: customer.currentPackage.package?.colorCode || '#3498db' }}
                                            >
                                                <FiPackage className="text-white size-8" />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-500 dark:text-gray-400">Current Package</label>
                                                <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">
                                                    {customer.currentPackage.package?.name || 'No Package'}
                                                </h4>
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    {formatCurrency(customer.currentPackage.package?.price || 0)}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Speed</label>
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Download</p>
                                                    <p className="font-medium text-gray-800 dark:text-white/90">
                                                        {customer.currentPackage.package?.speed?.download || 0} Mbps
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Upload</p>
                                                    <p className="font-medium text-gray-800 dark:text-white/90">
                                                        {customer.currentPackage.package?.speed?.upload || 0} Mbps
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Expiry Date</label>
                                            <div className="flex items-center gap-2">
                                                <FiCalendar className="text-gray-500 size-4" />
                                                <span className={`font-medium ${isExpired
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : 'text-gray-800 dark:text-white/90'
                                                    }`}>
                                                    {formatDate(customer.currentPackage.expiryDate)}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Data Usage</label>
                                            <div className="flex items-center gap-2">
                                                <FiDatabase className="text-gray-500 size-4" />
                                                <span className="font-medium text-gray-800 dark:text-white/90">
                                                    {(customer.currentPackage.dataUsed / (1024 * 1024 * 1024)).toFixed(2)} GB
                                                    {customer.currentPackage.package?.dataLimit !== 'unlimited' &&
                                                        ` of ${customer.currentPackage.package?.dataAmount || 0} GB`
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Package Type</label>
                                            <Badge color="info" variant="light">
                                                {customer.currentPackage.package?.type || 'hotspot'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FiPackage className="text-gray-400 size-12 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">No active package</p>
                                    <button className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 flex items-center gap-2 mx-auto">
                                        <FiPlus className="size-4" />
                                        Assign Package
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Quick Actions & Stats */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => handleQuickAction('extend')}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                >
                                    <FiClock className="size-5" />
                                    <div className="text-left">
                                        <p className="font-medium">Extend Subscription</p>
                                        <p className="text-sm">Add 30 days</p>
                                    </div>
                                </button>

                                {customer.status === 'active' && !customer.session?.isOnline && (
                                    <>
                                        <button
                                            onClick={() => handleQuickAction('expire')}
                                            className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30"
                                        >
                                            <FiClock className="size-5" />
                                            <div className="text-left">
                                                <p className="font-medium">Set as Expired</p>
                                                <p className="text-sm">Immediate expiry</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => handleQuickAction('disable')}
                                            className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                                        >
                                            <FiXCircle className="size-5" />
                                            <div className="text-left">
                                                <p className="font-medium">Disable Customer</p>
                                                <p className="text-sm">Block access</p>
                                            </div>
                                        </button>
                                    </>
                                )}

                                {customer.status === 'disabled' && (
                                    <button
                                        onClick={() => handleQuickAction('enable')}
                                        className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30"
                                    >
                                        <FiCheckCircle className="size-5" />
                                        <div className="text-left">
                                            <p className="font-medium">Enable Customer</p>
                                            <p className="text-sm">Restore access</p>
                                        </div>
                                    </button>
                                )}

                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30">
                                    <FiCreditCard className="size-5" />
                                    <div className="text-left">
                                        <p className="font-medium">Add Payment</p>
                                        <p className="text-sm">Manual payment</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Usage Stats */}
                        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Usage Statistics</h3>

                            <div className="mb-4">
                                <Chart
                                    options={usageChartOptions}
                                    series={usageChartSeries}
                                    type="donut"
                                    height={250}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400">Total Sessions</span>
                                    <span className="font-medium text-gray-800 dark:text-white/90">
                                        {data.usageStats.totalSessions}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400">Total Duration</span>
                                    <span className="font-medium text-gray-800 dark:text-white/90">
                                        {formatDuration(data.usageStats.totalDuration)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400">Total Spent</span>
                                    <span className="font-medium text-gray-800 dark:text-white/90">
                                        {formatCurrency(customer.totalSpent || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Payment Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400">Total Payments</span>
                                    <span className="font-medium text-gray-800 dark:text-white/90">
                                        {data.payments.length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400">Total Amount</span>
                                    <span className="font-medium text-gray-800 dark:text-white/90">
                                        {formatCurrency(data.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0))}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400">Last Payment</span>
                                    <span className="font-medium text-gray-800 dark:text-white/90">
                                        {data.payments[0] ? formatDate(data.payments[0].createdAt) : 'Never'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Payment History</h3>
                            <button className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 flex items-center gap-2">
                                <FiPlus className="size-4" />
                                Add Payment
                            </button>
                        </div>
                    </div>

                    {data.payments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-800">
                                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Transaction ID</th>
                                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Package</th>
                                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Method</th>
                                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {data.payments.map((payment) => (
                                        <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                            <td className="py-3 px-6">
                                                <div className="font-mono text-sm text-gray-800 dark:text-white/90">
                                                    {payment.transactionId || payment._id}
                                                </div>
                                                {payment.mpesaReceiptNumber && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        M-Pesa: {payment.mpesaReceiptNumber}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: payment.package?.colorCode || '#3498db' }}
                                                    />
                                                    <span className="text-gray-800 dark:text-white/90">
                                                        {payment.package?.name || 'Package'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 font-medium text-gray-800 dark:text-white/90">
                                                {formatCurrency(payment.amount)}
                                            </td>
                                            <td className="py-3 px-6">
                                                <Badge color="info" variant="light">
                                                    {payment.paymentMethod}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-6">
                                                <Badge
                                                    color={payment.status === 'completed' ? 'success' :
                                                        payment.status === 'pending' ? 'warning' : 'error'}
                                                    variant="light"
                                                >
                                                    {payment.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-6 text-gray-500 dark:text-gray-400 text-sm">
                                                {formatDate(payment.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <FiCreditCard className="text-gray-400 size-12 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No payment records found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Connection Sessions</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Total {data.usageStats.totalSessions} sessions, {formatDuration(data.usageStats.totalDuration)} total duration
                        </p>
                    </div>

                    {data.sessions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-800">
                                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Session ID</th>
                                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Device</th>
                                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Start Time</th>
                                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Duration</th>
                                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">Data Usage</th>
                                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-500 dark:text-gray-400">IP Address</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {data.sessions.map((session) => (
                                        <tr key={session._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                            <td className="py-3 px-6 font-mono text-sm text-gray-800 dark:text-white/90">
                                                {session.sessionId}
                                            </td>
                                            <td className="py-3 px-6">
                                                <div className="text-gray-800 dark:text-white/90">
                                                    {session.device?.name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {session.device?.nasIp || ''}
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 text-gray-500 dark:text-gray-400 text-sm">
                                                {formatDate(session.startTime)}
                                            </td>
                                            <td className="py-3 px-6">
                                                <div className="text-gray-800 dark:text-white/90">
                                                    {formatDuration(session.duration || 0)}
                                                </div>
                                            </td>
                                            <td className="py-3 px-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <FiDownload className="text-blue-500 size-3" />
                                                        <span className="text-gray-800 dark:text-white/90">
                                                            {formatBytes(session.data?.download || 0)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <FiUpload className="text-green-500 size-3" />
                                                        <span className="text-gray-800 dark:text-white/90">
                                                            {formatBytes(session.data?.upload || 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 font-mono text-sm text-gray-800 dark:text-white/90">
                                                {session.ipAddress || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <FiActivity className="text-gray-400 size-12 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No session records found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Usage Tab */}
            {activeTab === 'usage' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Usage Summary */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">Data Usage Breakdown</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-blue-700 dark:text-blue-300 font-medium">Download</span>
                                            <FiDownload className="text-blue-500 size-5" />
                                        </div>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                                            {formatBytes(data.usageStats.totalDownload)}
                                        </p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                            {(data.usageStats.totalDownload / (1024 * 1024 * 1024)).toFixed(2)} GB
                                        </p>
                                    </div>

                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-green-700 dark:text-green-300 font-medium">Upload</span>
                                            <FiUpload className="text-green-500 size-5" />
                                        </div>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                                            {formatBytes(data.usageStats.totalUpload)}
                                        </p>
                                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                            {(data.usageStats.totalUpload / (1024 * 1024 * 1024)).toFixed(2)} GB
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-purple-700 dark:text-purple-300 font-medium">Total Sessions</span>
                                            <FiActivity className="text-purple-500 size-5" />
                                        </div>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                                            {data.usageStats.totalSessions}
                                        </p>
                                        <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                                            Average: {formatDuration(data.usageStats.totalDuration / data.usageStats.totalSessions)}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-amber-700 dark:text-amber-300 font-medium">Total Duration</span>
                                            <FiClock className="text-amber-500 size-5" />
                                        </div>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                                            {formatDuration(data.usageStats.totalDuration)}
                                        </p>
                                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                            {(data.usageStats.totalDuration / 3600).toFixed(1)} hours
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Usage Chart */}
                            <div className="mt-8">
                                <Chart
                                    options={usageChartOptions}
                                    series={usageChartSeries}
                                    type="donut"
                                    height={300}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Current Usage */}
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Current Package Usage</h3>

                            {customer.currentPackage ? (
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                                            <span>Data Used</span>
                                            <span>
                                                {(customer.currentPackage.dataUsed / (1024 * 1024 * 1024)).toFixed(2)} GB
                                                {customer.currentPackage.package?.dataLimit !== 'unlimited' &&
                                                    ` / ${customer.currentPackage.package?.dataAmount || 0} GB`
                                                }
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-brand-500 h-2 rounded-full"
                                                style={{
                                                    width: customer.currentPackage.package?.dataLimit !== 'unlimited'
                                                        ? `${(customer.currentPackage.dataUsed / (customer.currentPackage.package?.dataAmount * 1024 * 1024 * 1024 || 1)) * 100}%`
                                                        : '0%'
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Download Speed</p>
                                            <p className="text-lg font-bold text-gray-800 dark:text-white/90">
                                                {customer.currentPackage.package?.speed?.download || 0} Mbps
                                            </p>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Upload Speed</p>
                                            <p className="text-lg font-bold text-gray-800 dark:text-white/90">
                                                {customer.currentPackage.package?.speed?.upload || 0} Mbps
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Package Features</p>
                                        <div className="flex flex-wrap gap-2">
                                            {customer.currentPackage.package?.features?.map((feature: string, index: number) => (
                                                <Badge key={index} color="gray" variant="light">
                                                    {feature}
                                                </Badge>
                                            )) || (
                                                    <span className="text-gray-500 dark:text-gray-400 text-sm">No features listed</span>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-gray-500 dark:text-gray-400">No active package</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Sessions */}
                        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Recent Sessions</h3>
                            <div className="space-y-3">
                                {data.sessions.slice(0, 3).map((session) => (
                                    <div key={session._id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm text-gray-800 dark:text-white/90">
                                                {formatDate(session.startTime).split(',')[0]}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDuration(session.duration || 0)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <FiDownload className="size-3" />
                                                <span>{formatBytes(session.data?.download || 0)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FiUpload className="size-3" />
                                                <span>{formatBytes(session.data?.upload || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {data.sessions.length === 0 && (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center">No recent sessions</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}