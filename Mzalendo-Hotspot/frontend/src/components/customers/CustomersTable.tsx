// components/customers/CustomersTable.tsx
import { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import {
    FiWifi,
    FiWifiOff,
    FiTrash2,
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiChevronLeft,
    FiChevronRight,
    FiChevronsLeft,
    FiChevronsRight,
    FiMoreVertical,
    FiUsers
} from "react-icons/fi";
import { useNavigate } from "react-router";

interface CustomersTableProps {
    customers: any[];
    loading: boolean;
    onCustomerClick: (customerId: string) => void;
    onQuickAction: (customerId: string, action: string) => void;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    onPageChange: (page: number) => void;
}

export default function CustomersTable({
    customers,
    loading,
    onCustomerClick,
    onQuickAction,
    pagination,
    onPageChange
}: CustomersTableProps) {
    const navigate = useNavigate();

    let a = {}
    a = onCustomerClick

    const [selectedAction, setSelectedAction] = useState<string | null>(null);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string, isOnline: boolean) => {
        if (isOnline) return "success";
        if (status === "active") return "primary";
        if (status === "expired") return "warning";
        if (status === "disabled") return "error";
        return "gray";
    };

    const getStatusText = (customer: any) => {
        if (customer.session?.isOnline) return "Online";
        if (customer.status === "active") return "Active";
        if (customer.status === "expired") return "Expired";
        if (customer.status === "disabled") return "Disabled";
        return "Unknown";
    };

    const handleQuickActionClick = (customerId: string, action: string) => {
        setSelectedAction(null);
        onQuickAction(customerId, action);
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

    if (customers.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <FiUsers className="size-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                    No Customers Found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    Try adjusting your filters or add new customers
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="border-b border-gray-200 dark:border-gray-800">
                        <TableRow>
                            <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                                Customer
                            </TableCell>
                            <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                                Device
                            </TableCell>
                            <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                                Package
                            </TableCell>
                            <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                                Status
                            </TableCell>
                            <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                                Last Seen
                            </TableCell>
                            <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                                Expiry
                            </TableCell>
                            <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {customers.map((customer) => (
                            <TableRow
                                key={customer._id}
                                className="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer"
                                onClick={() => navigate(`/clients/${customer._id}`)}
                            >
                                <TableCell className="px-6 py-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${customer.session?.isOnline
                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                : 'bg-gray-100 dark:bg-gray-800'
                                                }`}>
                                                {customer.session?.isOnline ? (
                                                    <FiWifi className="text-green-600 dark:text-green-400 size-5" />
                                                ) : (
                                                    <FiWifiOff className="text-gray-500 dark:text-gray-400 size-5" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-800 dark:text-white/90">
                                                    {customer.macAddress}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {customer.phoneNumber || 'No phone'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell className="px-6 py-4">
                                    <div className="text-gray-800 dark:text-white/90">
                                        {customer.device?.name || 'N/A'}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {customer.device?.nasIp || ''}
                                    </div>
                                </TableCell>

                                <TableCell className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: customer.currentPackage?.package?.colorCode || '#3498db' }}
                                        />
                                        <div>
                                            <div className="font-medium text-gray-800 dark:text-white/90">
                                                {customer.currentPackage?.package?.name || 'No Package'}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                KES {customer.currentPackage?.package?.price || '0'}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell className="px-6 py-4">
                                    <Badge
                                        color={getStatusColor(customer.status, customer.session?.isOnline)}
                                        variant="light"
                                        startIcon={customer.session?.isOnline ? <FiWifi className="size-3" /> : undefined}
                                    >
                                        {getStatusText(customer)}
                                    </Badge>
                                </TableCell>

                                <TableCell className="px-6 py-4">
                                    <div className="text-gray-800 dark:text-white/90">
                                        {customer.lastSeen ? formatDateTime(customer.lastSeen) : 'Never'}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {customer.totalConnections || 0} connections
                                    </div>
                                </TableCell>

                                <TableCell className="px-6 py-4">
                                    <div className={`font-medium ${new Date(customer.currentPackage?.expiryDate) < new Date()
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-800 dark:text-white/90'
                                        }`}>
                                        {customer.currentPackage?.expiryDate
                                            ? formatDate(customer.currentPackage.expiryDate)
                                            : 'No expiry'
                                        }
                                    </div>
                                </TableCell>

                                <TableCell className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="relative">
                                        <button
                                            onClick={() => setSelectedAction(
                                                selectedAction === customer._id ? null : customer._id
                                            )}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                        >
                                            <FiMoreVertical className="text-gray-500 size-5" />
                                        </button>

                                        {selectedAction === customer._id && (
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => handleQuickActionClick(customer._id, 'extend')}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        <FiClock className="text-blue-500 size-4" />
                                                        Extend 30 Days
                                                    </button>
                                                    <button
                                                        onClick={() => handleQuickActionClick(customer._id, 'expire')}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        <FiClock className="text-amber-500 size-4" />
                                                        Set Expired
                                                    </button>
                                                    {customer.status === 'disabled' ? (
                                                        <button
                                                            onClick={() => handleQuickActionClick(customer._id, 'enable')}
                                                            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        >
                                                            <FiCheckCircle className="text-green-500 size-4" />
                                                            Enable
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleQuickActionClick(customer._id, 'disable')}
                                                            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        >
                                                            <FiXCircle className="text-red-500 size-4" />
                                                            Disable
                                                        </button>
                                                    )}
                                                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                                    <button
                                                        onClick={() => handleQuickActionClick(customer._id, 'delete')}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                    >
                                                        <FiTrash2 className="size-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onPageChange(1)}
                                disabled={pagination.page === 1}
                                className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <FiChevronsLeft className="size-4" />
                            </button>

                            <button
                                onClick={() => onPageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <FiChevronLeft className="size-4" />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.page <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.page >= pagination.totalPages - 2) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                        pageNum = pagination.page - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => onPageChange(pageNum)}
                                            className={`w-10 h-10 rounded-lg text-sm font-medium ${pagination.page === pageNum
                                                ? 'bg-brand-500 text-white'
                                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => onPageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <FiChevronRight className="size-4" />
                            </button>

                            <button
                                onClick={() => onPageChange(pagination.totalPages)}
                                disabled={pagination.page === pagination.totalPages}
                                className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <FiChevronsRight className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}