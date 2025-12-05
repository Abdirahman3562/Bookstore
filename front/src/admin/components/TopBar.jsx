import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, User, Key, Bell, LogOut, Moon, Sun } from "lucide-react";
import axios from "axios";

export default function TopBar() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    // Default to false (light mode) - only enable if explicitly set to 'true'
    const saved = localStorage.getItem('admin_dark_mode');
    // Only return true if explicitly saved as 'true', otherwise default to light mode
    return saved === 'true';
  });

  const fetchCurrentUser = async () => {
    try {
      const adminEmail = localStorage.getItem("admin_email");
      if (adminEmail) {
        // Try to fetch from admins API first
        try {
          const adminsResponse = await axios.get("http://localhost:3000/api/admins");
          const admins = adminsResponse.data.data || [];
          const admin = admins.find(a => a.email === adminEmail);
          if (admin) {
            setCurrentUser(admin);
            return;
          }
        } catch (error) {
          console.log("Admins API not available, trying users API");
        }

        // Fallback to users API
        const usersResponse = await axios.get("http://localhost:3000/api/users");
        const users = usersResponse.data.data || [];
        const user = users.find(u => u.email === adminEmail);
        if (user) {
          setCurrentUser(user);
        } else {
          // If not found, create default admin object
          setCurrentUser({
            name: adminEmail.split('@')[0],
            email: adminEmail,
            adminRole: "admin"
          });
        }
      } else {
        // No email stored, create default
        setCurrentUser({
          name: "Admin",
          email: "admin@example.com",
          adminRole: "admin"
        });
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      setCurrentUser({
        name: "Admin",
        email: "admin@example.com",
        adminRole: "admin"
      });
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    // Listen for profile update events
    const handleProfileUpdate = (event) => {
      // Update current user with new data
      if (event.detail) {
        setCurrentUser(prev => ({
          ...prev,
          name: event.detail.name || prev?.name,
          email: event.detail.email || prev?.email,
          avatar: event.detail.avatar || prev?.avatar
        }));
        // Also update localStorage email if it changed
        if (event.detail.email) {
          localStorage.setItem("admin_email", event.detail.email);
        }
        // Refetch to get complete updated data
        fetchCurrentUser();
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Initialize on mount - start with light mode by default
  useEffect(() => {
    // Always start by removing dark class to ensure light mode
    document.documentElement.classList.remove('dark');
    
    // Check if user has explicitly enabled dark mode
    const saved = localStorage.getItem('admin_dark_mode');
    const isDark = saved === 'true';
    
    // Only apply dark mode if explicitly enabled
    if (isDark) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    } else {
      // Ensure light mode (dark class removed)
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
      // Set localStorage to 'false' if not set
      if (saved === null) {
        localStorage.setItem('admin_dark_mode', 'false');
      }
    }
  }, []);

  // Apply dark mode changes when state changes
  useEffect(() => {
    if (darkMode) {
      // Only apply dark mode if explicitly ON
      document.documentElement.classList.add('dark');
      localStorage.setItem('admin_dark_mode', 'true');
    } else {
      // Remove dark mode and ensure light mode
      document.documentElement.classList.remove('dark');
      localStorage.setItem('admin_dark_mode', 'false');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    
    // Update state
    setDarkMode(newDarkMode);
    
    // Immediately apply changes
    if (newDarkMode) {
      // Turn ON dark mode
      document.documentElement.classList.add('dark');
      localStorage.setItem('admin_dark_mode', 'true');
    } else {
      // Turn OFF dark mode - ensure light mode
      document.documentElement.classList.remove('dark');
      localStorage.setItem('admin_dark_mode', 'false');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    window.location.href = "/admin";
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 flex items-center justify-between">
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white hidden lg:block">
          Admin Dashboard
        </h1>
      </div>

      {/* Dark Mode Toggle - ON/OFF Switch */}
      <div className="flex items-center gap-3 mr-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
            {darkMode ? 'ON' : 'OFF'}
          </span>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              darkMode ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            title={darkMode ? "Turn dark mode OFF" : "Turn dark mode ON"}
            aria-label={darkMode ? "Turn dark mode OFF" : "Turn dark mode ON"}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            {darkMode ? (
              <Sun className="w-4 h-4 text-yellow-500" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </span>
        </div>
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {currentUser?.name
                ? currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "A"}
            </div>
          )}
          <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentUser?.name || "Admin"}
          </span>
          <ChevronDown 
            size={16} 
            className={`text-gray-500 dark:text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currentUser?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {currentUser?.email || "admin@example.com"}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate("/admin/my-profile");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User size={16} />
                  My Profile
                </button>

                

                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate("/admin/notifications");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Bell size={16} />
                  Notifications
                </button>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

