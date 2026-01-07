// components/users/UsersTable.tsx
import { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import {
  FiUser,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiEye,
  FiKey,
  FiToggleLeft,
  FiToggleRight,
  FiSearch,
  FiX
} from "react-icons/fi";

interface UsersTableProps {
  users: any[];
  loading: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: any;
  onFilterChange: (filters: any) => void;
  onPageChange: (page: number) => void;
  onEditUser: (user: any) => void;
  onToggleStatus: (userId: string, isActive: boolean) => void;
  onDeleteUser: (userId: string) => void;
  onResetPassword: (userId: string, newPassword: string) => void;
  onViewDetails: (user: any) => void;
}

export default function UsersTable({
  users,
  loading,
  pagination,
  filters,
  onFilterChange,
  onPageChange,
  onEditUser,
  onToggleStatus,
  onDeleteUser,
  onResetPassword,
  onViewDetails
}: UsersTableProps) {
  const [resetPasswordUser, setResetPasswordUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'error';
      case 'admin': return 'warning';
      case 'operator': return 'info';
      case 'viewer': return 'success';
      default: return 'gray';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleResetPasswordClick = (userId: string) => {
    setResetPasswordUser(userId);
    setNewPassword(generateRandomPassword());
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
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

  if (users.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <FiUser className="size-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          No Users Found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Try adjusting your filters or add the first user
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                placeholder="Search by name, username, or email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 placeholder-gray-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-brand-500"
              />
              {filters.search && (
                <button
                  onClick={() => onFilterChange({ search: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiX className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filters.role}
              onChange={(e) => onFilterChange({ role: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
              <option value="viewer">Viewer</option>
              <option value="custom">Custom</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="fullName">Sort by Name</option>
              <option value="role">Sort by Role</option>
            </select>

            <select
              value={filters.sortOrder}
              onChange={(e) => onFilterChange({ sortOrder: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-200 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                User
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Role & Permissions
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Status
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Created
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Last Login
              </TableCell>
              <TableCell isHeader className="px-6 py-4 font-medium text-gray-500 text-theme-sm">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((user) => (
              <TableRow key={user._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <FiUser className="text-gray-600 dark:text-gray-400 size-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white/90">
                        {user.fullName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.username}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div className="space-y-2">
                    <Badge 
                      color={getRoleColor(user.role?.name || user.role)}
                      variant="light"
                    >
                      {user.role?.name || user.role}
                    </Badge>
                    
                    {user.notes && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.notes.substring(0, 50)}...
                      </div>
                    )}
                    
                    {user.createdBy && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Created by: {user.createdBy?.username || 'System'}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Badge 
                      color={getStatusColor(user.isActive)}
                      variant="light"
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    
                    <button
                      onClick={() => onToggleStatus(user._id, !user.isActive)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {user.isActive ? (
                        <FiToggleRight className="size-5 text-green-500" />
                      ) : (
                        <FiToggleLeft className="size-5 text-red-500" />
                      )}
                    </button>
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div className="text-gray-800 dark:text-white/90">
                    {formatDate(user.createdAt)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  {user.lastLogin ? (
                    <>
                      <div className="text-gray-800 dark:text-white/90">
                        {formatDate(user.lastLogin)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(user.lastLogin).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Never</span>
                  )}
                </TableCell>

                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewDetails(user)}
                      className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                      title="View Details"
                    >
                      <FiEye className="size-4" />
                    </button>
                    
                    <button
                      onClick={() => onEditUser(user)}
                      className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400"
                      title="Edit User"
                    >
                      <FiEdit2 className="size-4" />
                    </button>
                    
                    <button
                      onClick={() => handleResetPasswordClick(user._id)}
                      className="p-2 text-gray-500 hover:text-amber-600 dark:hover:text-amber-400"
                      title="Reset Password"
                    >
                      <FiKey className="size-4" />
                    </button>
                    
                    <button
                      onClick={() => onDeleteUser(user._id)}
                      className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                      title="Delete User"
                      disabled={user.role?.name === 'super_admin'}
                    >
                      <FiTrash2 className="size-4" />
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
              >
                <FiRefreshCw className="size-4" />
              </button>
              
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
              >
                Previous
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
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Reset Password
              </h3>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 font-mono"
                  />
                  <button
                    onClick={() => setNewPassword(generateRandomPassword())}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
                  >
                    <FiRefreshCw className="size-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Copy this password and share it with the user securely
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setResetPasswordUser(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onResetPassword(resetPasswordUser, newPassword);
                    setResetPasswordUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}