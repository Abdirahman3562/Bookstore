import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Users, RotateCcw, UserCheck, UserX, Mail, Calendar, Shield } from "lucide-react";

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
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

  // Load data on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Users Management</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500 text-center sm:text-left">
                Last updated: {lastUpdated}
              </span>
            )}
            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg transition-colors w-full sm:w-auto"
              title="Refresh users data"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">Manage user accounts, permissions, and activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <UserCheck className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Users</p>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <UserCheck className="w-8 h-8 opacity-80" />
            <Shield className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-green-100 text-sm font-medium">Active Users</p>
            <p className="text-3xl font-bold">{stats.activeUsers}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <UserX className="w-8 h-8 opacity-80" />
            <Calendar className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-red-100 text-sm font-medium">Inactive Users</p>
            <p className="text-3xl font-bold">{stats.inactiveUsers}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-8 h-8 opacity-80" />
            <UserCheck className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-purple-100 text-sm font-medium">Premium Users</p>
            <p className="text-3xl font-bold">{stats.premiumUsers}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <h2 className="text-xl font-semibold text-white">User Accounts</h2>
        </div>

        <div className="p-6">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">User accounts will appear here when registered.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Activity</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Join Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar 
                              ? (user.avatar.startsWith('http') 
                                  ? user.avatar 
                                  : `http://localhost:3000${user.avatar}`)
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3B82F6&color=fff&size=128`
                            }
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3B82F6&color=fff&size=128`;
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                            <p className="text-gray-600 text-xs flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'premium'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'active' ? (
                            <UserCheck size={12} />
                          ) : (
                            <UserX size={12} />
                          )}
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div>
                          <p>Downloads: {user.downloadsCount}</p>
                          <p>Purchases: {user.purchasesCount}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
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
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleUserStatus(user._id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors border text-xs font-medium ${
                            user.status === 'active'
                              ? 'text-red-600 hover:bg-red-50 border-red-200'
                              : 'text-green-600 hover:bg-green-50 border-green-200'
                          }`}
                          title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}