import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { handleApiError } from "../utils/apiUtils";
import {
  TrendingUp,
  Users,
  BookOpen,
  ShoppingCart,
  Download,
  Building2,
  DollarSign,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import toast from "react-hot-toast";

export default function SuperAdminAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState("30d"); // 7d, 30d, 90d, 1y

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        navigate("/admin");
        return;
      }

      // For now, we'll use the dashboard stats as analytics
      // In a real implementation, you'd have separate analytics endpoints
      const response = await axios.get("http://localhost:3000/api/superadmin/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      handleApiError(error, "analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const recentTenants = analytics?.recentTenants || [];

  // Mock trend data - in real implementation, this would come from backend
  const trends = {
    users: { current: overview.platform?.users || 0, previous: (overview.platform?.users || 0) * 0.9, change: 12.5 },
    books: { current: overview.platform?.books || 0, previous: (overview.platform?.books || 0) * 0.95, change: 5.2 },
    purchases: { current: overview.platform?.purchases || 0, previous: (overview.platform?.purchases || 0) * 0.88, change: 15.8 },
    downloads: { current: overview.platform?.downloads || 0, previous: (overview.platform?.downloads || 0) * 0.92, change: 8.7 }
  };

  const getChangeColor = (change) => {
    return change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getChangeIcon = (change) => {
    return change >= 0 ? '↗' : '↘';
  };

  return (
    <div className="p-4 sm:p-6 w-full ">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Platform Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive analytics across all tenants
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${overview.revenue?.monthly?.toFixed(2) || "0.00"}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-600 dark:text-green-500" />
          </div>
          <div className="flex items-center text-sm">
            <span className={`font-medium ${getChangeColor(8.5)}`}>
              {getChangeIcon(8.5)} +8.5%
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">vs last month</span>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {overview.platform?.users || 0}
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-600 dark:text-blue-500" />
          </div>
          <div className="flex items-center text-sm">
            <span className={`font-medium ${getChangeColor(trends.users.change)}`}>
              {getChangeIcon(trends.users.change)} +{trends.users.change}%
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
          </div>
        </div>

        {/* Total Books */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Books</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {overview.platform?.books || 0}
              </p>
            </div>
            <BookOpen className="w-12 h-12 text-purple-600 dark:text-purple-500" />
          </div>
          <div className="flex items-center text-sm">
            <span className={`font-medium ${getChangeColor(trends.books.change)}`}>
              {getChangeIcon(trends.books.change)} +{trends.books.change}%
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
          </div>
        </div>

        {/* Total Purchases */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Purchases</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {overview.platform?.purchases || 0}
              </p>
            </div>
            <ShoppingCart className="w-12 h-12 text-orange-600 dark:text-orange-500" />
          </div>
          <div className="flex items-center text-sm">
            <span className={`font-medium ${getChangeColor(trends.purchases.change)}`}>
              {getChangeIcon(trends.purchases.change)} +{trends.purchases.change}%
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Tenant Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tenant Status Distribution
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Active Tenants</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {overview.tenants?.active || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Expired Tenants</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {overview.tenants?.expired || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Suspended Tenants</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {overview.tenants?.suspended || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Inactive Tenants</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {overview.tenants?.inactive || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Subscription Overview
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Active Subscriptions</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {overview.subscriptions?.active || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Expired Subscriptions</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {overview.subscriptions?.expired || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Total Subscriptions</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {overview.subscriptions?.total || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Tenant Activity
          </h2>
          <button
            onClick={() => navigate("/superadmin/tenants")}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            View All Tenants
          </button>
        </div>
        {recentTenants.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No recent tenant activity
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Tenant
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Users
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Books
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
                    <td className="py-3 px-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {tenant.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {tenant.contactEmail}
                        </p>
                      </div>
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
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {tenant.stats?.users || 0}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {tenant.stats?.books || 0}
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
    </div>
  );
}
