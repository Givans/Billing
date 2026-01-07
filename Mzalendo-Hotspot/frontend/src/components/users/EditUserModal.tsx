// components/users/EditUserModal.tsx
import { useState, useEffect } from "react";
import { FiSave, FiUser, FiMail, FiPhone, FiFileText, FiShield } from "react-icons/fi";
import { Modal } from "../ui/modal"

const API_URL = "http://localhost:5000/api";

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserUpdated: () => void;
    user: any;
}

export default function EditUserModal({
    isOpen,
    onClose,
    onUserUpdated,
    user
}: EditUserModalProps) {
    const [formData, setFormData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [roles, setRoles] = useState<any[]>([]);

    // Initialize form data when user changes
    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || "",
                email: user.email || "",
                fullName: user.fullName || "",
                phoneNumber: user.phoneNumber || "",
                role: user.role?._id || user.role || "viewer",
                notes: user.notes || "",
                isActive: user.isActive ?? true
            });
        }
    }, [user]);

    // Fetch available roles
    useEffect(() => {
        if (isOpen) {
            fetchRoles();
        }
    }, [isOpen]);

    const fetchRoles = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/roles`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await res.json();
            if (result.success) {
                setRoles(result.data);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

    const validateForm = () => {
        if (!formData) return false;

        // Required fields
        if (!formData.username.trim()) {
            setError("Username is required");
            return false;
        }
        if (!formData.email.trim()) {
            setError("Email is required");
            return false;
        }
        if (!formData.fullName.trim()) {
            setError("Full name is required");
            return false;
        }

        // Email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(formData.email)) {
            setError("Please enter a valid email address");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData || !validateForm()) {
            return;
        }

        try {
            setLoading(true);

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/${user._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    fullName: formData.fullName,
                    phoneNumber: formData.phoneNumber || undefined,
                    role: formData.role,
                    notes: formData.notes || undefined,
                    isActive: formData.isActive
                })
            });

            const result = await res.json();

            if (res.ok) {
                onUserUpdated();
            } else {
                setError(result.error || "Failed to update user");
            }
        } catch (error) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        if (!formData) return;

        setFormData((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    if (!formData) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-2xl"
        >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Edit User: {user?.fullName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Update user information and permissions
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Username *
                            </label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="e.g., john.doe"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email *
                            </label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="e.g., john@example.com"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                    required
                                />
                            </div>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Full Name *
                            </label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="e.g., John Doe"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="e.g., +254712345678"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                />
                            </div>
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Role *
                            </label>
                            <div className="relative">
                                <FiShield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                    required
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="operator">Operator</option>
                                    <option value="admin">Admin</option>
                                    {roles.map(role => (
                                        <option key={role._id} value={role._id}>
                                            {role.name} - {role.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Current role: {user?.role?.name || user?.role}
                            </p>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="size-4 text-brand-500 rounded border-gray-300 focus:ring-brand-500"
                            />
                            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                                Active Account
                            </label>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                                User can log in
                            </span>
                        </div>
                    </div>
                </div>

                {/* Notes - Full Width */}
                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notes
                    </label>
                    <div className="relative">
                        <FiFileText className="absolute left-3 top-3 text-gray-400 size-5" />
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Additional information about this user..."
                            rows={3}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        />
                    </div>
                </div>

                {/* User Information */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Created:</span>
                            <span className="ml-2 text-gray-700 dark:text-gray-300">
                                {new Date(user?.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Last Login:</span>
                            <span className="ml-2 text-gray-700 dark:text-gray-300">
                                {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                            </span>
                        </div>
                        {user?.createdBy && (
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Created By:</span>
                                <span className="ml-2 text-gray-700 dark:text-gray-300">
                                    {user.createdBy?.username || user.createdBy}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <FiSave className="size-4" />
                                Update User
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}