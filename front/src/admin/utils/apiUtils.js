import axios from "axios";
import toast from "react-hot-toast";

// Utility function for automatic logout
export const performAutoLogout = async (reason = "Session expired") => {
  try {
    const adminToken = localStorage.getItem("admin_token");

    if (adminToken) {
      try {
        await axios.post("http://localhost:3000/api/auth/logout", {
          token: adminToken
        }, {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        });
        console.log("✅ Admin loggedInStatus set to FALSE (auto-logout)");
      } catch (error) {
        console.error("Error calling logout endpoint during auto-logout:", error);
      }
    }
  } catch (error) {
    console.error("Error during auto-logout:", error);
  } finally {
    // Save dark mode preference
    const adminDarkMode = localStorage.getItem('admin_dark_mode');
    if (adminDarkMode) {
      localStorage.setItem('darkMode', adminDarkMode);
    }

    // Clear session data
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");

    // Show logout reason
    toast.error(`Logged out: ${reason}`, { duration: 5000 });

    // Redirect to login
    window.location.href = "/admin";
  }
};

// Utility function for consistent error handling
// Only shows toast errors for real system failures, not empty data
export const handleApiError = (error, context = "data") => {
  // Don't show errors for empty data arrays - this is normal for new admins
  if (error.response?.status === 200 && Array.isArray(error.response?.data?.data) && error.response.data.data.length === 0) {
    console.log(`ℹ️ ${context} is empty (normal for new admins/tenants)`);
    return;
  }

  // Only show toast errors for real system failures
  if (error.response?.status >= 500 || error.response?.status === 401 || error.response?.status === 403) {
    console.error(`❌ Error loading ${context}:`, error);
    toast.error(`Failed to load ${context}`);
  } else if (!error.response) {
    // Network errors
    console.error(`❌ Network error loading ${context}:`, error);
    toast.error(`Failed to load ${context} - network error`);
  } else {
    // Other client errors (4xx except 401/403) - log but don't show toast
    console.log(`ℹ️ ${context} request returned ${error.response.status} - ${error.response.data?.message || 'No message'}`);
  }
};

// Setup axios interceptors for automatic logout on subscription expiry
export const setupAxiosInterceptors = () => {
  // Response interceptor
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response) {
        const { status, data } = error.response;

        // Check for subscription expiry logout requirement
        if (data.action === "logout_required" ||
            (status === 402 && data.message?.includes("expired"))) {
          console.log("Subscription expired - performing auto-logout");
          performAutoLogout("Your subscription has expired. Please renew to continue.");
          return Promise.reject(error);
        }

        // Check for tenant inactive status
        if (status === 403 && data.message?.includes("inactive")) {
          console.log("Tenant subscription cancelled - performing auto-logout");
          performAutoLogout("Your subscription has been cancelled.");
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
  );
};

