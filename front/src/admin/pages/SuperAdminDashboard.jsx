import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  BookOpen,
  ShoppingCart,
  Download,
  TrendingUp,
  AlertCircle,
  Calendar,
  DollarSign,
  Shield,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [expiringSubscriptions, setExpiringSubscriptions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 2 minutes (120000 ms)
    intervalRef.current = setInterval(() => {
      fetchDashboardData(true); // Silent refresh
    }, 120000);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const token = localStorage.getItem("admin_token");
      if (!token) {
        navigate("/admin");
        return;
      }

      const [statsResponse, expiringResponse] = await Promise.all([
        axios.get("http://localhost:3000/api/superadmin/dashboard", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get("http://localhost:3000/api/superadmin/subscriptions/expiring?days=7", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (expiringResponse.data.success) {
        setExpiringSubscriptions(expiringResponse.data.data || []);
      }

      // Update last updated timestamp
      setLastUpdated(new Date());

      if (silent) {
        console.log("Dashboard data refreshed automatically");
        // Optional: Show a subtle notification for auto-refresh
        // toast.success("Dashboard updated", { duration: 2000 });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (error.response?.status === 403) {
        toast.error("Super admin access required");
        navigate("/admin/dashboard");
      } else if (!silent) {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const recentTenants = stats?.recentTenants || [];

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Platform overview and tenant management
            {lastUpdated && (
              <span className="block text-xs text-gray-500 dark:text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchDashboardData()}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Tenants */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tenants</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {overview.tenants?.total || 0}
              </p>
            </div>
            <Building2 className="w-12 h-12 text-blue-600 dark:text-blue-500" />
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <span className="text-green-600 dark:text-green-400">
              Active: {overview.tenants?.active || 0}
            </span>
            <span className="text-red-600 dark:text-red-400">
              Expired: {overview.tenants?.expired || 0}
            </span>
          </div>
        </div>

        {/* Subscriptions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {overview.subscriptions?.active || 0}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600 dark:text-green-500" />
          </div>
          <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
            Total: {overview.subscriptions?.total || 0}
          </div>
        </div>

        {/* Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {overview.platform?.users || 0}
              </p>
            </div>
            <Users className="w-12 h-12 text-purple-600 dark:text-purple-500" />
          </div>
        </div>

        {/* Books */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Books</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {overview.platform?.books || 0}
              </p>
            </div>
            <BookOpen className="w-12 h-12 text-orange-600 dark:text-orange-500" />
          </div>
        </div>
      </div>

      {/* Revenue & Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600 dark:text-green-500" />
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${overview.revenue?.monthly?.toFixed(2) || "0.00"}
              </p>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-gray-500">
                  Total: ${overview.revenue?.total?.toFixed(2) || "0.00"}
                </span>
                {overview.revenue?.growth !== undefined && (
                  <span className={overview.revenue.growth >= 0 ? "text-green-600" : "text-red-600"}>
                    {overview.revenue.growth >= 0 ? "+" : ""}{overview.revenue.growth}%
                  </span>
                )}
              </div>
              {overview.revenue?.refundsThisMonth > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  -${overview.revenue.refundsThisMonth.toFixed(2)} refunds
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600 dark:text-purple-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview.revenue?.paidSubscriptions || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Book Purchases</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview.platform?.purchases || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <Download className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Downloads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview.platform?.downloads || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Subscriptions Alert */}
      {expiringSubscriptions.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200">
              Subscriptions Expiring Soon
            </h3>
          </div>
          <div className="space-y-2">
            {expiringSubscriptions.slice(0, 5).map((sub) => (
              <div
                key={sub._id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {sub.tenantId?.name || "Unknown Tenant"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {sub.tenantId?.contactEmail || ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    Expires: {new Date(sub.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tenants */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Tenants
          </h2>
          <button
            onClick={() => navigate("/superadmin/tenants")}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            View All
          </button>
        </div>
        {recentTenants.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No tenants yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTenants.map((tenant) => (
                  <tr
                    key={tenant._id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => navigate(`/superadmin/tenants/${tenant._id}`)}
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {tenant.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {tenant.contactEmail}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          tenant.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : tenant.status === "expired"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate("/superadmin/tenants")}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl p-6 text-left transition-colors"
        >
          <Building2 className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Manage Tenants</h3>
          <p className="text-sm text-blue-100">
            View, create, and manage all tenants
          </p>
        </button>

        <button
          onClick={() => navigate("/superadmin/subscriptions")}
          className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-xl p-6 text-left transition-colors"
        >
          <Calendar className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Manage Subscriptions</h3>
          <p className="text-sm text-green-100">
            Create and manage tenant subscriptions
          </p>
        </button>

        <button
          onClick={() => navigate("/superadmin/tenants/new")}
          className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-xl p-6 text-left transition-colors"
        >
          <Building2 className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Create Tenant</h3>
          <p className="text-sm text-purple-100">
            Add a new tenant to the platform
          </p>
        </button>

        <button
          onClick={() => navigate("/superadmin/admins/create")}
          className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 text-white rounded-xl p-6 text-left transition-colors"
        >
          <Shield className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Create Admin</h3>
          <p className="text-sm text-orange-100">
            Create SUPER_ADMIN or regular admin users
          </p>
        </button>
      </div>
    </div>
  );
}

