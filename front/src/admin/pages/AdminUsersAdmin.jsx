import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Shield, RotateCcw, Edit, X, Save, UserPlus, Check, Eye, EyeOff, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminUsersAdmin() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    password: "",
    adminRole: "author",
    permissions: {
      dashboard: false,
      books: false,
      downloads: false,
      purchased: false,
      testimonials: false,
      users: false,
      authors: false,
      blogs: false,
      addAdminUser: false
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch admins data
  const fetchAdmins = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      }

      const response = await axios.get("http://localhost:3000/api/admins");
      const data = response.data.data || [];

      setAdmins(data);
      setLastUpdated(new Date().toLocaleString());

      if (showRefreshIndicator) {
        toast.success("Admin users data refreshed!");
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to load admin users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle role change in edit form
  const handleRoleChange = (role) => {
    if (role === "admin") {
      setEditFormData((prev) => ({
        ...prev,
        adminRole: role,
        permissions: {
          dashboard: true,
          books: true,
          downloads: true,
          purchased: true,
          testimonials: true,
          users: true,
          authors: true,
          blogs: true,
          addAdminUser: true
        }
      }));
    } else {
      setEditFormData((prev) => ({
        ...prev,
        adminRole: role,
        permissions: {
          dashboard: false,
          books: false,
          downloads: false,
          purchased: false,
          testimonials: false,
          users: false,
          authors: false,
          blogs: true,
          addAdminUser: false
        }
      }));
    }
  };

  // Handle permission change in edit form
  const handlePermissionChange = (permission) => {
    setEditFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }));
  };

  // Open edit modal
  const openEditModal = async (admin) => {
    setEditingAdmin(admin);
    
    // Fetch the full admin data including password
    try {
      const response = await axios.get(`http://localhost:3000/api/admins/${admin._id}`);
      const fullAdmin = response.data.data || admin;
      
      setEditFormData({
        name: fullAdmin.name || admin.name || "",
        email: fullAdmin.email || admin.email || "",
        password: fullAdmin.password || "", // Show current password
        adminRole: fullAdmin.adminRole || admin.adminRole || "author",
        permissions: fullAdmin.permissions || admin.permissions || {
          dashboard: false,
          books: false,
          downloads: false,
          purchased: false,
          testimonials: false,
          users: false,
          authors: false,
          blogs: false,
          addAdminUser: false
        }
      });
      setShowPassword(true); // Show password by default so they can see it
    } catch (error) {
      console.error("Error fetching admin details:", error);
      // Fallback to admin data without password
      setEditFormData({
        name: admin.name || "",
        email: admin.email || "",
        password: "", // Empty if can't fetch
        adminRole: admin.adminRole || "author",
        permissions: admin.permissions || {
          dashboard: false,
          books: false,
          downloads: false,
          purchased: false,
          testimonials: false,
          users: false,
          authors: false,
          blogs: false,
          addAdminUser: false
        }
      });
      setShowPassword(false);
    }
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingAdmin(null);
    setEditFormData({
      name: "",
      email: "",
      password: "",
      adminRole: "author",
      permissions: {
        dashboard: false,
        books: false,
        downloads: false,
        purchased: false,
        testimonials: false,
        users: false,
        authors: false,
        blogs: false,
        addAdminUser: false
      }
    });
    setShowPassword(false);
  };

  // Save admin updates
  const handleSave = async () => {
    if (!editingAdmin) return;

    setSaving(true);
    try {
      const updateData = {
        name: editFormData.name,
        email: editFormData.email,
        adminRole: editFormData.adminRole,
        permissions: editFormData.permissions
      };

      // Always include password - if empty, keep current; if filled, update it
      if (editFormData.password && editFormData.password.trim() !== "") {
        if (editFormData.password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setSaving(false);
          return;
        }
        updateData.password = editFormData.password;
      } else {
        // If password field is cleared, fetch current password to keep it
        try {
          const currentAdminResponse = await axios.get(`http://localhost:3000/api/admins/${editingAdmin._id}`);
          const currentAdmin = currentAdminResponse.data.data;
          if (currentAdmin && currentAdmin.password) {
            updateData.password = currentAdmin.password; // Keep current password
          }
        } catch (error) {
          console.error("Error fetching current password:", error);
          // If we can't fetch, don't include password - backend should handle it
        }
      }

      await axios.put(`http://localhost:3000/api/admins/${editingAdmin._id}`, updateData);

      toast.success("Admin user updated successfully!");
      closeEditModal();
      await fetchAdmins();
    } catch (error) {
      console.error("Error updating admin:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to update admin user";
      console.error("Error details:", error.response?.data);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchAdmins();
  }, []);

  const permissionLabels = {
    dashboard: "Dashboard",
    books: "Books",
    downloads: "Downloads",
    purchased: "Purchased",
    testimonials: "Testimonials",
    users: "Users",
    authors: "Authors",
    blogs: "Blogs",
    addAdminUser: "Add Admin User"
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin users...</p>
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
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Users Management</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500 text-center sm:text-left">
                Last updated: {lastUpdated}
              </span>
            )}
            <button
              onClick={() => navigate("/admin/add-admin-user")}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4" />
              Add Admin User
            </button>
            <button
              onClick={() => fetchAdmins(true)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg transition-colors w-full sm:w-auto"
              title="Refresh admin users data"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">Manage admin user accounts, roles, and permissions</p>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <h2 className="text-xl font-semibold text-white">Admin User Accounts</h2>
        </div>

        <div className="p-6">
          {admins.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No admin users found</h3>
              <p className="text-gray-600 mb-4">Admin user accounts will appear here when created.</p>
              <button
                onClick={() => navigate("/admin/add-admin-user")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add Admin User
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Admin User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Permissions</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {admin.avatar ? (
                            <img
                              src={admin.avatar}
                              alt={admin.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=3B82F6&color=fff&size=128`;
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {admin.name
                                ? admin.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)
                                : "A"}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{admin.name}</p>
                            <p className="text-gray-600 text-xs">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          admin.adminRole === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {admin.adminRole || 'author'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(permissionLabels).map(([key, label]) => {
                            if (admin.permissions && admin.permissions[key]) {
                              return (
                                <span
                                  key={key}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                                >
                                  {label}
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => openEditModal(admin)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
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

      {/* Edit Modal */}
      {editingAdmin && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeEditModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Edit Admin User
                </h2>
                <button
                  onClick={closeEditModal}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Role *
                      </label>
                      <select
                        required
                        value={editFormData.adminRole}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="author">Author</option>
                        <option value="admin">Admin</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {editFormData.adminRole === "admin"
                          ? "Admin can see all sections"
                          : "Author can only see selected sections"}
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-[14px] font-medium text-gray-700 mb-2">
                        <Key className="w-4 h-4" />
                        New Password (leave blank to keep current)
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={editFormData.password}
                          onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter new password (min 6 characters)"
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Leave blank to keep the current password unchanged
                      </p>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Permissions
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Select which sections this user can access:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(permissionLabels).map(([key, label]) => (
                        <label
                          key={key}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            editFormData.permissions[key]
                              ? "bg-blue-50 border-blue-500"
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={editFormData.permissions[key]}
                            onChange={() => handlePermissionChange(key)}
                            disabled={editFormData.adminRole === "admin"}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                    {editFormData.adminRole === "admin" && (
                      <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        Admin role has all permissions enabled
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

