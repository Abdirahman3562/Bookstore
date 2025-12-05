import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { UserPlus, X, Shield, Check, Eye, EyeOff } from "lucide-react";

export default function AddAdminUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authors, setAuthors] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    adminRole: "author", // default to author
    authorId: "", // Link to author
    permissions: {
      dashboard: false,
      books: false,
      downloads: false,
      purchased: false,
      testimonials: false,
      users: false,
      authors: true, // Auto-check authors permission for author role
      blogs: true, // default blogs to true for authors
      addAdminUser: false
    }
  });

  // Fetch authors list
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/authors");
        const data = response.data.data || [];
        setAuthors(data);
      } catch (error) {
        console.error("Error fetching authors:", error);
      }
    };
    fetchAuthors();
  }, []);

  // If admin role is selected, give all permissions
  const handleRoleChange = (role) => {
    if (role === "admin") {
      setFormData((prev) => ({
        ...prev,
        adminRole: role,
        authorId: "", // Clear authorId for admin
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
      // For author role, automatically check "authors" and "blogs" permissions
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
          authors: true, // Auto-check authors permission for author role
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
        navigate("/admin/admin-users");
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
          <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Add Admin User
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Create a new admin user with specific role and permissions
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Role *
                </label>
                <select
                  required
                  value={formData.adminRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                >
                  <option value="author">Author</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.adminRole === "admin"
                    ? "Admin can see all sections"
                    : "Author can only see selected sections"}
                </p>
              </div>
            </div>
          </div>

          {/* Author Selection - Only show when role is "author" */}
          {formData.adminRole === "author" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Link to Author Profile
              </h2>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Select which author profile this admin user should be linked to:
                </p>
                {authors.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No authors found. Please create an author first.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {authors.map((author) => (
                      <label
                        key={author._id}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          formData.authorId === author._id
                            ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name="authorId"
                          value={author._id}
                          checked={formData.authorId === author._id}
                          onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                          className="w-4 h-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {author.avatar ? (
                            <img
                              src={author.avatar}
                              alt={author.name}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                              {author.name
                                ? author.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)
                                : "A"}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {author.name}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  This will link the admin user to the selected author profile. When this author logs in, they will see comments on their blogs.
                </p>
              </div>
            </div>
          )}

          {/* Permissions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Permissions
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select which sections this user can access:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(permissionLabels).map(([key, label]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      formData.permissions[key]
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions[key]}
                      onChange={() => handlePermissionChange(key)}
                      disabled={formData.adminRole === "admin"}
                      className="w-4 h-4 text-blue-600 dark:text-blue-500 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              {formData.adminRole === "admin" && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Admin role has all permissions enabled
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate("/admin/admin-users")}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
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

