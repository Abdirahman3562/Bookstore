import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Crown,
  Building2,
  Calendar,
  Settings,
  TrendingUp,
  Users,
  UserPlus,
  X,
  Globe
} from "lucide-react";
import axios from "axios";

export default function SuperAdminSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [websiteSettings, setWebsiteSettings] = useState({
    websiteName: "Super Admin Panel",
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('admin_dark_mode');
    return saved === 'true';
  });

  // Super Admin menu items - Platform management only
  const superAdminMenuItems = [
    { path: "/superadmin/dashboard", label: "Super Dashboard", icon: Crown, permission: "superadmin" },
    { path: "/superadmin/tenants", label: "Manage Tenants", icon: Building2, permission: "superadmin" },
    { path: "/superadmin/subscriptions", label: "Subscriptions", icon: Calendar, permission: "superadmin" },
    { path: "/superadmin/plans", label: "Plan Management", icon: Settings, permission: "superadmin" },
    { path: "/superadmin/analytics", label: "Analytics", icon: TrendingUp, permission: "superadmin" },
    { path: "/superadmin/admins", label: "Admin Users", icon: Users, permission: "superadmin" },
    { path: "/superadmin/admins/create", label: "Create Admin", icon: UserPlus, permission: "superadmin" },
  ];

  // Get current user data from JWT token
  useEffect(() => {
    const getCurrentUser = () => {
      try {
        const email = localStorage.getItem("admin_email");
        const jwtToken = localStorage.getItem("admin_token");

        console.log('🔐 SuperAdmin Sidebar: Checking localStorage credentials');

        if (!jwtToken || !email) {
          console.log('❌ SuperAdmin Sidebar: Missing credentials');
          setCurrentUser(null);
          return;
        }

        // JWT decode function
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
            console.error('❌ SuperAdmin Sidebar: JWT decode failed:', error.message);
            return null;
          }
        }

        // Decode JWT token
        const tokenData = decodeJWTToken(jwtToken);
        if (!tokenData) {
          console.log('❌ SuperAdmin Sidebar: Token decode failed');
          setCurrentUser(null);
          return;
        }

        // Validate email consistency
        if (tokenData.email !== email) {
          console.log('❌ SuperAdmin Sidebar: Email mismatch');
          setCurrentUser(null);
          return;
        }

        // Build user object from token
        const user = {
          _id: tokenData.id,
          email: tokenData.email,
          adminRole: tokenData.adminRole,
          permissions: tokenData.permissions || {}
        };

        console.log('👑 SuperAdmin Sidebar: User loaded -', {
          email: user.email,
          role: user.adminRole,
          isSuperAdmin: user.adminRole === "SUPER_ADMIN"
        });

        setCurrentUser(user);
      } catch (error) {
        console.error('💥 SuperAdmin Sidebar: Error getting current user:', error);
        setCurrentUser(null);
      }
    };

    getCurrentUser();
  }, []);

  // Fetch website settings (global settings for super admin)
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
            websiteName: response.data.data.websiteName || "Super Admin Panel",
          });
        }
      } catch (error) {
        console.error("Error fetching website settings:", error);
      }
    };

    fetchWebsiteSettings();
  }, []);

  // Listen for dark mode changes from top bar
  useEffect(() => {
    const checkDarkMode = () => {
      const mainDarkMode = localStorage.getItem('darkMode');
      const adminDarkMode = localStorage.getItem('admin_dark_mode');
      const saved = mainDarkMode || adminDarkMode;
      const isDark = saved === 'true';
      setDarkMode(isDark);
    };

    // Check initial state
    checkDarkMode();

    // Listen for storage changes (when top bar toggles dark mode)
    const handleStorageChange = (e) => {
      if (e.key === 'darkMode' || e.key === 'admin_dark_mode') {
        checkDarkMode();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom dark mode change events
    const handleDarkModeChange = () => checkDarkMode();
    window.addEventListener('darkModeChanged', handleDarkModeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('darkModeChanged', handleDarkModeChange);
    };
  }, []);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

        {/* Super Admin Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50
        w-64 h-screen flex flex-col border-r transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${darkMode
          ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-white border-gray-700'
          : 'bg-gradient-to-b from-purple-900 to-blue-900 text-white border-purple-800'
        }
      `}>

        {/* Header */}
        <div className={`px-4 py-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-purple-800'}`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Crown className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-yellow-400 truncate">
                Platform Manager
              </h2>
             
            </div>
          </div>
          <button
            onClick={onClose}
            className={`lg:hidden p-2 rounded-md transition-colors flex-shrink-0 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-800'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto scrollbar-hide mt-4">
          {superAdminMenuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-4 text-base font-medium transition-all duration-200 relative min-h-[56px]
                  ${isActive
                    ? "bg-yellow-600 text-white shadow-lg border-r-4 border-yellow-400"
                    : darkMode
                      ? "text-gray-300 hover:bg-gray-700 hover:text-white hover:translate-x-1"
                      : "text-purple-100 hover:bg-purple-800 hover:text-white hover:translate-x-1"
                  }`}
              >
                <item.icon size={18} className="flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-purple-800'}`}>
          <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-purple-300'}`}>
            <Crown className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Platform Manager</span>
          </div>
        </div>
      </div>
    </>
  );
}
