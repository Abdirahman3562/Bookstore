import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { LogOut, X, UserPlus, Shield, Globe } from "lucide-react";
import { canView } from "../utils/permissions";
import {
  BarChart3,
  BookOpen,
  Download,
  ShoppingCart,
  MessageSquare,
  Users,
  PenTool,
  FileText,
  Settings,
  Mail,
  MessageCircle,
  Crown,
  Calendar,
  TrendingUp,
  Building2
} from "lucide-react";
import axios from "axios";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [websiteSettings, setWebsiteSettings] = useState({
    websiteName: "Admin Panel",
  });
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch website settings
  useEffect(() => {
    const fetchWebsiteSettings = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) return;

        const response = await axios.get("http://localhost:3000/api/website-settings", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setWebsiteSettings({
            websiteName: response.data.data.websiteName || "Admin Panel",
          });
        }
      } catch (error) {
        console.error("Error fetching website settings:", error);
      }
    };

    fetchWebsiteSettings();

    // Listen for website settings updates
    const handleSettingsUpdate = () => {
      fetchWebsiteSettings();
    };

    window.addEventListener("websiteSettingsUpdated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("websiteSettingsUpdated", handleSettingsUpdate);
    };
  }, []);

  // Fetch current admin user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const adminEmail = localStorage.getItem("admin_email");
        const token = localStorage.getItem("admin_token");
        
        if (token) {
          if (adminEmail) {
            // Try to find in Admin model first
            try {
              const adminsResponse = await axios.get("http://localhost:3000/api/admins", {
                headers: { Authorization: `Bearer ${token}` }
              });
              const admins = adminsResponse.data.data || [];
              const admin = admins.find(a => a.email === adminEmail);
              if (admin) {
                setCurrentUser(admin);
                return;
              }
            } catch (error) {
              console.log("Admins API not available, trying users API");
            }

            // Fallback to User model
            const usersResponse = await axios.get("http://localhost:3000/api/users", {
              headers: { Authorization: `Bearer ${token}` }
            });
            const users = usersResponse.data.data || [];
            const user = users.find(u => u.email === adminEmail);
            if (user) {
              setCurrentUser(user);
            } else {
              // If not found, assume it's from Admin model (legacy)
              setCurrentUser({
                adminRole: "admin",
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
              });
            }
          } else {
            // No admin_email stored, assume it's from Admin model (legacy admin)
            setCurrentUser({
              adminRole: "admin",
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
            });
          }
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        // On error, assume it's admin (fallback)
        setCurrentUser({
          adminRole: "admin",
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
        });
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch unread count for Live Chat
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) return;

        const response = await axios.get("http://localhost:3000/api/chat/unread-count", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setUnreadCount(response.data.data.unreadCount || 0);
          console.log(response.data.data.unreadCount);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    // Fetch immediately
    fetchUnreadCount();

    // Update every 2 seconds (real-time)
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const allMenuItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: BarChart3, permission: "dashboard" },
    { path: "/admin/books", label: "Books", icon: BookOpen, permission: "books" },
    { path: "/admin/downloads", label: "Downloads", icon: Download, permission: "downloads" },
    { path: "/admin/purchased", label: "Purchased", icon: ShoppingCart, permission: "purchased" },
    { path: "/admin/testimonials", label: "Testimonials", icon: MessageSquare, permission: "testimonials" },
    { path: "/admin/contacts", label: "Contacts", icon: Mail, permission: "contacts" },
    { path: "/admin/live-chat", label: "Live Chat", icon: MessageCircle, permission: "liveChat" },
    { path: "/admin/users", label: "Users", icon: Users, permission: "users" },
    { path: "/admin/authors", label: "Authors", icon: PenTool, permission: "authors" },
    { path: "/admin/blogs", label: "Blogs", icon: FileText, permission: "blogs" },
    { path: "/admin/website-settings", label: "Website Settings", icon: Settings, permission: "websiteSettings", adminOnly: true },
  ];

  // Super Admin menu items
  const superAdminMenuItems = [
    { path: "/superadmin/dashboard", label: "Super Dashboard", icon: Crown, permission: "superadmin" },
    { path: "/superadmin/tenants", label: "Manage Tenants", icon: Building2, permission: "superadmin" },
    { path: "/superadmin/subscriptions", label: "Subscriptions", icon: Calendar, permission: "superadmin" },
    { path: "/superadmin/plans", label: "Plan Management", icon: Settings, permission: "superadmin" },
    { path: "/superadmin/analytics", label: "Analytics", icon: TrendingUp, permission: "superadmin" },
    { path: "/superadmin/admins", label: "Admin Users", icon: Users, permission: "superadmin" },
  ];

  // Filter menu items based on user permissions
  const getFilteredMenuItems = () => {
    if (!currentUser) {
      // If no user data, show all (fallback)
      return allMenuItems;
    }

    // If SUPER_ADMIN, show Super Admin menu
    if (currentUser.adminRole === "SUPER_ADMIN") {
      return superAdminMenuItems;
    }

    // Always check granular permissions, even for admin role
    // Admin role doesn't automatically grant all permissions - must be explicitly set
    if (currentUser.permissions) {
      return allMenuItems.filter(item => {
        // Hide admin-only items if user doesn't have permission
        if (item.adminOnly) {
          const sectionPerms = currentUser.permissions[item.permission];
          if (typeof sectionPerms === 'boolean') {
            return sectionPerms === true;
          }
          if (typeof sectionPerms === 'object' && sectionPerms !== null) {
            return sectionPerms.view === true;
          }
          return false;
        }
        // Check if permission is explicitly set to true (for view access)
        const sectionPerms = currentUser.permissions[item.permission];
        if (typeof sectionPerms === 'boolean') {
          return sectionPerms === true;
        }
        if (typeof sectionPerms === 'object' && sectionPerms !== null) {
          return sectionPerms.view === true;
        }
        return false;
      });
    }

    // Default: show only blogs if no permissions set
    return allMenuItems.filter(item => item.permission === "blogs" && !item.adminOnly);
  };

  const menuItems = getFilteredMenuItems();

  const handleLogout = async () => {
    try {
      // Get admin token before clearing localStorage
      const adminToken = localStorage.getItem("admin_token");
      
      // Call logout endpoint to set loggedInStatus to false
      if (adminToken) {
        try {
          await axios.post("http://localhost:3000/api/auth/logout", {
            token: adminToken
          }, {
            headers: {
              Authorization: `Bearer ${adminToken}`
            }
          });
          console.log("✅ Admin loggedInStatus set to FALSE");
        } catch (error) {
          console.error("Error calling logout endpoint:", error);
          // Continue with logout even if API call fails
        }
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Save dark mode preference to main darkMode key before logout
      const adminDarkMode = localStorage.getItem('admin_dark_mode');
      if (adminDarkMode) {
        localStorage.setItem('darkMode', adminDarkMode);
      }
      
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_email");
      window.location.href = "/admin";
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50
        w-64 bg-gray-900 dark:bg-gray-800 text-white h-screen flex flex-col border-r border-gray-800 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-800 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400 dark:text-blue-500" />
            <h2 className="text-xl font-bold text-blue-400 dark:text-blue-500">{websiteSettings.websiteName}</h2>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto scrollbar-hide mt-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isLiveChat = item.path === "/admin/live-chat";

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center justify-between gap-3 px-6 py-3 text-sm font-medium transition relative
                ${isActive
                  ? "bg-blue-600 dark:bg-blue-700 text-white"
                  : "text-gray-300 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-700 hover:text-white"
                }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <item.icon size={18} />
                <span className="truncate">{item.label}</span>
              </div>
              {/* Unread count badge for Live Chat - Right side */}
              {isLiveChat && unreadCount >= 0 && (
                <span className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[22px] h-[22px] flex items-center justify-center flex-shrink-0 ml-2 relative z-10 shadow-lg ring-2 ring-white dark:ring-gray-800">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Author Users Management - Only visible if user has view permission (not for SUPER_ADMIN) */}
        {currentUser && currentUser.adminRole !== "SUPER_ADMIN" && canView(currentUser, 'addAdminUser') && (
          <>
            <Link
              to="/admin/author-users"
              onClick={onClose}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition mt-2
                ${location.pathname === "/admin/admin-users"
                  ? "bg-blue-600 dark:bg-blue-700 text-white"
                  : "text-gray-300 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-700 hover:text-white"
                }`}
            >
              <Shield size={18} />
              Author Users List
            </Link>
            <Link
              to="/admin/add-author-user"
              onClick={onClose}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition
                ${location.pathname === "/admin/add-admin-user"
                  ? "bg-blue-600 dark:bg-blue-700 text-white"
                  : "text-gray-300 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-700 hover:text-white"
                }`}
            >
              <UserPlus size={18} />
              Add Author User
            </Link>
          </>
        )}

        {/* Super Admin Actions */}
        {currentUser && currentUser.adminRole === "SUPER_ADMIN" && (
          <>
            <Link
              to="/superadmin/admins/create"
              onClick={onClose}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition mt-2
                ${location.pathname === "/superadmin/admins/create"
                  ? "bg-blue-600 dark:bg-blue-700 text-white"
                  : "text-gray-300 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-700 hover:text-white"
                }`}
            >
              <UserPlus size={18} />
              Create Admin
            </Link>
          </>
        )}
      </div>

     
    </div>
    </>
  );
}
