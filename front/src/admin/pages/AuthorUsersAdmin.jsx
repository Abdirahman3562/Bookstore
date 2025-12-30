import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Shield, RotateCcw, Edit, X, Save, UserPlus, Check, Eye, EyeOff, Key, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentAdminUser, canView, canAdd, canEdit, canDelete } from "../utils/permissions";
import DataTable from "../components/DataTable";

export default function AuthorUsersAdmin() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    password: "",
    adminRole: "author",
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
        contacts: { view: false, add: false, edit: false, delete: false },
        blogComments: { view: false, reply: false, delete: false },
      websiteSettings: { view: false, add: false, edit: false, delete: false },
      addAdminUser: { view: false, add: false, edit: false, delete: false },
      liveChat: { view: false, reply: false }
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, admin: null });
  const [deleting, setDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [previousAuthorId, setPreviousAuthorId] = useState(""); // Store previous authorId when switching to admin

  // Fetch author users created by current admin
  const fetchAdmins = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      }

      // Get admin token for authentication
      const token = localStorage.getItem("admin_token");
      if (!token) {
        navigate("/admin");
        return;
      }

      // First get current admin user to filter by creator
      const currentAdmin = await getCurrentAdminUser();
      if (!currentAdmin) {
        setAdmins([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await axios.get("http://localhost:3000/api/admins", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allAdmins = response.data.data || [];

      // Filter to only show author users created by current admin
      const authorUsers = allAdmins.filter(admin =>
        admin.adminRole === 'author' && admin.createdBy === currentAdmin._id
      );

      setAdmins(authorUsers);
      setLastUpdated(new Date().toLocaleString());

      if (showRefreshIndicator) {
        toast.success("Author users data refreshed!");
      }
    } catch (error) {
      console.error("Error fetching author users:", error);
      toast.error("Failed to load author users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch authors data
  const fetchAuthors = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      const response = await axios.get("http://localhost:3000/api/authors", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data.data || [];
      setAuthors(data);
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  // Handle role change in edit form - only author role is available
  const handleRoleChange = (role) => {
    setEditFormData((prev) => ({
      ...prev,
      adminRole: role
      // Keep existing permissions - don't auto-set
    }));
  };

  // Handle permission change in edit form
  const handlePermissionChange = (section, action) => {
    setEditFormData((prev) => ({
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

  // Convert old boolean permissions to new granular format
  const normalizePermissions = (perms) => {
    if (!perms) {
      return {
        dashboard: { view: false, add: false, edit: false, delete: false },
        books: { view: false, add: false, edit: false, delete: false },
        downloads: { view: false, add: false, edit: false, delete: false, revoke: false },
        purchased: { view: false, add: false, edit: false, delete: false },
        testimonials: { view: false, add: false, edit: false, delete: false },
        users: { view: false, add: false, edit: false, delete: false },
        authors: { view: false, add: false, edit: false, delete: false },
        blogs: { view: false, add: false, edit: false, delete: false },
        contacts: { view: false, add: false, edit: false, delete: false },
        websiteSettings: { view: false, add: false, edit: false, delete: false },
        addAdminUser: { view: false, add: false, edit: false, delete: false },
        liveChat: { view: false, reply: false }
      };
    }

    const normalized = {};
    const sections = ['dashboard', 'books', 'downloads', 'purchased', 'testimonials', 'users', 'authors', 'blogs', 'blogComments', 'contacts', 'websiteSettings', 'liveChat'];
    
    sections.forEach(section => {
      const sectionPerm = perms[section];
      if (typeof sectionPerm === 'boolean') {
        // Old format - convert to granular
        if (section === 'downloads') {
          normalized[section] = {
            view: sectionPerm,
            add: sectionPerm,
            edit: sectionPerm,
            delete: sectionPerm,
            revoke: sectionPerm
          };
        } else if (section === 'blogComments') {
          // Blog Comments has view, reply, delete (no add)
          normalized[section] = {
            view: sectionPerm,
            reply: sectionPerm,
            delete: sectionPerm
          };
        } else if (section === 'liveChat') {
          // Live Chat has view, reply
          normalized[section] = {
            view: sectionPerm,
            reply: sectionPerm
          };
        } else {
          normalized[section] = {
            view: sectionPerm,
            add: sectionPerm,
            edit: sectionPerm,
            delete: sectionPerm
          };
        }
      } else if (typeof sectionPerm === 'object' && sectionPerm !== null) {
        // New format - use as is
        if (section === 'downloads') {
          normalized[section] = {
            view: sectionPerm.view || false,
            add: sectionPerm.add || false,
            edit: sectionPerm.edit || false,
            delete: sectionPerm.delete || false,
            revoke: sectionPerm.revoke || false
          };
        } else if (section === 'blogComments') {
          // Blog Comments has view, reply, delete (no add)
          normalized[section] = {
            view: sectionPerm.view || false,
            reply: sectionPerm.reply || false,
            delete: sectionPerm.delete || false
          };
        } else if (section === 'liveChat') {
          // Live Chat has view, reply
          normalized[section] = {
            view: sectionPerm.view || false,
            reply: sectionPerm.reply || false
          };
        } else {
          normalized[section] = {
            view: sectionPerm.view || false,
            add: sectionPerm.add || false,
            edit: sectionPerm.edit || false,
            delete: sectionPerm.delete || false
          };
        }
      } else {
        // For downloads, include revoke field
        if (section === 'downloads') {
          normalized[section] = { view: false, add: false, edit: false, delete: false, revoke: false };
        } else if (section === 'blogComments') {
          // Blog Comments has view, reply, delete (no add)
          normalized[section] = { view: false, reply: false, delete: false };
        } else if (section === 'liveChat') {
          // Live Chat has view, reply
          normalized[section] = { view: false, reply: false };
        } else {
          normalized[section] = { view: false, add: false, edit: false, delete: false };
        }
      }
    });

    // Handle addAdminUser - convert to granular if needed
    if (typeof perms.addAdminUser === 'boolean') {
      normalized.addAdminUser = {
        view: perms.addAdminUser,
        add: perms.addAdminUser,
        edit: perms.addAdminUser,
        delete: perms.addAdminUser
      };
    } else if (typeof perms.addAdminUser === 'object' && perms.addAdminUser !== null) {
      normalized.addAdminUser = {
        view: perms.addAdminUser.view || false,
        add: perms.addAdminUser.add || false,
        edit: perms.addAdminUser.edit || false,
        delete: perms.addAdminUser.delete || false
      };
    } else {
      normalized.addAdminUser = { view: false, add: false, edit: false, delete: false };
    }
    
    return normalized;
  };

  // Open edit modal
  const openEditModal = async (admin) => {
    setEditingAdmin(admin);
    
    // Fetch the full admin data including password
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        navigate("/admin");
        return;
      }

      const response = await axios.get(`http://localhost:3000/api/admins/${admin._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fullAdmin = response.data.data || admin;
      
      // Normalize permissions to ensure correct format
      const normalizedPerms = normalizePermissions(fullAdmin.permissions || admin.permissions);
      
      // Ensure authorId is properly set (can be null, undefined, or empty string)
      const authorIdValue = fullAdmin.authorId || admin.authorId || "";
      
      console.log("Editing admin:", {
        name: fullAdmin.name || admin.name,
        authorId: authorIdValue,
        permissions: normalizedPerms,
        liveChat: normalizedPerms.liveChat
      });
      
      // Store the authorId as previous when opening modal
      setPreviousAuthorId(authorIdValue);
      
      setEditFormData({
        name: fullAdmin.name || admin.name || "",
        email: fullAdmin.email || admin.email || "",
        password: fullAdmin.password || "", // Show current password
        adminRole: fullAdmin.adminRole || admin.adminRole || "author",
        authorId: authorIdValue, // Get authorId - ensure it's set properly
        permissions: normalizedPerms
      });
      setShowPassword(true); // Show password by default so they can see it
    } catch (error) {
      console.error("Error fetching admin details:", error);
      // Fallback to admin data without password
      const normalizedPerms = normalizePermissions(admin.permissions || {});
      const authorIdValue = admin.authorId || "";
      
      // Store the authorId as previous when opening modal
      setPreviousAuthorId(authorIdValue);
      
      setEditFormData({
        name: admin.name || "",
        email: admin.email || "",
        password: "", // Empty if can't fetch
        adminRole: admin.adminRole || "author",
        authorId: authorIdValue, // Get authorId - ensure it's set properly
        permissions: normalizedPerms
      });
      setShowPassword(false);
    }
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingAdmin(null);
    setPreviousAuthorId(""); // Reset previous authorId
    setEditFormData({
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
    setShowPassword(false);
  };

  // Open delete modal
  const openDeleteModal = (admin) => {
    setDeleteModal({ show: true, admin });
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModal({ show: false, admin: null });
  };

  // Delete admin
  const handleDelete = async () => {
    if (!deleteModal.admin) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        navigate("/admin");
        return;
      }

      await axios.delete(`http://localhost:3000/api/admins/${deleteModal.admin._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Admin user deleted successfully!");
      closeDeleteModal();
      await fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete admin user";
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  // Save admin updates
  const handleSave = async () => {
    if (!editingAdmin) return;

    setSaving(true);
    try {
      // Get admin token for authentication
      const token = localStorage.getItem("admin_token");
      if (!token) {
        navigate("/admin");
        return;
      }

      const updateData = {
        name: editFormData.name,
        email: editFormData.email,
        adminRole: editFormData.adminRole,
        authorId: editFormData.authorId || null, // Include authorId
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
          const currentAdminResponse = await axios.get(`http://localhost:3000/api/admins/${editingAdmin._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const currentAdmin = currentAdminResponse.data.data;
          if (currentAdmin && currentAdmin.password) {
            updateData.password = currentAdmin.password; // Keep current password
          }
        } catch (error) {
          console.error("Error fetching current password:", error);
          // If we can't fetch, don't include password - backend should handle it
        }
      }

      await axios.put(`http://localhost:3000/api/admins/${editingAdmin._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
    fetchAuthors();
    
    // Get current admin user for permission checks
    const loadCurrentUser = async () => {
      const user = await getCurrentAdminUser();
      setCurrentUser(user);
    };
    loadCurrentUser();
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
    blogComments: "Blog Comments",
    contacts: "Contacts",
    websiteSettings: "Website Settings",
    addAdminUser: "Add Author User",
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
    addAdminUser: ["view", "add", "edit", "delete"], // Add Author User has all actions
    liveChat: ["view", "reply"] // Live Chat has view and reply (send messages to users)
  };

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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin users...</p>
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
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Author Users Management</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                Last updated: {currentTime}
              </span>
            )}
            <button
              onClick={() => navigate("/admin/add-author-user")}
              disabled={!canAdd(currentUser, 'addAdminUser')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 dark:disabled:hover:bg-blue-700"
              title={!canAdd(currentUser, 'addAdminUser') ? "You don't have permission to add author users" : "Add Author User"}
            >
              <UserPlus className="w-4 h-4" />
              Add Author User
            </button>
            <button
              onClick={() => fetchAdmins(true)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors text-gray-700 dark:text-gray-300 w-full sm:w-auto"
              title="Refresh author users data"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Manage author user accounts that you have created</p>
      </div>

      {/* Admins Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-6">
          <h2 className="text-xl font-semibold text-white">Admin User Accounts</h2>
        </div>

        <div className="p-6">
          {admins.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No author users found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Admin user accounts will appear here when created.</p>
              <button
                onClick={() => navigate("/admin/add-author-user")}
                disabled={!canAdd(currentUser, 'addAdminUser')}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 dark:disabled:hover:bg-blue-700"
                title={!canAdd(currentUser, 'addAdminUser') ? "You don't have permission to add author users" : "Add Author User"}
              >
                <UserPlus className="w-4 h-4" />
                Add Author User
              </button>
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  header: "Admin User",
                  accessor: "admin",
                  cell: (admin) => (
                    <div className="flex items-center gap-3">
                      {admin.avatar ? (
                        <img
                          src={admin.avatar}
                          alt={admin.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 flex-shrink-0"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=3B82F6&color=fff&size=128`;
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
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
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{admin.name}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">{admin.email}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Role",
                  accessor: "role",
                  cell: (admin) => (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      admin.adminRole === 'admin'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    }`}>
                      {admin.adminRole || 'author'}
                    </span>
                  ),
                },
                {
                  header: "Permissions",
                  accessor: "permissions",
                  cell: (admin) => (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(permissionLabels).map(([key, label]) => {
                        const sectionPerms = admin.permissions && admin.permissions[key];
                        if (sectionPerms) {
                          if (typeof sectionPerms === 'boolean' && sectionPerms) {
                            return (
                              <span
                                key={key}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              >
                                {label}
                              </span>
                            );
                          }
                          if (typeof sectionPerms === 'object') {
                            const actions = [];
                            if (sectionPerms.view) actions.push('V');
                            if (sectionPerms.add) actions.push('A');
                            if (sectionPerms.edit) actions.push('E');
                            if (sectionPerms.delete) actions.push('D');
                            if (sectionPerms.revoke) actions.push('R');
                            if (sectionPerms.reply) actions.push('Reply');
                            
                            if (actions.length > 0) {
                              return (
                                <span
                                  key={key}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                  title={`${label}: ${actions.join(', ')}`}
                                >
                                  {label} ({actions.join(', ')})
                                </span>
                              );
                            }
                          }
                        }
                        return null;
                      })}
                    </div>
                  ),
                },
                {
                  header: "Actions",
                  accessor: "actions",
                  cell: (admin) => (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(admin);
                        }}
                        disabled={!canEdit(currentUser, 'addAdminUser') || admin.createdBy !== currentUser?._id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 dark:disabled:hover:bg-blue-700"
                        title={
                          admin.createdBy !== currentUser?._id
                            ? "You can only edit author users you created"
                            : !canEdit(currentUser, 'addAdminUser')
                            ? "You don't have permission to edit admin users"
                            : "Edit"
                        }
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(admin);
                        }}
                        disabled={!canDelete(currentUser, 'addAdminUser') || admin.createdBy !== currentUser?._id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600 dark:disabled:hover:bg-red-700"
                        title={
                          admin.createdBy !== currentUser?._id
                            ? "You can only delete author users you created"
                            : !canDelete(currentUser, 'addAdminUser')
                            ? "You don't have permission to delete admin users"
                            : "Delete"
                        }
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  ),
                },
              ]}
              data={admins}
              itemsPerPage={10}
              emptyMessage="No author users found"
              emptyIcon={Shield}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingAdmin && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-40"
            onClick={closeEditModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Edit Admin User
                </h2>
                <button
                  onClick={closeEditModal}
                  className="text-white hover:text-gray-200 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
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
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Admin Role *
                      </label>
                      <select
                        required
                        value={editFormData.adminRole}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="author">Author</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Author role with limited access based on selected permissions
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-[14px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Key className="w-4 h-4" />
                        New Password (leave blank to keep current)
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={editFormData.password}
                          onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder="Enter new password (min 6 characters)"
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Leave blank to keep the current password unchanged
                      </p>
                    </div>
                  </div>

                  {/* Author Selection - Only show when role is "author" */}
                  {editFormData.adminRole === "author" && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Link to Author Profile
                      </h3>
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
                            {authors.map((author) => {
                              // Convert both to strings for proper comparison
                              const currentAuthorId = String(editFormData.authorId || "");
                              const authorIdValue = String(author._id || "");
                              const isSelected = currentAuthorId === authorIdValue;
                              
                              return (
                              <label
                                key={author._id}
                                className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600"
                                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="authorId"
                                  value={author._id}
                                  checked={isSelected}
                                  onChange={(e) => setEditFormData({ ...editFormData, authorId: e.target.value })}
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
                              );
                            })}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                          This will link the admin user to the selected author profile. When this author logs in, they will see comments on their blogs.
                        </p>
                      </div>
                    </div>
                  )}

                 
                </div>

                {/* Permissions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Permissions
                  </h3>
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
                        const sectionPerms = editFormData.permissions[sectionKey] || defaultPerms;
                        const availableActions = sectionActions[sectionKey] || [];
                        
                        // Check if all available actions are checked (use Boolean to ensure proper check)
                        const allChecked = availableActions.length > 0 && availableActions.every(action => Boolean(sectionPerms[action]) === true);

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
                                    setEditFormData(prev => ({
                                      ...prev,
                                      permissions: {
                                        ...prev.permissions,
                                        [sectionKey]: updatedPerms
                                      }
                                    }));
                                  }}
                                  className="w-4 h-4 text-blue-600 dark:text-blue-500 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span>{sectionLabel}</span>
                              </label>
                            </div>
                            {availableActions.length > 0 && (
                              <div className={`grid gap-2 ml-6 ${availableActions.length === 1 ? 'grid-cols-1' : availableActions.length === 2 ? 'grid-cols-2' : availableActions.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                                {availableActions.map((actionKey) => {
                                  // Ensure boolean value for checkbox
                                  const isChecked = Boolean(sectionPerms[actionKey]);
                                  
                                  return (
                                  <label
                                    key={actionKey}
                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                      isChecked
                                        ? "bg-blue-50 dark:bg-blue-900/30"
                                        : "bg-gray-50 dark:bg-gray-700/50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handlePermissionChange(sectionKey, actionKey)}
                                      className="w-3 h-3 text-blue-600 dark:text-blue-500 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                      {actionLabels[actionKey]}
                                    </span>
                                  </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
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

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.admin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-red-600 dark:bg-red-700 p-6 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Delete Admin User</h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete <span className="font-semibold">{deleteModal.admin.name}</span> ({deleteModal.admin.email})?
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                This action cannot be undone. All permissions and settings for this admin user will be permanently deleted.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

