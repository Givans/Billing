// pages/users/UserDetails.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { 
  FiArrowLeft, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiShield, 
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiEdit2,
  FiKey,
  FiActivity,
  FiFileText,
  FiLock,
  FiUnlock,
  FiRefreshCw
} from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

interface UserDetailsData {
  user: {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    role: {
      _id: string;
      name: string;
      description: string;
    };
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
    notes?: string;
    createdBy?: {
      _id: string;
      username: string;
      fullName: string;
    };
    permissions?: any[];
  };
  activity: {
    lastLogin: string;
    totalLogins: number;
    recentActions: any[];
  };
}

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<UserDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await res.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/${id}/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await res.json();
      
      if (result.success && data) {
        setData(prev => ({
          ...prev!,
          activity: result.data
        }));
      }
    } catch (error) {
      console.error("Error fetching user activity:", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUserDetails();
      fetchUserActivity();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setNewPassword(password);
  };

  const handleResetPassword = async () => {
    if (!newPassword || !window.confirm('Are you sure you want to reset this user\'s password?')) {
      return;
    }

    try {
      setResettingPassword(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/${id}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });
      
      const result = await res.json();
      
      if (result.success) {
        alert('Password reset successfully. New password: ' + newPassword);
        setResettingPassword(false);
        setNewPassword("");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert('Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!data) return;
    
    const action = data.user.isActive ? 'deactivate' : 'reactivate';
    const confirmMessage = data.user.isActive 
      ? 'Are you sure you want to deactivate this user? They will not be able to log in.'
      : 'Are you sure you want to reactivate this user?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/${id}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await res.json();
      
      if (result.success) {
        fetchUserDetails();
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <FiUser className="size-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          User Not Found
        </h3>
        <button
          onClick={() => navigate('/staff')}
          className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
        >
          Back to Staff
        </button>
      </div>
    );
  }

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'super_admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'admin': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'operator': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'viewer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const permissionCategories = data.user.permissions?.reduce((acc: any, perm: any) => {
    const category = perm.module.split('_')[0];
    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {});

  return (
    <>
      <PageMeta
        title={`${data.user.fullName} | User Details`}
        description={`Detailed view of ${data.user.fullName}'s account and permissions`}
      />
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/users')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <FiArrowLeft className="size-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <PageBreadcrumb pageTitle={data.user.fullName} />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
              <FiUser className="size-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                {data.user.fullName}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(data.user.role.name)}`}>
                  {data.user.role.name.toUpperCase()}
                </span>
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  data.user.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {data.user.isActive ? (
                    <>
                      <FiCheckCircle className="size-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <FiXCircle className="size-3" />
                      Inactive
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/users/${id}/edit`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              <FiEdit2 className="size-4" />
              Edit User
            </button>
            
            <button
              onClick={handleToggleStatus}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                data.user.isActive
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {data.user.isActive ? (
                <>
                  <FiLock className="size-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <FiUnlock className="size-4" />
                  Activate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Information Card */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
              User Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <FiUser className="size-4" />
                    Username
                  </div>
                  <div className="font-medium text-gray-800 dark:text-white/90">
                    {data.user.username}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <FiMail className="size-4" />
                    Email
                  </div>
                  <div className="font-medium text-gray-800 dark:text-white/90">
                    {data.user.email}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <FiPhone className="size-4" />
                    Phone Number
                  </div>
                  <div className="font-medium text-gray-800 dark:text-white/90">
                    {data.user.phoneNumber || 'Not provided'}
                  </div>
                </div>
              </div>

              {/* Role & Status Info */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <FiShield className="size-4" />
                    Role
                  </div>
                  <div className="font-medium text-gray-800 dark:text-white/90">
                    {data.user.role.name}
                    {data.user.role.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {data.user.role.description}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <FiCalendar className="size-4" />
                    Account Created
                  </div>
                  <div className="font-medium text-gray-800 dark:text-white/90">
                    {formatDate(data.user.createdAt)}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <FiActivity className="size-4" />
                    Last Login
                  </div>
                  <div className="font-medium text-gray-800 dark:text-white/90">
                    {data.user.lastLogin ? formatDate(data.user.lastLogin) : 'Never'}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {data.user.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <FiFileText className="size-4" />
                  Notes
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {data.user.notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Permissions Card */}
          {data.user.permissions && data.user.permissions.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
                Permissions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissionCategories && Object.entries(permissionCategories).map(([category, perms]: [string, any]) => (
                  <div key={category} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-gray-800 dark:text-white/90 mb-3 capitalize">
                      {category.replace('_', ' ')}
                    </h4>
                    <div className="space-y-2">
                      {perms.map((perm: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <FiCheckCircle className="size-3 text-green-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {perm.action} {perm.module.replace(`${category}_`, '').replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Total permissions: {data.user.permissions.length}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions & Activity */}
        <div className="space-y-6">
          {/* User Actions Card */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
              User Actions
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/users/${id}/edit`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <FiEdit2 className="size-4" />
                Edit Profile
              </button>
              
              <button
                onClick={() => setResettingPassword(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                <FiKey className="size-4" />
                Reset Password
              </button>
              
              <button
                onClick={handleToggleStatus}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${
                  data.user.isActive
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {data.user.isActive ? (
                  <>
                    <FiLock className="size-4" />
                    Deactivate Account
                  </>
                ) : (
                  <>
                    <FiUnlock className="size-4" />
                    Activate Account
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Activity Stats Card */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
              Activity Statistics
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Logins</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
                  {data.activity?.totalLogins || 0}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Last Activity</div>
                <div className="font-medium text-gray-800 dark:text-white/90">
                  {data.activity?.lastLogin ? formatDate(data.activity.lastLogin) : 'Never'}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Account Age</div>
                <div className="font-medium text-gray-800 dark:text-white/90">
                  {Math.floor((new Date().getTime() - new Date(data.user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
            </div>
          </div>

          {/* Created By Card */}
          {data.user.createdBy && (
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                Created By
              </h3>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <FiUser className="text-gray-600 dark:text-gray-400 size-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-white/90">
                    {data.user.createdBy.fullName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    @{data.user.createdBy.username}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Password Modal */}
      {resettingPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Reset Password for {data.user.fullName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generate a new password for this user
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newPassword}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 font-mono"
                  />
                  <button
                    onClick={generateRandomPassword}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
                    type="button"
                  >
                    <FiRefreshCw className="size-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Copy this password and share it with the user securely
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setResettingPassword(false);
                    setNewPassword("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={!newPassword || resettingPassword}
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resettingPassword ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}