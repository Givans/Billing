// components/accounts/PaymentsTable.tsx
// import { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiCreditCard,
  FiExternalLink,
  FiEye
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface PaymentsTableProps {
  payments: any[];
  loading: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export default function PaymentsTable({
  payments,
  loading,
  pagination,
  onPageChange
}: PaymentsTableProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'initiated': return 'info';
      case 'refunded': return 'gray';
      default: return 'gray';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'mpesa': return '📱';
      case 'card': return '💳';
      case 'cash': return '💰';
      case 'kopokopo': return '🔄';
      case 'voucher': return '🎫';
      default: return '📄';
    }
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

  if (payments.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <FiCreditCard className="size-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          No Payments Found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Try adjusting your filters or wait for new payments
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
                Transaction
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Customer
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Package & Device
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Amount
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Method
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Status
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Date
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {payments.map((payment) => (
              <TableRow key={payment._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <TableCell className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white/90">
                      {payment.transactionId || payment._id}
                    </div>
                    {payment.mpesaReceiptNumber && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        M-Pesa: {payment.mpesaReceiptNumber}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white/90">
                      {payment.customer?.macAddress || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {payment.phoneNumber || payment.customer?.phoneNumber || 'No phone'}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: payment.package?.colorCode || '#3498db' }}
                      />
                      <span className="text-sm text-gray-800 dark:text-white/90">
                        {payment.package?.name || 'Package'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {payment.device?.name || 'Device'}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div className="font-bold text-gray-800 dark:text-white/90">
                    {formatCurrency(payment.amount)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    KES {payment.amount?.toLocaleString()}
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getPaymentMethodIcon(payment.paymentMethod)}</span>
                    <Badge color="info" variant="light" size="sm">
                      {payment.paymentMethod}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <Badge 
                    color={getStatusColor(payment.status)}
                    variant="light"
                  >
                    {payment.status}
                  </Badge>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div className="text-gray-800 dark:text-white/90">
                    {formatDate(payment.createdAt)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(payment.createdAt).toLocaleDateString('en-US', { 
                      weekday: 'short' 
                    })}
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/clients/${payment.customer?._id}`)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      title="View Customer"
                    >
                      <FiEye className="size-4" />
                    </button>
                    <button
                      onClick={() => window.open(`/payments/${payment._id}`, '_blank')}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      title="View Details"
                    >
                      <FiExternalLink className="size-4" />
                    </button>
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} payments
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
                      className={`w-10 h-10 rounded-lg text-sm font-medium ${
                        pagination.page === pageNum
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