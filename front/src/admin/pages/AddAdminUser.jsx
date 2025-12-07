import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { UserPlus, X, Shield, Check, Eye, EyeOff } from "lucide-react";
import { getCurrentAdminUser, canView, canAdd } from "../utils/permissions";

export default function AddAdminUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authors, setAuthors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    adminRole: "author", // default to author
    authorId: "", // Link to author
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

  // Fetch authors list and current user
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
    
    // Get current admin user for permission checks
    const loadCurrentUser = async () => {
      const user = await getCurrentAdminUser();
      setCurrentUser(user);
      
      // Check if user has view permission - if not, redirect silently
      if (!canView(user, 'addAdminUser')) {
        // Redirect to first available page user has permission for
        const permissionRoutes = {
          dashboard: "/admin/dashboard",
          books: "/admin/books",
          downloads: "/admin/downloads",
          purchased: "/admin/purchased",
          testimonials: "/admin/testimonials",
          users: "/admin/users",
          authors: "/admin/authors",
          blogs: "/admin/blogs",
          contacts: "/admin/contacts",
          websiteSettings: "/admin/website-settings",
          liveChat: "/admin/live-chat"
        };
        
        let redirectPath = "/admin/dashboard"; // Default fallback
        
        if (user && user.permissions) {
          for (const [key, path] of Object.entries(permissionRoutes)) {
            if (canView(user, key)) {
              redirectPath = path;
              break;
            }
          }
        }
        
        navigate(redirectPath);
      }
    };
    
    fetchAuthors();
    loadCurrentUser();
  }, [navigate]);

  // Handle role change - don't auto-set permissions, let user select manually
  const handleRoleChange = (role) => {
    if (role === "admin") {
      setFormData((prev) => ({
        ...prev,
        adminRole: role,
        authorId: "" // Clear authorId for admin
        // Keep existing permissions - don't auto-set
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        adminRole: role
        // Keep existing permissions - don't auto-set
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
    
    // Check permission before submitting
    if (!canAdd(currentUser, 'addAdminUser')) {
      toast.error("You don't have permission to add admin users");
      return;
    }
    
    setLoading(true);

    try {
      // Prepare data to send - ensure authorId is null if empty, and permissions are properly structured
      const submitData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        adminRole: formData.adminRole,
        authorId: formData.authorId && formData.authorId.trim() !== "" ? formData.authorId : null,
        permissions: formData.permissions
      };
      
      console.log("Submitting admin user data:", submitData);
      
      const response = await axios.post("http://localhost:3000/api/admins", submitData);

      if (response.data.success) {
        toast.success("Admin user created successfully!");
        navigate("/admin/admin-users");
      }
    } catch (error) {
      console.error("Error creating admin user:", error);
      console.error("Error response:", error.response?.data);
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
    revoke: "Revoke", // For downloads - revoke/grant access
    reply: "Reply" // For blog comments - reply to comments
  };

  // Define which actions are available for each section based on actual page functionality
  const sectionActions = {
    dashboard: ["view"], // Dashboard only has view
    books: ["view", "add", "edit", "delete"], // Books has all actions
    downloads: ["view", "revoke"], // Downloads has view and revoke/grant access (revoke is like edit)
    purchased: ["view", "edit", "delete"], // Purchased has view, edit (status: approve/cancel/activate/restore), delete (no add)
    testimonials: ["view", "add", "edit", "delete"], // Testimonials has all actions
    users: ["view", "edit"], // Users has view and edit (status toggle: activate/deactivate, no add/delete)
    authors: ["view", "add", "edit", "delete"], // Authors has all actions
    blogs: ["view", "add", "edit", "delete"], // Blogs has all actions
    blogComments: ["view", "reply", "delete"], // Blog Comments has view, reply, delete (no add)
    contacts: ["view", "edit", "delete"], // Contacts has view, edit (reply, mark as read), delete (no add)
    websiteSettings: ["view", "edit"], // Website Settings has view and edit (no add/delete)
    addAdminUser: ["view", "add", "edit", "delete"], // Add Admin User has all actions
    liveChat: ["view", "reply"] // Live Chat has view and reply (send messages to users)
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

      {/* Permission Warning - Show if user can view but not add */}
      {currentUser && canView(currentUser, 'addAdminUser') && !canAdd(currentUser, 'addAdminUser') && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                View Only Mode
              </h3>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                You have view permission but cannot add admin users. All form fields are disabled.
              </p>
            </div>
          </div>
        </div>
      )}

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
                  disabled={!canAdd(currentUser, 'addAdminUser')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={!canAdd(currentUser, 'addAdminUser')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={!canAdd(currentUser, 'addAdminUser')}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={!canAdd(currentUser, 'addAdminUser')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto scrollbar-hide">
                    {authors.map((author) => (
                      <label
                        key={author._id}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                          !canAdd(currentUser, 'addAdminUser')
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        } ${
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
                          disabled={!canAdd(currentUser, 'addAdminUser')}
                          className="w-4 h-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                
                {/* Show selected author name */}
                {formData.authorId && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                        Selected Author:
                      </span>
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        {authors.find(a => a._id === formData.authorId)?.name || "Unknown Author"}
                      </span>
                    </div>
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
                Select which actions this user can perform for each section:
              </p>
              <div className="space-y-4">
                {Object.entries(permissionLabels).map(([sectionKey, sectionLabel]) => {
                  // Initialize sectionPerms based on section type
                  let defaultPerms;
                  if (sectionKey === 'blogComments') {
                    defaultPerms = { view: false, reply: false, delete: false };
                  } else if (sectionKey === 'downloads') {
                    defaultPerms = { view: false, add: false, edit: false, delete: false, revoke: false };
                  } else if (sectionKey === 'liveChat') {
                    defaultPerms = { view: false, reply: false };
                  } else {
                    defaultPerms = { view: false, add: false, edit: false, delete: false };
                  }
                  const sectionPerms = formData.permissions[sectionKey] || defaultPerms;
                  const availableActions = sectionActions[sectionKey] || [];
                  
                  // Check if all available actions are checked
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
                              // Only update available actions
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
                            disabled={!canAdd(currentUser, 'addAdminUser')}
                            className="w-4 h-4 text-blue-600 dark:text-blue-500 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span>{sectionLabel}</span>
                        </label>
                      </div>
                      {availableActions.length > 0 && (
                        <div className={`grid gap-2 ml-6 ${availableActions.length === 1 ? 'grid-cols-1' : availableActions.length === 2 ? 'grid-cols-2' : availableActions.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                          {availableActions.map((actionKey) => (
                            <label
                              key={actionKey}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                sectionPerms[actionKey]
                                  ? "bg-blue-50 dark:bg-blue-900/30"
                                  : "bg-gray-50 dark:bg-gray-700/50"
                              } ${!canAdd(currentUser, 'addAdminUser') ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={sectionPerms[actionKey] || false}
                                onChange={() => handlePermissionChange(sectionKey, actionKey)}
                                disabled={!canAdd(currentUser, 'addAdminUser')}
                                className="w-3 h-3 text-blue-600 dark:text-blue-500 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={loading || !canAdd(currentUser, 'addAdminUser')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              title={!canAdd(currentUser, 'addAdminUser') ? "You don't have permission to add admin users" : "Create Admin User"}
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

