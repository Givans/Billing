// components/packages/PackagesTable.tsx
import { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import {
  FiEdit,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiMoreVertical,
  FiPackage,
  FiUsers,
  FiWifi,
  FiClock,
  FiDatabase
} from "react-icons/fi";

interface PackagesTableProps {
  packages: any[];
  loading: boolean;
  onEditPackage: (pkg: any) => void;
  onDeletePackage: (packageId: string) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export default function PackagesTable({
  packages,
  loading,
  onEditPackage,
  onDeletePackage,
  pagination,
  onPageChange
}: PackagesTableProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatSpeed = (speed: any) => {
    return `${speed?.download || 0}/${speed?.upload || 0} Mbps`;
  };

  const getFormattedDuration = (duration: any) => {
    if (!duration) return 'N/A';
    return `${duration.value} ${duration.unit}`;
  };

  const handleQuickActionClick = (packageId: string, action: string) => {
    setSelectedAction(null);
    if (action === 'edit') {
      const pkg = packages.find(p => p._id === packageId);
      if (pkg) onEditPackage(pkg);
    } else if (action === 'delete') {
      onDeletePackage(packageId);
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

  if (packages.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <FiPackage className="size-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          No Packages Found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Try adjusting your filters or create new packages
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
                Package
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Type & Duration
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Speed & Data
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Price
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Customers
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Status
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {packages.map((pkg) => (
              <TableRow key={pkg._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: pkg.colorCode || '#3498db' }}
                    >
                      <FiPackage className="text-white size-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white/90">
                        {pkg.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        {pkg.description || 'No description'}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge color="info" variant="light">
                        {pkg.type || 'hotspot'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <FiClock className="size-3" />
                      <span>{getFormattedDuration(pkg.duration)}</span>
                    </div>
                    {pkg.formattedDuration && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {pkg.formattedDuration}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FiWifi className="text-gray-500 size-3" />
                      <span className="text-sm text-gray-800 dark:text-white/90">
                        {formatSpeed(pkg.speed)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiDatabase className="text-gray-500 size-3" />
                      <span className="text-sm text-gray-800 dark:text-white/90">
                        {pkg.dataLimit === 'unlimited' ? 'Unlimited' : `${pkg.dataAmount} GB`}
                      </span>
                    </div>
                    {pkg.burstAllowed && (
                      <Badge color="warning" variant="light" size="sm">
                        Burst: {pkg.maxBurstSpeed} Mbps
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div className="font-bold text-gray-800 dark:text-white/90">
                    {formatCurrency(pkg.price)}
                  </div>
                  {pkg.burstPrice && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Burst: {formatCurrency(pkg.burstPrice)}
                    </div>
                  )}
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FiUsers className="text-gray-500 size-4" />
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white/90">
                        {pkg.customerCount || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        customers
                      </div>
                    </div>
                  </div>
                  {pkg.customerCount > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      KES {(pkg.price || 0) * (pkg.customerCount || 0)}
                    </div>
                  )}
                </TableCell>

                <TableCell className="px-6 py-4">
                  <Badge 
                    color={pkg.isActive ? "success" : "error"}
                    variant="light"
                  >
                    {pkg.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div className="relative">
                    <button
                      onClick={() => setSelectedAction(
                        selectedAction === pkg._id ? null : pkg._id
                      )}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <FiMoreVertical className="text-gray-500 size-5" />
                    </button>

                    {selectedAction === pkg._id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                        <div className="py-1">
                          <button
                            onClick={() => handleQuickActionClick(pkg._id, 'edit')}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <FiEdit className="text-blue-500 size-4" />
                            Edit Package
                          </button>
                          <button
                            onClick={() => handleQuickActionClick(pkg._id, 'delete')}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <FiTrash2 className="size-4" />
                            {pkg.isActive ? "Deactivate" : "Delete"}
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} packages
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