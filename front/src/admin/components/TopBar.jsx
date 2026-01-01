import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, User, Key, Bell, LogOut, Moon, Sun, Globe } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function TopBar() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [previousNotificationCount, setPreviousNotificationCount] = useState(0);
  const [websiteSettings, setWebsiteSettings] = useState({
    websiteName: "Admin Dashboard",
  });
  const [darkMode, setDarkMode] = useState(() => {
    // Default to false (light mode) - only enable if explicitly set to 'true'
    const saved = localStorage.getItem('admin_dark_mode');
    // Only return true if explicitly saved as 'true', otherwise default to light mode
    return saved === 'true';
  });

  const notificationSoundRef = useRef(null);

  // Request permission for browser notifications
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log("🔔 Browser notification permission:", permission);
      return permission;
    }
    return Notification.permission;
  };

  // Show browser notification
  const showBrowserNotification = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'bookstore-order',
        requireInteraction: false,
        silent: false
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Click handler
      notification.onclick = () => {
        window.focus();
        navigate('/admin/notifications');
        notification.close();
      };
    }
  };

  // Play notification sound using Web Audio API (simple beep)
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz beep
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Low volume
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log("🔊 Web Audio API not supported or error:", error.message);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const adminEmail = localStorage.getItem("admin_email");
      const token = localStorage.getItem("admin_token");

      if (token) {
        // Try to get current admin profile (includes avatar and updated data)
        try {
          console.log("🔍 fetchCurrentUser: Trying profile endpoint");
          const profileResponse = await axios.get("http://localhost:3000/api/admins/profile", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const admin = profileResponse.data.data;
          if (admin) {
            console.log("🔍 fetchCurrentUser: Found admin via profile API:", admin.name, admin._id);
            setCurrentUser(admin);
            return;
          }
        } catch (profileError) {
          console.log("🔍 fetchCurrentUser: Profile API failed, trying fallback methods");
        }

        // Fallback: Try to fetch from admins API first
        try {
          const adminsResponse = await axios.get("http://localhost:3000/api/admins", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const admins = adminsResponse.data.data || [];
          const admin = admins.find(a => a.email === adminEmail);
          if (admin) {
            console.log("🔍 fetchCurrentUser: Found admin in admins API:", admin.name, admin._id);
            setCurrentUser(admin);
            return;
          }
        } catch (error) {
          console.log("🔍 fetchCurrentUser: Admins API not available, trying users API");
        }

        // Final fallback to users API
        const usersResponse = await axios.get("http://localhost:3000/api/users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const users = usersResponse.data.data || [];
        const user = users.find(u => u.email === adminEmail);
        if (user) {
          console.log("🔍 fetchCurrentUser: Found user in users API:", user.name, user._id);
          setCurrentUser(user);
        } else {
          // If not found, create default admin object
          console.log("🔍 fetchCurrentUser: No user found, creating default");
          setCurrentUser({
            name: adminEmail ? adminEmail.split('@')[0] : "Admin",
            email: adminEmail || "admin@example.com",
            adminRole: "admin"
          });
        }
      } else {
        // No token stored, create default
        console.log("🔍 fetchCurrentUser: No token found, creating default");
        setCurrentUser({
          name: "Admin",
          email: "admin@example.com",
          adminRole: "admin"
        });
      }
    } catch (error) {
      console.error("🔍 fetchCurrentUser: Error fetching current user:", error);
      // Create fallback user
      setCurrentUser({
        name: "Admin",
        email: "admin@example.com",
        adminRole: "admin"
      });
    }
  };

  const fetchNotificationCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token || !currentUser) {
        console.log("🔍 fetchNotificationCount: No token or currentUser", { token: !!token, currentUser: !!currentUser });
        return;
      }

      console.log("🔍 fetchNotificationCount: Fetching pending orders count for admin");

      // Get read notifications from localStorage to exclude already reviewed orders
      const savedRead = localStorage.getItem('admin_read_notifications');
      const readNotifications = savedRead ? JSON.parse(savedRead) : [];

      // Get deleted notifications from localStorage
      const savedDeleted = localStorage.getItem('admin_deleted_notifications');
      const deletedNotifications = savedDeleted ? JSON.parse(savedDeleted) : [];

      // Count pending purchases (orders that need approval)
      try {
        const purchasesResponse = await axios.get("http://localhost:3000/api/purchased", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const purchases = purchasesResponse.data.data || [];
        const pendingPurchases = purchases.filter(p => p.status === "pending");

        console.log(`📦 Found ${pendingPurchases.length} total pending purchases`);

        // Count pending purchases that haven't been reviewed yet (not in read/deleted notifications)
        const unreviewedPendingPurchases = pendingPurchases.filter(p => {
          const notificationId = `purchase-${p._id}`;
          return !readNotifications.includes(notificationId) && !deletedNotifications.includes(notificationId);
        });

        const pendingCount = unreviewedPendingPurchases.length;
        console.log(`📦 Unreviewed pending purchases: ${pendingCount}`);

        // Check if there are new pending orders
        if (pendingCount > previousNotificationCount) {
          const newOrders = pendingCount - previousNotificationCount;
          console.log(`🔔 New pending orders detected: ${newOrders}`);

          // Removed toast notification as requested
          // toast.success(`${newOrders} new order${newOrders > 1 ? 's' : ''} need${newOrders === 1 ? 's' : ''} your approval!`, {
          //   duration: 5000,
          //   position: 'top-right',
          //   icon: '📋',
          // });

          // Show browser notification if permission granted
          showBrowserNotification(
            'New Orders Pending Approval',
            `${newOrders} order${newOrders > 1 ? 's need' : ' needs'} your approval`
          );

          // Removed sound notification as requested
          // playNotificationSound();
        }

        setPreviousNotificationCount(pendingCount);
        setNotificationCount(pendingCount);
        return;
      } catch (purchaseError) {
        console.error("❌ Error fetching pending purchases:", purchaseError);
        setNotificationCount(0);
      }

    } catch (error) {
      console.error("Error fetching notification count:", error);
      setNotificationCount(0);
    }
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
            websiteName: response.data.data.websiteName || "Admin Dashboard",
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

  useEffect(() => {
    fetchCurrentUser();

    // Request notification permission on mount
    requestNotificationPermission();

    // Listen for profile update events
    const handleProfileUpdate = (event) => {
      console.log("🔄 TopBar: Profile update event received", event.detail);
      // Update current user with new data
      if (event.detail) {
        console.log("🔄 TopBar: Updating currentUser with:", {
          name: event.detail.name,
          email: event.detail.email,
          avatar: event.detail.avatar ? "HAS_AVATAR" : "NO_AVATAR"
        });

        const updatedUser = {
          ...currentUser,
          name: event.detail.name || currentUser?.name,
          email: event.detail.email || currentUser?.email,
          avatar: event.detail.avatar || currentUser?.avatar
        };

        setCurrentUser(updatedUser);

        // Also update localStorage email if it changed
        if (event.detail.email) {
          localStorage.setItem("admin_email", event.detail.email);
        }

        // Refetch to get complete updated data after a short delay to ensure immediate UI update
        console.log("🔄 TopBar: Refetching current user data...");
        setTimeout(() => {
          fetchCurrentUser();
        }, 100);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Fetch notification count when currentUser is available
  useEffect(() => {
    console.log("🔍 useEffect: currentUser changed", currentUser?.name, currentUser?.adminRole, currentUser?._id);
    if (currentUser?.adminRole === "admin" || currentUser?.adminRole === "author") {
      console.log("🔍 useEffect: Calling fetchNotificationCount for admin/author");
      fetchNotificationCount();
      // Refresh notification count every 10 seconds for real-time updates
      const interval = setInterval(() => {
        fetchNotificationCount();
      }, 10000);
      
      // Listen for notification read events
      const handleNotificationRead = () => {
        fetchNotificationCount();
      };
      
      // Listen for notification deleted events
      const handleNotificationDeleted = () => {
        fetchNotificationCount();
      };
      
      window.addEventListener('notificationRead', handleNotificationRead);
      window.addEventListener('notificationDeleted', handleNotificationDeleted);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('notificationRead', handleNotificationRead);
        window.removeEventListener('notificationDeleted', handleNotificationDeleted);
      };
    } else {
      // Reset count if user is not admin/author
      setNotificationCount(0);
    }
  }, [currentUser]);

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
  };

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
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 hidden lg:flex">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {websiteSettings.websiteName}
          </h1>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle - ON/OFF Switch */}
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

        {/* Notification Icon with Badge */}
        {(currentUser?.adminRole === "admin" || currentUser?.adminRole === "author") && (
          <button
            onClick={() => {
              console.log("🔔 Notification icon clicked, navigating to /admin/notifications");
              navigate("/admin/notifications");
            }}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={`Pending Orders: ${notificationCount} orders need approval`}
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-800">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {(() => {
            const hasAvatar = currentUser?.avatar && 
                            typeof currentUser.avatar === 'string' && 
                            currentUser.avatar.trim() !== '' && 
                            currentUser.avatar !== 'null' && 
                            currentUser.avatar !== 'undefined';
            
            if (hasAvatar) {
              let avatarUrl = currentUser.avatar.trim();
              
              // If it's a base64 data URL, use it directly
              if (!avatarUrl.startsWith('data:') && !avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
                // Add base URL for relative paths
                avatarUrl = avatarUrl.startsWith('/') 
                  ? `http://localhost:3000${avatarUrl}`
                  : `http://localhost:3000/${avatarUrl}`;
              }
              
              return (
                <img
                  src={avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  onError={(e) => {
                    // If image fails to load, replace with initials
                    const initials = currentUser.name
                      ? currentUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : "A";
                    e.target.outerHTML = `<div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200 dark:border-gray-700">${initials}</div>`;
                  }}
                />
              );
            } else {
              return (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200 dark:border-gray-700">
                  {currentUser?.name
                    ? currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "A"}
                </div>
              );
            }
          })()}
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
                {currentUser?.adminRole && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      currentUser.adminRole === 'SUPER_ADMIN'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        : currentUser.adminRole === 'admin'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    }`}>
                      {currentUser.adminRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' :
                       currentUser.adminRole === 'admin' ? 'Admin' :
                       currentUser.adminRole === 'author' ? 'Author' :
                       currentUser.adminRole}
                    </span>
                  </div>
                )}
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

