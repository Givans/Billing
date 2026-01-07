// pages/users/index.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UsersTable from "../../components/users/UsersTable";
import UsersStats from "../../components/users/UsersStats";
import AddUserModal from "../../components/users/AddUserModal";
import EditUserModal from "../../components/users/EditUserModal";
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiTrendingUp,
  FiPlus,
  FiRefreshCw,
} from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

interface UsersPageData {
  users: any[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    roles: {
      super_admin: number;
      admin: number;
      operator: number;
      viewer: number;
      custom: number;
    };
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function Users() {
  const navigate = useNavigate();
  const [data, setData] = useState<UsersPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    status: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 20
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.append(key, value.toString());
        }
      });
      
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await res.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleUserAdded = () => {
    setShowAddModal(false);
    handleRefresh();
  };

  const handleUserUpdated = () => {
    setEditingUser(null);
    handleRefresh();
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isActive ? 'reactivate' : 'deactivate';
      
      const res = await fetch(`${API_URL}/users/${userId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await res.json();
      
      if (result.success) {
        handleRefresh();
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await res.json();
      
      if (result.success) {
        handleRefresh();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleResetPassword = async (userId: string, newPassword: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });
      
      const result = await res.json();
      
      if (result.success) {
        alert('Password reset successfully');
      }
    } catch (error) {
      console.error("Error resetting password:", error);
    }
  };

  const quickStats = [
    {
      icon: FiUsers,
      label: "Total Users",
      value: data?.stats.total || 0,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      trend: "All system users"
    },
    {
      icon: FiUserCheck,
      label: "Active",
      value: data?.stats.active || 0,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      trend: `${data?.stats.active || 0}/${data?.stats.total || 0} active`
    },
    {
      icon: FiUserX,
      label: "Inactive",
      value: data?.stats.inactive || 0,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      trend: data?.stats.inactive ? "Requires attention" : "All active"
    },
    {
      icon: FiShield,
      label: "Admins",
      value: (data?.stats.roles.admin || 0) + (data?.stats.roles.super_admin || 0),
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      trend: "Administrative users"
    },
    {
      icon: FiTrendingUp,
      label: "Operators",
      value: data?.stats.roles.operator || 0,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      trend: "Customer service agents"
    }
  ];

  return (
    <>
      <PageMeta
        title="Users Management | Hotspot Billing"
        description="Manage system users, roles, and permissions"
      />
      <PageBreadcrumb pageTitle="Users Management" />
      
      {/* Header with Actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            System Users
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <FiRefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            <FiPlus className="size-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-5">
        {quickStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                  {(stat.value || 0).toLocaleString()}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stat.trend}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`size-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Users Stats */}
      {data && <UsersStats stats={data.stats} />}

      {/* Users Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <UsersTable
          users={data?.users || []}
          loading={loading}
          pagination={data?.pagination}
          filters={filters}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onEditUser={handleEditUser}
          onToggleStatus={handleToggleStatus}
          onDeleteUser={handleDeleteUser}
          onResetPassword={handleResetPassword}
          onViewDetails={(user) => navigate(`/users/${user._id}`)}
        />
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserAdded={handleUserAdded}
      />

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onUserUpdated={handleUserUpdated}
          user={editingUser}
        />
      )}
    </>
  );
}