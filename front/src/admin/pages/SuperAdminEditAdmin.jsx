import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { UserPlus, X, Shield, Check, Eye, EyeOff, Save, ArrowLeft } from "lucide-react";

export default function SuperAdminEditAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [authors, setAuthors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    adminRole: "author",
    authorId: "",
    permissions: {
      dashboard: { view: false, add: false, edit: false, delete: false },
      books: { view: false, add: false, edit: false, delete: false },
      downloads: { view: false, add: false, edit: false, delete: false, revoke: false },
      purchased: { view: false, add: false, edit: false, delete: false },
      testimonials: { view: false, add: false, edit: false, delete: false },
      users: { view: false, add: false, edit: false, delete: false },
      authors: { view: false, add: false, edit: false, delete: false },
      blogs: { view: false, add: false, edit: false, delete: false },
      blogComments: { view: false, reply: false, delete: false },
      contacts: { view: false, add: false, edit: false, delete: false },
      websiteSettings: { view: false, add: false, edit: false, delete: false },
      addAdminUser: { view: false, add: false, edit: false, delete: false },
      liveChat: { view: false, reply: false }
    }
  });

  // Fetch admin data to edit
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          navigate("/admin");
          return;
        }

        const response = await axios.get(`http://localhost:3000/api/admins/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const admin = response.data.data;
          setFormData({
            name: admin.name || "",
            email: admin.email || "",
            password: "", // Don't pre-fill password
            adminRole: admin.adminRole || "author",
            authorId: admin.authorId || "",
            permissions: admin.permissions || formData.permissions
          });
        }
      } catch (error) {
        console.error("Error fetching admin:", error);
        toast.error("Failed to load admin data");
        navigate("/superadmin/admins");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchAdmin();
  }, [id, navigate]);

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

  // Handle role change
  const handleRoleChange = (role) => {
    if (role === "admin") {
      setFormData((prev) => ({
        ...prev,
        adminRole: role,
        authorId: "" // Clear authorId for admin
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        adminRole: role
      }));
    }
  };

  const handlePermissionChange = (section, action) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [section]: {
          ...prev.permissions[section],
          [action]: !prev.permissions[section][action]
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");

      // Prepare data to send - exclude password if empty
      const submitData = {
        name: formData.name,
        email: formData.email,
        adminRole: formData.adminRole,
        authorId: formData.authorId && formData.authorId.trim() !== "" ? formData.authorId : null,
        permissions: formData.permissions
      };

      // Only include password if it was provided
      if (formData.password && formData.password.trim() !== "") {
        submitData.password = formData.password;
      }

      console.log("Updating admin user data:", submitData);

      const response = await axios.put(`http://localhost:3000/api/admins/${id}`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Admin user updated successfully!");
        navigate("/superadmin/admins");
      }
    } catch (error) {
      console.error("Error updating admin user:", error);
      console.error("Error response:", error.response?.data);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to update admin user");
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
    blogComments: "Blog Comments",
    contacts: "Contacts",
    websiteSettings: "Website Settings",
    addAdminUser: "Add Admin User",
    liveChat: "Live Chat"
  };

  const actionLabels = {
    view: "View",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    revoke: "Revoke",
    reply: "Reply"
  };

  const sectionActions = {
    dashboard: ["view"],
    books: ["view", "add", "edit", "delete"],
    downloads: ["view", "revoke"],
    purchased: ["view", "edit", "delete"],
    testimonials: ["view", "add", "edit", "delete"],
    users: ["view", "edit"],
    authors: ["view", "add", "edit", "delete"],
    blogs: ["view", "add", "edit", "delete"],
    blogComments: ["view", "reply", "delete"],
    contacts: ["view", "add", "edit", "delete"],
    websiteSettings: ["view", "add", "edit", "delete"],
    addAdminUser: ["view", "add", "edit", "delete"],
    liveChat: ["view", "reply"]
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate("/superadmin/admins")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Edit Admin User
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update admin user information and permissions
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  (Leave empty to keep current password)
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password (optional)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Admin Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Role *
              </label>
              <select
                required
                value={formData.adminRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="author">Author</option>
                <option value="admin">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            {/* Author Link (only for author role) */}
            {formData.adminRole === "author" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link to Author Profile
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    (Optional - link this admin to an existing author)
                  </span>
                </label>
                <select
                  value={formData.authorId}
                  onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select an author (optional)</option>
                  {authors.map((author) => (
                    <option key={author._id} value={author._id}>
                      {author.name} ({author.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Permissions */}
        {formData.adminRole !== "SUPER_ADMIN" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Permissions
            </h2>

            <div className="space-y-6">
              {Object.entries(sectionActions).map(([section, actions]) => (
                <div key={section} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    {permissionLabels[section]}
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {actions.map((action) => (
                      <label key={action} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions[section]?.[action] || false}
                          onChange={() => handlePermissionChange(section, action)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {actionLabels[action]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/superadmin/admins")}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Update Admin
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}



