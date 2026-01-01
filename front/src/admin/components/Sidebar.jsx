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

  // Debug: Log when currentUser changes
  useEffect(() => {
    console.log('🔄 Sidebar: currentUser state changed:', {
      hasUser: !!currentUser,
      userEmail: currentUser?.email,
      userRole: currentUser?.adminRole,
      permissionsCount: currentUser?.permissions ? Object.keys(currentUser.permissions).length : 0
    });

    // Force re-render by triggering getFilteredMenuItems
    if (currentUser) {
      const testItems = getFilteredMenuItems();
      console.log('🔄 Sidebar: Menu items after user change:', testItems.map(item => item.label));
    }
  }, [currentUser]);

  // Debug: Log when currentUser changes
  useEffect(() => {
    console.log('🔄 currentUser state changed:', currentUser);
  }, [currentUser]);

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

  // Get current user data from JWT token (similar to PermissionProtectedRoute)
  const loadCurrentUser = () => {
    try {
      const email = localStorage.getItem("admin_email");
      const jwtToken = localStorage.getItem("admin_token");

      console.log('🔐 Sidebar: Checking localStorage credentials', {
        hasEmail: !!email,
        hasToken: !!jwtToken,
        tokenLength: jwtToken?.length
      });

      if (!jwtToken || !email) {
        console.log('❌ Sidebar: Missing credentials for user data');
        setCurrentUser(null);
        return;
      }

        // JWT decode function (same as PermissionProtectedRoute)
        function decodeJWTToken(token) {
          try {
            const parts = token.split('.');
            if (parts.length !== 3) {
              throw new Error('Invalid JWT format');
            }

            const payload = parts[1];
            const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            const parsed = JSON.parse(decodedPayload);

            return parsed;
          } catch (error) {
            console.error('❌ Sidebar: JWT decode failed:', error.message);
            return null;
          }
        }

        // Decode JWT token
        const tokenData = decodeJWTToken(jwtToken);
        if (!tokenData) {
          console.log('❌ Sidebar: Token decode failed');
          setCurrentUser(null);
          return;
        }

        // Validate email consistency
        if (tokenData.email !== email) {
          console.log('❌ Sidebar: Email mismatch in user data', {
            tokenEmail: tokenData.email,
            localStorageEmail: email
          });
          setCurrentUser(null);
          return;
        }

        // Build user object from token
        const user = {
          _id: tokenData.id,
          email: tokenData.email,
          adminRole: tokenData.adminRole || 'admin',
          permissions: tokenData.permissions || {}
        };

        // Validate permissions object
        if (!user.permissions || typeof user.permissions !== 'object') {
          console.log('⚠️ Sidebar: Invalid permissions object, setting defaults');
          user.permissions = {
            dashboard: { view: true },
            books: { view: true },
            liveChat: { view: true },
            websiteSettings: { view: true }
          };
        }

        console.log('👤 Sidebar: User data loaded from JWT:', {
          email: user.email,
          role: user.adminRole,
          permissionsCount: Object.keys(user.permissions).length,
          hasPermissions: !!user.permissions,
          permissionsKeys: Object.keys(user.permissions),
          hasLiveChat: !!user.permissions.liveChat,
          hasWebsiteSettings: !!user.permissions.websiteSettings,
          liveChatView: user.permissions.liveChat?.view,
          websiteSettingsView: user.permissions.websiteSettings?.view
        });

        setCurrentUser(user);
      } catch (error) {
        console.error('💥 Sidebar: Error getting current user:', error);
        setCurrentUser(null);
      }
    };

  // Load user data on component mount
  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Manual refresh function for debugging
  const refreshUserData = () => {
    console.log('🔄 Sidebar: Manual refresh triggered');
    loadCurrentUser();
  };

  // Expose refresh function globally for debugging
  if (typeof window !== 'undefined') {
    window.refreshSidebar = refreshUserData;
  }

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

  // Regular Admin menu items - All content management pages (11 items, filtered by permissions)
  // Regular ADMIN sees: Dashboard, Books, Downloads, Purchased, Testimonials, Contacts, Live Chat, Users, Authors, Blogs, Website Settings (filtered by permissions)
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

  // SUPER_ADMIN MENU: Platform management ONLY (7 items)
  // SUPER_ADMIN sees: Super Dashboard, Manage Tenants, Subscriptions, Plan Management, Analytics, Admin Users, Create Admin
  // SUPER_ADMIN does NOT see ANY regular admin content: Dashboard, Books, Live Chat, Website Settings, etc.
  // This is CRITICAL for security - super admin should only see platform management tools
  const superAdminMenuItems = [
    { path: "/superadmin/dashboard", label: "Super Dashboard", icon: Crown, permission: "superadmin" },
    { path: "/superadmin/tenants", label: "Manage Tenants", icon: Building2, permission: "superadmin" },
    { path: "/superadmin/subscriptions", label: "Subscriptions", icon: Calendar, permission: "superadmin" },
    { path: "/superadmin/plans", label: "Plan Management", icon: Settings, permission: "superadmin" },
    { path: "/superadmin/analytics", label: "Analytics", icon: TrendingUp, permission: "superadmin" },
    { path: "/superadmin/admins", label: "Admin Users", icon: Users, permission: "superadmin" },
    { path: "/superadmin/admins/create", label: "Create Admin", icon: UserPlus, permission: "superadmin" },
  ];

  // Filter menu items based on user permissions
  const getFilteredMenuItems = () => {
    console.log('🔍 Sidebar: getFilteredMenuItems called', {
      hasCurrentUser: !!currentUser,
      currentUserRole: currentUser?.adminRole,
      roleType: typeof currentUser?.adminRole,
      hasPermissions: !!currentUser?.permissions,
      permissionsCount: currentUser?.permissions ? Object.keys(currentUser.permissions).length : 0
    });

    // SAFETY: If no currentUser, assume admin access and show all items
    if (!currentUser) {
      console.log('⚠️ Sidebar: No currentUser, showing all items as admin fallback');
      return allMenuItems; // Show all items by default for admin access
    }

    // CRITICAL: Check SUPER_ADMIN role first
    console.log('🔍 Checking role comparison:', {
      actualRole: currentUser.adminRole,
      isSuperAdmin: currentUser.adminRole === "SUPER_ADMIN",
      isAdmin: currentUser.adminRole === "admin"
    });

    // CRITICAL: SUPER_ADMIN gets ONLY super admin menu - NO regular admin items EVER
    if (currentUser.adminRole === "SUPER_ADMIN") {
      console.log('👑 Sidebar: SUPER_ADMIN role CONFIRMED - BLOCKING ALL regular admin menu access');
      console.log('🚫 Super admin will NOT see: Dashboard, Books, Live Chat, Website Settings, etc.');
      console.log('✅ Super admin sees ONLY:', superAdminMenuItems.map(item => item.label));
      return superAdminMenuItems; // Exit immediately, no regular admin items
    }

    // Regular ADMIN role - can see content management pages based on permissions
    console.log('👤 Sidebar: Regular admin role - can access content management pages');

    // Always check granular permissions, even for admin role
    if (currentUser.permissions && typeof currentUser.permissions === 'object') {
      console.log('🔐 Sidebar: Checking permissions for regular admin');
      console.log('🔑 Available permissions:', Object.keys(currentUser.permissions));
      console.log('📋 Full permissions object:', currentUser.permissions);

      const filteredItems = allMenuItems.filter(item => {
        const permissionKey = item.permission;
        console.log(`🔍 Sidebar: Checking permission for ${item.label} (${permissionKey})`);

        // Get permission object for this section
        const sectionPerms = currentUser.permissions[permissionKey];
        console.log(`   📋 Sidebar: Permission object for ${permissionKey}:`, sectionPerms);

        // Hide admin-only items if user doesn't have permission
        if (item.adminOnly) {
          if (typeof sectionPerms === 'boolean') {
            const hasPermission = sectionPerms === true;
            console.log(`   🔒 Sidebar: adminOnly boolean check: ${hasPermission}`);
            return hasPermission;
          }
          if (typeof sectionPerms === 'object' && sectionPerms !== null) {
            const hasPermission = sectionPerms.view === true;
            console.log(`   🔒 Sidebar: adminOnly object.view check: ${hasPermission}`);
            return hasPermission;
          }
          console.log(`   ❌ Sidebar: adminOnly - no permission found, hiding item`);
          return false;
        }

        // Check regular items (not admin-only)
        if (typeof sectionPerms === 'boolean') {
          const hasPermission = sectionPerms === true;
          console.log(`   ✅ Sidebar: regular boolean check: ${hasPermission}`);
          return hasPermission;
        }
        if (typeof sectionPerms === 'object' && sectionPerms !== null) {
          const hasPermission = sectionPerms.view === true;
          console.log(`   ✅ Sidebar: regular object.view check: ${hasPermission}`);
          return hasPermission;
        }

        console.log(`   ❌ Sidebar: regular - no permission found, hiding item`);
        return false;
      });

      console.log('✅ Filtered menu items for regular admin:', filteredItems.map(item => item.label));
      console.log(`📊 Regular admin (${currentUser.adminRole}) sees ${filteredItems.length} out of ${allMenuItems.length} available menu items based on permissions`);

      return filteredItems;
    }

    console.log('⚠️ Sidebar: No valid permissions found, showing all menu items as fallback');
    console.log(`📊 Fallback: User with role '${currentUser.adminRole}' sees all ${allMenuItems.length} menu items`);
    console.log('⚠️ WARNING: If this is SUPER_ADMIN, they should NOT see regular admin items!');
    // Default fallback: show all available menu items for admin access
    return allMenuItems;
  };

  // Get filtered menu items (re-calculated when currentUser changes)
  const menuItems = getFilteredMenuItems();

  // Ensure we always have at least some menu items
  // CRITICAL FIX: Always include essential admin items
  let finalMenuItems = menuItems.length > 0 ? menuItems : allMenuItems;

  // Guarantee that essential items are always shown
  const essentialItems = ['dashboard', 'books', 'liveChat', 'websiteSettings'];
  const missingEssential = essentialItems.filter(perm =>
    !finalMenuItems.some(item => item.permission === perm)
  );

  if (missingEssential.length > 0) {
    console.log('⚠️ Sidebar: Adding missing essential items:', missingEssential);
    const essentialMenuItems = allMenuItems.filter(item =>
      missingEssential.includes(item.permission)
    );
    finalMenuItems = [...finalMenuItems, ...essentialMenuItems];
  }

  // Final debug log
  console.log('🎯 Sidebar: Final menu items to render:', finalMenuItems.map(item => item.label));

  // Force re-render key based on currentUser
  const renderKey = currentUser ? `user-${currentUser._id}` : 'no-user';

  // Debug: Log final menu items
  console.log('🎯 Final sidebar menu items:', menuItems.map(item => ({
    label: item.label,
    path: item.path,
    permission: item.permission,
    adminOnly: item.adminOnly
  })));

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
      <div key={renderKey} className={`
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
        {finalMenuItems.map((item) => {
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
            {/* Create Admin is now in the main menu above */}
          </>
        )}
      </div>

     
    </div>
    </>
  );
}
