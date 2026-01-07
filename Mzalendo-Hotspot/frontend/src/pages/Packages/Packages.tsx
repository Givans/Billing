// pages/packages/index.tsx
import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PackagesTable from "../../components/packages/PackagesTable";
import PackagesFilters from "../../components/packages/PackagesFilters";
import PackageStats from "../../components/packages/PackageStats";
import PackageFormModal from "../../components/packages/PackageFormModal";
import { FiPackage, FiUsers, FiTrendingUp, FiTrendingDown } from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

interface PackagesPageData {
    packages: any[];
    stats?: {
        totalPackages: number;
        activePackages: number;
        topPackages: any[];
        leastUsedPackages: any[];
        revenueStats: any[];
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function Packages() {
    const [data, setData] = useState<PackagesPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingPackage, setEditingPackage] = useState<any>(null);
    const [filters, setFilters] = useState({
        search: "",
        type: "all",
        isActive: "all",
        minPrice: "",
        maxPrice: "",
        durationUnit: "all",
        device: "all",
        page: 1,
        limit: 20,
        sortBy: "price",
        sortOrder: "asc"
    });

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== "all") {
                    params.append(key, value.toString());
                }
            });

            // Fetch packages and stats in parallel
            const [packagesRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/packages?${params}`),
                fetch(`${API_URL}/packages/analytics/stats`)
            ]);

            const packagesData = await packagesRes.json();
            const statsData = await statsRes.json();

            if (packagesData.success) {
                setData({
                    packages: packagesData.packages,
                    stats: statsData.success ? statsData.stats : undefined,
                    pagination: packagesData.pagination
                });
            }
        } catch (error) {
            console.error("Error fetching packages:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, [filters]);

    const handleFilterChange = (newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const handleCreatePackage = () => {
        setEditingPackage(null);
        setShowFormModal(true);
    };

    const handleEditPackage = (pkg: any) => {
        setEditingPackage(pkg);
        setShowFormModal(true);
    };

    const handleDeletePackage = async (packageId: string) => {
        if (!window.confirm("Are you sure you want to delete this package?")) return;

        try {
            // Show loading
            const res = await fetch(`${API_URL}/packages/${packageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await res.json();

            if (result.success) {
                alert("Package deleted successfully!");
                fetchPackages(); // Refresh data
            } else {
                alert(result.error || "Failed to delete package");
            }
        } catch (error: any) {
            alert(error.message || "Failed to delete package");
        }
    };

    const handleFormSubmit = async (formData: any) => {
        try {
            const url = editingPackage
                ? `${API_URL}/packages/${editingPackage._id}`
                : `${API_URL}/packages`;

            const method = editingPackage ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Add auth if needed
                },
                body: JSON.stringify(formData)
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || result.message || 'Failed to save package');
            }

            if (result.success || result._id) {
                fetchPackages(); // Refresh data
            } else {
                throw new Error('Unknown error occurred');
            }

        } catch (error: any) {
            throw error; // Let the modal handle the error
        }
    };

    const quickStats = [
        {
            icon: FiPackage,
            label: "Total Packages",
            value: data?.stats?.totalPackages || 0,
            color: "text-blue-600",
            bgColor: "bg-blue-100 dark:bg-blue-900/30"
        },
        {
            icon: FiUsers,
            label: "Active Packages",
            value: data?.stats?.activePackages || 0,
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900/30"
        },
        {
            icon: FiTrendingUp,
            label: "Most Used",
            value: data?.stats?.topPackages?.[0]?.count || 0,
            color: "text-emerald-600",
            bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
            subText: data?.stats?.topPackages?.[0]?.package?.name || 'None'
        },
        {
            icon: FiTrendingDown,
            label: "Least Used",
            value: data?.stats?.leastUsedPackages?.[0]?.count || 0,
            color: "text-amber-600",
            bgColor: "bg-amber-100 dark:bg-amber-900/30",
            subText: data?.stats?.leastUsedPackages?.[0]?.package?.name || 'None'
        }
    ];

    return (
        <>
            <PageMeta
                title="Internet Packages Management | Hotspot Billing"
                description="Manage internet packages with CRUD operations, filtering, and analytics"
            />
            <PageBreadcrumb pageTitle="Internet Packages" />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
                {quickStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                                <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                                    {stat.value.toLocaleString()}
                                </h3>
                                {stat.subText && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.subText}</p>
                                )}
                            </div>
                            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`size-6 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Analytics Section */}
            {data?.stats && <PackageStats stats={data.stats} />}

            {/* Filters and Create Button */}
            <div className="mb-6">
                <PackagesFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onRefresh={fetchPackages}
                    onCreatePackage={handleCreatePackage}
                />
            </div>

            {/* Packages Table */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <PackagesTable
                    packages={data?.packages || []}
                    loading={loading}
                    onEditPackage={handleEditPackage}
                    onDeletePackage={handleDeletePackage}
                    pagination={data?.pagination}
                    onPageChange={handlePageChange}
                />
            </div>

            {/* Package Form Modal */}
            {showFormModal && (
                <PackageFormModal
                    packageData={editingPackage}
                    onSubmit={handleFormSubmit}
                    onClose={() => setShowFormModal(false)}
                />
            )}
        </>
    );
}