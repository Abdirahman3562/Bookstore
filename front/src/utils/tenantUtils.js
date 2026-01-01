// Utility functions for multi-tenancy support

/**
 * Get the current tenant ID for API calls
 * Priority order:
 * 1. From logged-in user data (tenantId field)
 * 2. From localStorage (for public access)
 * 3. From URL parameters (for direct links)
 * 4. Default fallback (null - will be handled by backend middleware)
 */
export const getCurrentTenantId = () => {
  try {
    // 1. Check if user is logged in and has tenantId
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.tenantId) {
        return user.tenantId;
      }
    }

    // 2. Check localStorage for tenantId (set by previous visits or URL params)
    const storedTenantId = localStorage.getItem("tenantId");
    if (storedTenantId) {
      return storedTenantId;
    }

    // 3. Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tenantIdParam = urlParams.get("tenantId");
    if (tenantIdParam) {
      // Store it in localStorage for future use
      localStorage.setItem("tenantId", tenantIdParam);
      return tenantIdParam;
    }

    // 4. Check subdomain (if using subdomains for multi-tenancy)
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      // Extract tenant from subdomain (e.g., tenant1.example.com -> tenant1)
      const parts = hostname.split(".");
      if (parts.length > 2) {
        const subdomain = parts[0];
        if (subdomain !== "www") {
          localStorage.setItem("tenantId", subdomain);
          return subdomain;
        }
      }
    }

    // 5. Return null - backend middleware will handle default tenant for localhost
    return null;
  } catch (error) {
    console.error("Error getting tenant ID:", error);
    return null;
  }
};

/**
 * Get URL with tenantId parameter for API calls
 * @param {string} baseUrl - The base API URL
 * @param {string} tenantId - The tenant ID (optional, will get current if not provided)
 * @returns {string} - URL with tenantId parameter
 */
export const getTenantUrl = (baseUrl, tenantId = null) => {
  const currentTenantId = tenantId || getCurrentTenantId();
  if (currentTenantId) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}tenantId=${currentTenantId}`;
  }
  return baseUrl;
};

/**
 * Get fetch options with tenantId in headers for authenticated requests
 * @param {string} tenantId - The tenant ID (optional, will get current if not provided)
 * @returns {object} - Headers object with tenantId
 */
export const getTenantHeaders = (tenantId = null) => {
  const currentTenantId = tenantId || getCurrentTenantId();
  const headers = {};

  // Add Authorization header if token exists
  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Add tenantId to headers for additional security
  if (currentTenantId) {
    headers["X-Tenant-ID"] = currentTenantId;
  }

  return headers;
};




