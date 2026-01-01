import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { UserPlus, X, Shield, Check, Eye, EyeOff, Building2 } from "lucide-react";

export default function SuperAdminCreateAdmin() {
  const navigate = useNavigate();
  const { id: tenantId } = useParams(); // Get tenantId from URL params
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    adminRole: "admin", // admin, author, or SUPER_ADMIN
    tenantId: tenantId || null, // Set tenantId from URL params
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

  useEffect(() => {
    fetchTenants();
    // If tenantId is provided from URL params, set it in form data
    if (tenantId) {
      setFormData(prev => ({
        ...prev,
        tenantId: tenantId
      }));
    }
  }, [tenantId]);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get("http://localhost:3000/api/superadmin/tenants", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setTenants(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
    }
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      adminRole: role,
      tenantId: role === "SUPER_ADMIN" ? null : prev.tenantId
    }));
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
      
      const submitData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        adminRole: formData.adminRole,
        tenantId: formData.adminRole === "SUPER_ADMIN" ? null : formData.tenantId,
        permissions: formData.permissions
      };

      console.log("Creating admin with data:", submitData);

      const response = await axios.post(
        "http://localhost:3000/api/superadmin/admins",
        submitData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`${formData.adminRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'} created successfully!`);
        navigate("/superadmin/dashboard");
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error(error.response?.data?.message || "Failed to create admin");
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
    contacts: ["view", "edit", "delete"],
    websiteSettings: ["view", "edit"],
    addAdminUser: ["view", "add", "edit", "delete"],
    liveChat: ["view", "reply"]
  };

  return (
    <div className="p-4 sm:p-6 w-full ">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Create Admin User
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Create a new admin user (SUPER_ADMIN, ADMIN, or AUTHOR)
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
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
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="author">Author</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.adminRole === "SUPER_ADMIN"
                    ? "Super Admin can manage all tenants and platform"
                    : formData.adminRole === "admin"
                    ? "Admin can manage tenant resources"
                    : "Author can manage blogs and content"}
                </p>
              </div>
            </div>
          </div>

          {/* Tenant Selection - Only for regular admins */}
          {formData.adminRole !== "SUPER_ADMIN" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Assign to Tenant
              </h2>
              <select
                required={formData.adminRole !== "SUPER_ADMIN"}
                value={formData.tenantId || ""}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                disabled={!!tenantId} // Disable if tenantId is provided from URL
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-0 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name} ({tenant.contactEmail})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Permissions - Only for regular admins */}
          {formData.adminRole !== "SUPER_ADMIN" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Check className="w-5 h-5" />
                Permissions
              </h2>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div className="space-y-4">
                  {Object.entries(permissionLabels).map(([sectionKey, sectionLabel]) => {
                    const sectionPerms = formData.permissions[sectionKey] || {};
                    const availableActions = sectionActions[sectionKey] || [];
                    const allChecked = availableActions.length > 0 && availableActions.every(action => sectionPerms[action] === true);

                    return (
                      <div key={sectionKey} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={allChecked}
                              onChange={() => {
                                const newValue = !allChecked;
                                const updatedPerms = { ...sectionPerms };
                                availableActions.forEach(action => {
                                  updatedPerms[action] = newValue;
                                });
                                setFormData(prev => ({
                                  ...prev,
                                  permissions: {
                                    ...prev.permissions,
                                    [sectionKey]: updatedPerms
                                  }
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span>{sectionLabel}</span>
                          </label>
                        </div>
                        {availableActions.length > 0 && (
                          <div className="grid gap-2 ml-6 grid-cols-2 sm:grid-cols-4">
                            {availableActions.map((actionKey) => (
                              <label
                                key={actionKey}
                                className="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={sectionPerms[actionKey] || false}
                                  onChange={() => handlePermissionChange(sectionKey, actionKey)}
                                  className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {actionLabels[actionKey]}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate("/superadmin/dashboard")}
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
                  Create Admin
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

