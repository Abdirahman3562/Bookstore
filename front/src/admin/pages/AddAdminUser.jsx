import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { UserPlus, X, Shield, Check } from "lucide-react";

export default function AddAdminUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    adminRole: "author", // default to author
    permissions: {
      dashboard: false,
      books: false,
      downloads: false,
      purchased: false,
      testimonials: false,
      users: false,
      authors: false,
      blogs: true, // default blogs to true for authors
      addAdminUser: false
    }
  });

  // If admin role is selected, give all permissions
  const handleRoleChange = (role) => {
    if (role === "admin") {
      setFormData((prev) => ({
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
      // For author, only blogs is checked by default
      setFormData((prev) => ({
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

  const handlePermissionChange = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:3000/api/admins", {
        ...formData
      });

      if (response.data.success) {
        toast.success("Admin user created successfully!");
        navigate("/admin/users");
      }
    } catch (error) {
      console.error("Error creating admin user:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to create admin user");
      }
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Add Admin User
          </h1>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">
          Create a new admin user with specific role and permissions
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Role *
                </label>
                <select
                  required
                  value={formData.adminRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="author">Author</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.adminRole === "admin"
                    ? "Admin can see all sections"
                    : "Author can only see selected sections"}
                </p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Permissions
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-4">
                Select which sections this user can access:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(permissionLabels).map(([key, label]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      formData.permissions[key]
                        ? "bg-blue-50 border-blue-500"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions[key]}
                      onChange={() => handlePermissionChange(key)}
                      disabled={formData.adminRole === "admin"}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              {formData.adminRole === "admin" && (
                <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Admin role has all permissions enabled
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Admin User
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

