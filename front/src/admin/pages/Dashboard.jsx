import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
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
    totalClientUsers: 0,
    totalAdminUsers: 0,
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
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());


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

      // Get authentication token
      const token = localStorage.getItem("admin_token");
      if (!token) {
        console.error("No admin token found");
        return;
      }

      const authHeaders = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch data from multiple endpoints
      const [booksRes, downloadsRes, purchasesRes, usersRes, adminsRes] = await Promise.all([
        axios.get("http://localhost:3000/api/books", authHeaders),
        axios.get("http://localhost:3000/api/downloads", authHeaders),
        axios.get("http://localhost:3000/api/purchased", authHeaders),
        axios.get("http://localhost:3000/api/users", authHeaders),
        axios.get("http://localhost:3000/api/admins", authHeaders)
      ]);

      const books = booksRes.data.data || [];
      const downloads = downloadsRes.data.data || [];
      const purchases = purchasesRes.data.data || [];
      const clientUsers = usersRes.data.data || [];
      const adminUsers = adminsRes.data.data || [];

      // Calculate statistics
      const totalBooks = books.length;
      const totalClientUsers = clientUsers.length;
      const totalAdminUsers = adminUsers.length;
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
        totalClientUsers,
        totalAdminUsers,
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

      // Calculate real user statistics
      const userStatsData = [
        { name: 'Client Users', value: totalClientUsers, color: '#10B981' },
        { name: 'Admin Users', value: totalAdminUsers, color: '#3B82F6' },
        { name: 'Total Users', value: totalClientUsers + totalAdminUsers, color: '#8B5CF6' }
      ];

      // Calculate real revenue trend data (last 7 days)
      const today = new Date();
      const last7Days = [];
      
      // Generate last 7 days with day names
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        last7Days.push({
          date: date,
          day: dayNames[date.getDay()],
          revenue: 0
        });
      }
      
      // Calculate revenue for each day from purchases
      purchases.forEach(purchase => {
        if (purchase.timestamp) {
          const purchaseDate = new Date(purchase.timestamp);
          // Check if purchase is within last 7 days
          const daysDiff = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
          
          if (daysDiff >= 0 && daysDiff < 7) {
            // Find the day in last7Days array
            const dayIndex = 6 - daysDiff;
            if (dayIndex >= 0 && dayIndex < last7Days.length) {
              last7Days[dayIndex].revenue += purchase.price || 0;
            }
          }
        }
      });
      
      const revenueTrendData = last7Days.map(day => ({
        day: day.day,
        revenue: parseFloat(day.revenue.toFixed(2))
      }));

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

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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
            <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                Last updated: {currentTime}
              </span>
            )}
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors w-full sm:w-auto text-gray-700 dark:text-gray-300"
              title="Refresh dashboard data"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Welcome back! Here's what's happening with your bookstore.</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Total Books */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-cyan-600 dark:to-cyan-800 p-6 rounded-xl text-white shadow-lg dark:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-blue-100 dark:text-cyan-200 text-sm font-medium">Total Books</p>
            <p className="text-3xl font-bold">{stats.totalBooks}</p>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-teal-600 dark:to-teal-800 p-6 rounded-xl text-white shadow-lg dark:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <Activity className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-green-100 dark:text-teal-200 text-sm font-medium mb-2">Total Users</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-green-100 dark:text-teal-200 text-xs">Client Users:</span>
                <p className="text-2xl font-bold">{stats.totalClientUsers}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-100 dark:text-teal-200 text-xs">Admin Users:</span>
                <p className="text-2xl font-bold">{stats.totalAdminUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-pink-600 dark:to-pink-800 p-6 rounded-xl text-white shadow-lg dark:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
            <CreditCard className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-purple-100 dark:text-pink-200 text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Total Downloads */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-yellow-600 dark:to-yellow-800 p-6 rounded-xl text-white shadow-lg dark:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Download className="w-8 h-8 opacity-80" />
            <FileText className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-orange-100 dark:text-yellow-200 text-sm font-medium">Total Downloads</p>
            <p className="text-3xl font-bold">{stats.totalDownloads}</p>
          </div>
        </div>
      </div>

      {/* Beautiful Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Breakdown Custom Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-6 h-6 text-purple-600 dark:text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Breakdown</h3>
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
                  <div className="bg-white dark:bg-gray-800 rounded-full w-16 h-16 shadow-inner flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDownloads}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Free ({chartData.revenueBreakdown[0]?.value || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Paid ({chartData.revenueBreakdown[1]?.value || 0})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Statistics Custom Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <BarChart className="w-6 h-6 text-green-600 dark:text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Statistics</h3>
          </div>
          <div className="h-64">
            <div className="space-y-4">
              {chartData.userStats.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-gray-600 dark:text-gray-400 truncate">{item.name}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full transition-all duration-500 ease-out rounded-full"
                          style={{
                            width: `${(item.value / Math.max(...chartData.userStats.map(d => d.value))) * 100}%`,
                            backgroundColor: item.color
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">{item.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Total Users: {stats.totalClientUsers + stats.totalAdminUsers}
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Trend Custom Area Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <ActivityIcon className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend (7 Days)</h3>
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
                        className="bg-blue-100 dark:bg-blue-900/30 rounded-t transition-all duration-500 ease-out"
                        style={{ height: `${height}%` }}
                      ></div>
                      {/* Line effect */}
                      <div
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-blue-500 dark:bg-blue-400 rounded-t"
                        style={{ height: `${height}%` }}
                      ></div>
                      {/* Data point */}
                      <div
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                        style={{ bottom: `${height}%`, marginBottom: '-6px' }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Downloads Trend (7 Days)</h3>
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
                        className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700 dark:text-gray-300"
                        style={{ bottom: `${height}%`, marginBottom: '8px' }}
                      >
                        {day.downloads}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                      {day.day}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Total Downloads: {stats.totalDownloads}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Purchases Overview */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purchases Overview</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Purchases</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.totalPurchases}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Free Downloads</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{stats.freeDownloads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Paid Downloads</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.paidDownloads}</span>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Breakdown</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Revenue</span>
              <span className="font-semibold text-green-600 dark:text-green-400">${stats.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Avg per Purchase</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                ${stats.totalPurchases > 0 ? (stats.totalRevenue / stats.totalPurchases).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Free Ratio</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {stats.totalDownloads > 0 ? Math.round((stats.freeDownloads / stats.totalDownloads) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-purple-600 dark:text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={handleAddNewBook}
              className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-colors flex items-center gap-3 group"
            >
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add New Book</span>
            </button>
            <button
              onClick={handleManageUsers}
              className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 transition-colors flex items-center gap-3 group"
            >
              <Users className="w-4 h-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Users</span>
            </button>
            <button
              onClick={handleViewDownloads}
              className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-600 transition-colors flex items-center gap-3 group"
            >
              <Download className="w-4 h-4 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Downloads</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Recent Purchases</h2>
          </div>
        </div>

        <div className="p-6">
          {stats.recentPurchases.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <ShoppingCart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No recent purchases</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Purchases will appear here when customers make orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentPurchases.map((purchase, index) => (
                <div
                  key={purchase._id || index}
                  className="group relative flex items-center gap-4 p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg dark:hover:shadow-blue-900/20 transition-all duration-300 overflow-hidden"
                >
                  {/* Decorative gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none"></div>
                  
                  {/* Book Cover with shadow effect */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
                    <img
                      src={`http://localhost:3000${purchase.cover}`}
                      alt={purchase.title}
                      className="relative w-14 h-20 sm:w-16 sm:h-24 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all duration-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/64x96?text=No+Image';
                      }}
                    />
                  </div>

                  {/* Book Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {purchase.title}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">by {purchase.author}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {purchase.userAvatar ? (
                            <img
                              src={purchase.userAvatar.startsWith('data:') ? purchase.userAvatar : `http://localhost:3000${purchase.userAvatar}`}
                              alt={purchase.userName}
                              className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-xs font-semibold border border-gray-200 dark:border-gray-600 flex-shrink-0 ${purchase.userAvatar ? 'hidden' : ''}`}
                            style={{ display: purchase.userAvatar ? 'none' : 'flex' }}
                          >
                            {purchase.userName
                              ? purchase.userName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)
                              : "U"}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-500 truncate">{purchase.userName}</p>
                        </div>
                      </div>

                      {/* Price and Date Section */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border border-green-200 dark:border-green-800">
                          <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <p className="font-bold text-green-600 dark:text-green-400 text-lg">
                            {purchase.price}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(purchase.timestamp).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}</span>
                        </div>
                        {purchase.paymentmethod && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                            <CreditCard className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 capitalize">
                              {purchase.paymentmethod}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <Eye className="w-6 h-6 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBooks + stats.totalDownloads}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Interactions</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <TrendingUp className="w-6 h-6 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalDownloads > 0 ? Math.round((stats.paidDownloads / stats.totalDownloads) * 100) : 0}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalPurchases > 0 ? Math.round(stats.totalRevenue / stats.totalPurchases) : 0}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Order Value</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <BarChart3 className="w-6 h-6 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalClientUsers > 0 ? Math.round(stats.totalDownloads / stats.totalClientUsers) : 0}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Downloads per User</p>
        </div>
      </div>
    </div>
  );
}
  