import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, User, Crown, LogOut, Moon, Sun, Shield, Users } from "lucide-react";
import axios from "axios";

import { Menu } from "lucide-react";

export default function SuperAdminTopBar({ onMenuToggle }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [systemStats, setSystemStats] = useState({
    totalTenants: 0,
    totalAdmins: 0,
    loading: true,
    error: null
  });

  // Initialize stats on mount
  useEffect(() => {
    fetchSystemStats();
  }, []);
  const [darkMode, setDarkMode] = useState(() => {
    // Default to false (light mode) - only enable if explicitly set to 'true'
    const saved = localStorage.getItem('admin_dark_mode');
    // Only return true if explicitly saved as 'true', otherwise default to light mode
    return saved === 'true';
  });

  const fetchCurrentUser = async () => {
    try {
      const adminEmail = localStorage.getItem("admin_email");
      const token = localStorage.getItem("admin_token");

      if (adminEmail && token) {
        // For Super Admin, try to fetch from admins API
        try {
          const adminsResponse = await axios.get("http://localhost:3000/api/superadmin/admins", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const admins = adminsResponse.data.data || [];
          const admin = admins.find(a => a.email === adminEmail);
          if (admin) {
            setCurrentUser(admin);
            return;
          }
        } catch (error) {
          console.log("Super admin API not available, trying regular admins API");
        }

        // Fallback to regular admins API
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
          console.log("Admins API not available, creating default Super Admin");
        }

        // Create default Super Admin object if not found
        setCurrentUser({
          name: adminEmail.split('@')[0],
          email: adminEmail,
          adminRole: "SUPER_ADMIN"
        });
      } else {
        // No email stored, create default Super Admin
        setCurrentUser({
          name: "Super Admin",
          email: "superadmin@example.com",
          adminRole: "SUPER_ADMIN"
        });
      }
    } catch (error) {
      console.error("Error fetching current Super Admin user:", error);
      setCurrentUser({
        name: "Super Admin",
        email: "superadmin@example.com",
        adminRole: "SUPER_ADMIN"
      });
    }
  };

  const fetchSystemStats = async () => {
    try {
      setSystemStats(prev => ({ ...prev, loading: true, error: null }));

      const token = localStorage.getItem("admin_token");
      if (!token) {
        setSystemStats(prev => ({ ...prev, loading: false, error: "No authentication token" }));
        return;
      }

      // Fetch dashboard stats which include tenant and admin counts
      const response = await axios.get("http://localhost:3000/api/superadmin/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const stats = response.data.data;
        console.log('🔢 Super Admin System Stats:', {
          fullResponse: stats,
          tenants: stats.overview?.tenants?.total,
          admins: stats.overview?.platform?.admins
        });
        setSystemStats({
          totalTenants: stats.overview?.tenants?.total || 0,
          totalAdmins: stats.overview?.platform?.admins || 0,
          loading: false,
          error: null
        });
      } else {
        setSystemStats(prev => ({
          ...prev,
          loading: false,
          error: response.data.message || "Failed to fetch stats"
        }));
      }
    } catch (error) {
      console.error("Error fetching Super Admin system stats:", error);
      const errorMessage = error.response?.data?.message || error.message || "Network error";
      setSystemStats(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      console.log('🔄 SuperAdminTopBar: Profile update detected, refreshing user data');
      fetchCurrentUser();
    };

    window.addEventListener('superAdminProfileUpdated', handleProfileUpdate);

    // Also listen for storage changes (in case profile was updated in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'admin_token' || e.key === 'admin_email') {
        handleProfileUpdate();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Refresh stats every 60 seconds
    const interval = setInterval(() => {
      fetchSystemStats();
    }, 60000);

    return () => {
      window.removeEventListener('superAdminProfileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Initialize on mount - sync with main darkMode preference
  useEffect(() => {
    // Check main darkMode first, then admin_dark_mode
    const mainDarkMode = localStorage.getItem('darkMode');
    const adminDarkMode = localStorage.getItem('admin_dark_mode');

    // Use main darkMode if available, otherwise use admin_dark_mode
    const saved = mainDarkMode || adminDarkMode;
    const isDark = saved === 'true';

    // Apply dark mode if enabled
    if (isDark) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
      // Sync both keys
      localStorage.setItem('darkMode', 'true');
      localStorage.setItem('admin_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
      // Sync both keys
      localStorage.setItem('darkMode', 'false');
      if (adminDarkMode === null) {
        localStorage.setItem('admin_dark_mode', 'false');
      }
    }
  }, []);

  // Apply dark mode changes when state changes
  useEffect(() => {
    if (darkMode) {
      // Apply dark mode and sync both keys
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
      localStorage.setItem('admin_dark_mode', 'true');
    } else {
      // Remove dark mode and sync both keys
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
      localStorage.setItem('admin_dark_mode', 'false');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;

    // Update state
    setDarkMode(newDarkMode);

    // Immediately apply changes and sync both keys
    if (newDarkMode) {
      // Turn ON dark mode
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
      localStorage.setItem('admin_dark_mode', 'true');
    } else {
      // Turn OFF dark mode - ensure light mode
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
      localStorage.setItem('admin_dark_mode', 'false');
    }

    // Dispatch custom event to notify other components (like sidebar)
    window.dispatchEvent(new CustomEvent('darkModeChanged', {
      detail: { darkMode: newDarkMode }
    }));
  };

  const handleCloseMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowMenu(false);
      setIsClosing(false);
    }, 200); // Match the animation duration
  };

  const handleLogout = async () => {
    handleCloseMenu();

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
          console.log("✅ Super Admin loggedInStatus set to FALSE");
        } catch (error) {
          console.error("Error calling logout endpoint:", error);
          // Continue with logout even if API call fails
        }
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Delay redirect to allow animation to complete
      setTimeout(() => {
        // Save dark mode preference to main darkMode key before logout
        const adminDarkMode = localStorage.getItem('admin_dark_mode');
        if (adminDarkMode) {
          localStorage.setItem('darkMode', adminDarkMode);
        }

        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_email");
        window.location.href = "/admin";
      }, 250);
    }
  };

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-b border-yellow-200 dark:border-yellow-700 px-4 py-3 flex items-center justify-between shadow-sm min-h-[64px]">
      {/* Left side - Logo and System Stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4">
          {/* Super Admin Logo/Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <Crown className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
              <Shield className="w-3 h-3 text-yellow-500 dark:text-yellow-300 absolute -bottom-1 -right-1" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-yellow-800 dark:text-yellow-300 truncate">
                Super Admin
              </h1>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 hidden sm:block">
                Platform Management
              </p>
            </div>
          </div>

          {/* System Stats */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-yellow-200 dark:border-yellow-700">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {systemStats.loading ? '...' : systemStats.error ? '!' : (systemStats.totalTenants || 0)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Tenants</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-yellow-200 dark:border-yellow-700">
              <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {systemStats.loading ? '...' : systemStats.error ? '!' : (systemStats.totalAdmins || 0)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Admins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md hover:bg-white dark:hover:bg-gray-800 transition-colors border border-yellow-200 dark:border-yellow-700 bg-white dark:bg-gray-800 shadow-sm"
          aria-label="Toggle menu"
        >
          <Menu size={16} className="text-yellow-600 dark:text-yellow-400" />
        </button>

        {/* Dark Mode Toggle - ON/OFF Switch */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-yellow-700 dark:text-yellow-400">
            {darkMode ? 'ON' : 'OFF'}
          </span>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
              darkMode ? 'bg-yellow-600' : 'bg-gray-300'
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
          <span className="text-xs text-yellow-600 dark:text-yellow-400">
            {darkMode ? (
              <Sun className="w-4 h-4 text-yellow-500" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </span>
        </div>
      </div>

      {/* User Menu */}
      <div className="relative ml-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors border border-yellow-200 dark:border-yellow-700 bg-white dark:bg-gray-800 shadow-sm max-w-[200px]"
        >
          {/* Super Admin Avatar/Icon */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'block';
                }}
              />
            ) : null}
            <Crown
              className={`w-5 h-5 text-white ${currentUser?.avatar ? 'hidden' : ''}`}
              style={{ display: currentUser?.avatar ? 'none' : 'block' }}
            />
          </div>

          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300 truncate min-w-0 flex-1">
            {currentUser?.name || "Platform Manager"}
          </span>
          <ChevronDown
            size={16}
            className={`text-yellow-600 dark:text-yellow-400 transition-transform flex-shrink-0 ${showMenu ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Menu */}
        {(showMenu || isClosing) && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={handleCloseMenu}
            />
            <div className={`absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-yellow-200 dark:border-yellow-700 z-20 ${
              isClosing
                ? 'animate-out fade-out-0 zoom-out-95 duration-200'
                : 'animate-in fade-in-0 zoom-in-95 duration-200'
            }`}>
              <div className="p-3 sm:p-4 border-b border-yellow-200 dark:border-yellow-700 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <Crown
                      className={`w-6 h-6 text-white ${currentUser?.avatar ? 'hidden' : ''}`}
                      style={{ display: currentUser?.avatar ? 'none' : 'block' }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 truncate">
                      {currentUser?.name || "Platform Manager"}
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 truncate">
                      {currentUser?.email || "platform@example.com"}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-600">
                    <Crown size={12} />
                    SUPER_ADMIN
                  </span>
                </div>
              </div>

              {/* System Stats Section */}
              <div className="p-3 sm:p-4 border-b border-yellow-200 dark:border-yellow-700">
                <div className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-3 uppercase tracking-wide">
                  Platform Statistics
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-yellow-200 dark:border-yellow-600 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {systemStats.loading ? (
                        <div className="animate-pulse">...</div>
                      ) : systemStats.error ? (
                        <span className="text-red-500">!</span>
                      ) : (
                        systemStats.totalTenants
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {systemStats.loading ? 'Loading...' : systemStats.error ? 'Error' : 'Tenants'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {systemStats.loading ? '' : systemStats.error ? systemStats.error : 'Organizations'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-yellow-200 dark:border-yellow-600 shadow-sm">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {systemStats.loading ? (
                        <div className="animate-pulse">...</div>
                      ) : systemStats.error ? (
                        <span className="text-red-500">!</span>
                      ) : (
                        systemStats.totalAdmins
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {systemStats.loading ? 'Loading...' : systemStats.error ? 'Error' : 'Admins'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {systemStats.loading ? '' : systemStats.error ? systemStats.error : 'Administrators'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    handleCloseMenu();
                    setTimeout(() => navigate("/superadmin/profile"), 200);
                  }}
                  className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                >
                  <User size={16} />
                  My Profile
                </button>
              </div>

              <div className="border-t border-yellow-200 dark:border-yellow-700 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
