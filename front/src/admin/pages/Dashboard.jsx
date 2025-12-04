import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BookOpen,
  Users,
  Download,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Calendar,
  Activity,
  BarChart3,
  FileText,
  CreditCard,
  Eye,
  RotateCcw,
  PieChart,
  BarChart,
  Activity as ActivityIcon
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 4, // As mentioned by user
    totalDownloads: 0,
    totalRevenue: 0,
    totalPurchases: 0,
    freeDownloads: 0,
    paidDownloads: 0,
    recentPurchases: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Chart data
  const [chartData, setChartData] = useState({
    revenueBreakdown: [],
    userStats: [],
    revenueTrend: [],
    downloadsTrend: []
  });

  // Navigation functions
  const handleAddNewBook = () => {
    navigate('/admin/books');
  };

  const handleManageUsers = () => {
    navigate('/admin/users');
  };

  const handleViewDownloads = () => {
    navigate('/admin/downloads');
  };

  // Fetch dashboard data
  const fetchDashboardData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
        console.log("📊 Manual refresh: Fetching dashboard data...");
      } else {
        console.log("📊 Fetching dashboard data...");
      }

      // Fetch data from multiple endpoints
      const [booksRes, downloadsRes, purchasesRes] = await Promise.all([
        axios.get("http://localhost:3000/api/books"),
        axios.get("http://localhost:3000/api/downloads"),
        axios.get("http://localhost:3000/api/purchased")
      ]);

      const books = booksRes.data.data || [];
      const downloads = downloadsRes.data.data || [];
      const purchases = purchasesRes.data.data || [];

      // Calculate statistics
      const totalBooks = books.length;
      const totalDownloads = downloads.length;
      const totalPurchases = purchases.length;
      const totalRevenue = purchases.reduce((sum, purchase) => sum + (purchase.price || 0), 0);
      const freeDownloads = downloads.filter(d => d.price === 0).length;
      const paidDownloads = downloads.filter(d => d.price > 0).length;

      // Get recent purchases (last 5)
      const recentPurchases = purchases
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

      setStats({
        totalBooks,
        totalUsers: 4, // As specified by user
        totalDownloads,
        totalRevenue,
        totalPurchases,
        freeDownloads,
        paidDownloads,
        recentPurchases
      });

      // Prepare chart data
      const revenueBreakdownData = [
        { name: 'Free Downloads', value: freeDownloads, color: '#10B981' },
        { name: 'Paid Downloads', value: paidDownloads, color: '#3B82F6' }
      ];

      const userStatsData = [
        { name: 'Active Users', value: 3, color: '#10B981' },
        { name: 'Inactive Users', value: 1, color: '#EF4444' },
        { name: 'Premium Users', value: 2, color: '#8B5CF6' }
      ];

      // Mock revenue trend data (last 7 days)
      const revenueTrendData = [
        { day: 'Mon', revenue: 25.50 },
        { day: 'Tue', revenue: 45.75 },
        { day: 'Wed', revenue: 32.25 },
        { day: 'Thu', revenue: 67.80 },
        { day: 'Fri', revenue: 89.30 },
        { day: 'Sat', revenue: 54.90 },
        { day: 'Sun', revenue: totalRevenue }
      ];

      // Mock downloads trend data
      const downloadsTrendData = [
        { day: 'Mon', downloads: 5 },
        { day: 'Tue', downloads: 8 },
        { day: 'Wed', downloads: 6 },
        { day: 'Thu', downloads: 12 },
        { day: 'Fri', downloads: 15 },
        { day: 'Sat', downloads: 9 },
        { day: 'Sun', downloads: totalDownloads }
      ];

      setChartData({
        revenueBreakdown: revenueBreakdownData,
        userStats: userStatsData,
        revenueTrend: revenueTrendData,
        downloadsTrend: downloadsTrendData
      });

      setLastUpdated(new Date().toLocaleString());

      console.log("✅ Dashboard data loaded successfully");

      if (showRefreshIndicator) {
        toast.success("Dashboard data refreshed!");
      }
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500 text-center sm:text-left">
                Last updated: {lastUpdated}
              </span>
            )}
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg transition-colors w-full sm:w-auto"
              title="Refresh dashboard data"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">Welcome back! Here's what's happening with your bookstore.</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Total Books */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Books</p>
            <p className="text-3xl font-bold">{stats.totalBooks}</p>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <Activity className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-green-100 text-sm font-medium">Total Users</p>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
            <CreditCard className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Total Downloads */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Download className="w-8 h-8 opacity-80" />
            <FileText className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-orange-100 text-sm font-medium">Total Downloads</p>
            <p className="text-3xl font-bold">{stats.totalDownloads}</p>
          </div>
        </div>
      </div>

      {/* Beautiful Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Breakdown Custom Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Revenue Breakdown</h3>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              {/* Custom Pie Chart */}
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Free Downloads Slice */}
                  <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth="15"
                    strokeDasharray={`${(chartData.revenueBreakdown[0]?.value / stats.totalDownloads) * 94.2} 94.2`}
                    strokeDashoffset="0"
                    className="drop-shadow-sm"
                  />
                  {/* Paid Downloads Slice */}
                  <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill="transparent"
                    stroke="#3B82F6"
                    strokeWidth="15"
                    strokeDasharray={`${(chartData.revenueBreakdown[1]?.value / stats.totalDownloads) * 94.2} 94.2`}
                    strokeDashoffset={`-${(chartData.revenueBreakdown[0]?.value / stats.totalDownloads) * 94.2}`}
                    className="drop-shadow-sm"
                  />
                </svg>
                {/* Center Circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-full w-16 h-16 shadow-inner flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.totalDownloads}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Free ({chartData.revenueBreakdown[0]?.value || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Paid ({chartData.revenueBreakdown[1]?.value || 0})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Statistics Custom Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <BarChart className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">User Statistics</h3>
          </div>
          <div className="h-64">
            <div className="space-y-4">
              {chartData.userStats.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-gray-600 truncate">{item.name}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full transition-all duration-500 ease-out rounded-full"
                          style={{
                            width: `${(item.value / Math.max(...chartData.userStats.map(d => d.value))) * 100}%`,
                            backgroundColor: item.color
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-8 text-right">{item.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="text-center text-sm text-gray-500">
                Total Users: {stats.totalUsers}
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Trend Custom Area Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <ActivityIcon className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend (7 Days)</h3>
          </div>
          <div className="h-64">
            <div className="flex items-end justify-between h-48 px-2">
              {chartData.revenueTrend.map((day, index) => {
                const maxValue = Math.max(...chartData.revenueTrend.map(d => d.revenue));
                const height = (day.revenue / maxValue) * 100;

                return (
                  <div key={index} className="flex flex-col items-center flex-1 mx-1">
                    <div className="relative w-full mb-2">
                      {/* Area fill effect */}
                      <div
                        className="bg-blue-100 rounded-t transition-all duration-500 ease-out"
                        style={{ height: `${height}%` }}
                      ></div>
                      {/* Line effect */}
                      <div
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-blue-500 rounded-t"
                        style={{ height: `${height}%` }}
                      ></div>
                      {/* Data point */}
                      <div
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-sm"
                        style={{ bottom: `${height}%`, marginBottom: '-6px' }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      <div>${day.revenue}</div>
                      <div className="font-medium">{day.day}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Downloads Trend Custom Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Downloads Trend (7 Days)</h3>
          </div>
          <div className="h-64">
            <div className="flex items-end justify-between h-48 px-2">
              {chartData.downloadsTrend.map((day, index) => {
                const maxValue = Math.max(...chartData.downloadsTrend.map(d => d.downloads));
                const height = (day.downloads / maxValue) * 100;

                return (
                  <div key={index} className="flex flex-col items-center flex-1 mx-1">
                    <div className="relative w-full mb-2">
                      <div
                        className="bg-gradient-to-t from-orange-400 to-orange-500 rounded-t transition-all duration-500 ease-out hover:from-orange-500 hover:to-orange-600 shadow-sm"
                        style={{ height: `${height}%` }}
                      ></div>
                      {/* Value label on top */}
                      <div
                        className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700"
                        style={{ bottom: `${height}%`, marginBottom: '8px' }}
                      >
                        {day.downloads}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 text-center font-medium">
                      {day.day}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-center text-sm text-gray-500">
                Total Downloads: {stats.totalDownloads}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Purchases Overview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Purchases Overview</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Purchases</span>
              <span className="font-semibold text-gray-900">{stats.totalPurchases}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Free Downloads</span>
              <span className="font-semibold text-green-600">{stats.freeDownloads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Paid Downloads</span>
              <span className="font-semibold text-blue-600">{stats.paidDownloads}</span>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Revenue Breakdown</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold text-green-600">${stats.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg per Purchase</span>
              <span className="font-semibold text-blue-600">
                ${stats.totalPurchases > 0 ? (stats.totalRevenue / stats.totalPurchases).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Free Ratio</span>
              <span className="font-semibold text-orange-600">
                {stats.totalDownloads > 0 ? Math.round((stats.freeDownloads / stats.totalDownloads) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={handleAddNewBook}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center gap-3 group"
            >
              <BookOpen className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Add New Book</span>
            </button>
            <button
              onClick={handleManageUsers}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors flex items-center gap-3 group"
            >
              <Users className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Manage Users</span>
            </button>
            <button
              onClick={handleViewDownloads}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors flex items-center gap-3 group"
            >
              <Download className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">View Downloads</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Recent Purchases</h2>
          </div>
        </div>

        <div className="p-6">
          {stats.recentPurchases.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent purchases</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentPurchases.map((purchase, index) => (
                <div key={purchase._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <img
                      src={`http://localhost:3000${purchase.cover}`}
                      alt={purchase.title}
                      className="w-12 h-16 object-cover rounded border"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/48x64?text=No+Image';
                      }}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{purchase.title}</h4>
                      <p className="text-sm text-gray-600">by {purchase.author}</p>
                      <p className="text-sm text-gray-500">{purchase.userName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${purchase.price}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(purchase.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
          <Eye className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.totalBooks + stats.totalDownloads}</p>
          <p className="text-sm text-gray-600">Total Interactions</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
          <TrendingUp className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalDownloads > 0 ? Math.round((stats.paidDownloads / stats.totalDownloads) * 100) : 0}%
          </p>
          <p className="text-sm text-gray-600">Conversion Rate</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
          <Calendar className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalPurchases > 0 ? Math.round(stats.totalRevenue / stats.totalPurchases) : 0}
          </p>
          <p className="text-sm text-gray-600">Avg Order Value</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
          <BarChart3 className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalUsers > 0 ? Math.round(stats.totalDownloads / stats.totalUsers) : 0}
          </p>
          <p className="text-sm text-gray-600">Downloads per User</p>
        </div>
      </div>
    </div>
  );
}
  