import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Users, RotateCcw, UserCheck, UserX, Mail, Calendar, Shield } from "lucide-react";
import { getCurrentAdminUser, canEdit } from "../utils/permissions";
import DataTable from "../components/DataTable";

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    premiumUsers: 0
  });

  // Fetch users data
  const fetchUsers = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
        console.log("🔄 Manual refresh: Fetching users from database...");
      } else {
        console.log("🔄 Fetching users from database...");
      }

      const response = await axios.get("http://localhost:3000/api/users");
      const allData = response.data.data || [];
      
      // Filter out admin users (users with adminRole)
      const data = allData.filter(u => !u.adminRole || u.adminRole === null);
      console.log(`✅ Fetched ${data.length} users from database (excluding admins)`);
      
      // Debug: Log avatar info for first user
      if (data.length > 0) {
        console.log('Sample user avatar data:', {
          name: data[0].name,
          avatar: data[0].avatar,
          avatarType: typeof data[0].avatar,
          hasAvatar: data[0].avatar && data[0].avatar.trim() !== ''
        });
      }

      // Calculate stats (only for regular users)
      const totalUsers = data.length;
      const activeUsers = data.filter(u => u.status === 'active').length;
      const inactiveUsers = data.filter(u => u.status === 'inactive').length;
      const premiumUsers = data.filter(u => u.role === 'premium').length;

      setStats({
        totalUsers,
        activeUsers,
        inactiveUsers,
        premiumUsers
      });

      setUsers(data);
      setLastUpdated(new Date().toLocaleString());

      if (showRefreshIndicator) {
        toast.success("Users data refreshed!");
      }
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (userId) => {
    try {
      const user = users.find(u => u._id === userId);
      
      // Toggle between active and inactive
      const newStatus = user.status === 'active' ? 'inactive' : 'active';

      await axios.patch(`http://localhost:3000/api/users/${userId}/status`, { 
        status: newStatus
      });

      toast.success(newStatus === 'inactive' 
        ? 'User deactivated successfully!' 
        : 'User activated successfully!'
      );
      
      await fetchUsers(); // Refresh to get updated status
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  // Load current user and data on component mount
  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentAdminUser();
      setCurrentUser(user);
    };
    loadUser();
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
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
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Users Management</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                Last updated: {lastUpdated}
              </span>
            )}
            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors text-gray-700 dark:text-gray-300 w-full sm:w-auto"
              title="Refresh users data"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Manage user accounts, permissions, and activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-indigo-600 dark:to-indigo-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <UserCheck className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-blue-100 dark:text-indigo-200 text-sm font-medium">Total Users</p>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-emerald-600 dark:to-emerald-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <UserCheck className="w-8 h-8 opacity-80" />
            <Shield className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-green-100 dark:text-emerald-200 text-sm font-medium">Active Users</p>
            <p className="text-3xl font-bold">{stats.activeUsers}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-rose-600 dark:to-rose-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <UserX className="w-8 h-8 opacity-80" />
            <Calendar className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-red-100 dark:text-rose-200 text-sm font-medium">Inactive Users</p>
            <p className="text-3xl font-bold">{stats.inactiveUsers}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-violet-600 dark:to-violet-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-8 h-8 opacity-80" />
            <UserCheck className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-purple-100 dark:text-violet-200 text-sm font-medium">Premium Users</p>
            <p className="text-3xl font-bold">{stats.premiumUsers}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-6">
          <h2 className="text-xl font-semibold text-white">User Accounts</h2>
        </div>

        <div className="p-6">
          <DataTable
            columns={[
              {
                header: "User",
                accessor: "user",
                cell: (user) => {
                  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  const hasAvatar = user.avatar && 
                                  typeof user.avatar === 'string' && 
                                  user.avatar.trim() !== '' && 
                                  user.avatar !== 'null' && 
                                  user.avatar !== 'undefined';
                  
                  let avatarUrl = hasAvatar ? user.avatar.trim() : null;
                  if (hasAvatar && !avatarUrl.startsWith('data:') && !avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
                    avatarUrl = avatarUrl.startsWith('/') 
                      ? `http://localhost:3000${avatarUrl}`
                      : `http://localhost:3000/${avatarUrl}`;
                  }
                  
                  return (
                    <div className="flex items-center gap-3">
                      {hasAvatar && avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 flex-shrink-0"
                          onError={(e) => {
                            e.target.outerHTML = `<div class="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-sm font-semibold border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">${initials}</div>`;
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-sm font-semibold border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{user.name}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  );
                },
              },
              {
                header: "Role",
                accessor: "role",
                cell: (user) => (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'premium'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}>
                    {user.role || 'regular'}
                  </span>
                ),
              },
              {
                header: "Status",
                accessor: "status",
                cell: (user) => (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {user.status === 'active' ? (
                      <UserCheck size={12} />
                    ) : (
                      <UserX size={12} />
                    )}
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                ),
              },
              {
                header: "Activity",
                accessor: "activity",
                cellClassName: "text-gray-600 dark:text-gray-400",
                cell: (user) => (
                  <div>
                    <p>Downloads: {user.downloadsCount || 0}</p>
                    <p>Purchases: {user.purchasesCount || 0}</p>
                  </div>
                ),
              },
              {
                header: "Join Date",
                accessor: "createdAt",
                cellClassName: "text-gray-600 dark:text-gray-400",
                cell: (user) => (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      : 'N/A'
                    }
                  </div>
                ),
              },
              {
                header: "Actions",
                accessor: "actions",
                cell: (user) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUserStatus(user._id);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors border text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                      user.status === 'active'
                        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800'
                    }`}
                    title={!canEdit(currentUser, 'users') ? "You don't have permission to change user status" : user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                    disabled={!canEdit(currentUser, 'users')}
                  >
                    {user.status === 'active' ? (
                      <>
                        <UserX className="w-3 h-3" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3 h-3" />
                        Activate
                      </>
                    )}
                  </button>
                ),
              },
            ]}
            data={users}
            itemsPerPage={10}
            emptyMessage="No users found"
            emptyIcon={Users}
          />
        </div>
      </div>

    </div>
  );
}