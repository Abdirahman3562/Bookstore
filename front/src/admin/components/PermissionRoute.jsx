import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { canView } from "../utils/permissions";

// FORCE CACHE CLEAR - BRAND NEW FILE v3.0
console.log('🔥🔥🔥 BRAND NEW PermissionRoute.jsx v3.0 🔥🔥🔥');

// JWT decode function - completely new
function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(decoded);

    console.log('🎯 Token decoded:', {
      id: data.id,
      email: data.email,
      role: data.adminRole,
      permissions: data.permissions
    });

    return data;
  } catch (error) {
    console.error('❌ Token decode error:', error.message);
    return null;
  }
}

// Route permission mapping
const PERMISSION_MAP = {
  "/admin/dashboard": "dashboard",
  "/admin/books": "books",
  "/admin/downloads": "downloads",
  "/admin/purchased": "purchased",
  "/admin/testimonials": "testimonials",
  "/admin/users": "users",
  "/admin/authors": "authors",
  "/admin/blogs": "blogs",
  "/admin/contacts": "contacts",
  "/admin/website-settings": "websiteSettings",
  "/admin/add-author-user": "addAdminUser",
  "/admin/author-users": "addAdminUser"
};

// Public routes
const PUBLIC_PATHS = [
  "/admin/my-profile",
  "/admin/notifications"
];

function PermissionRoute({ children, requiredPermission }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [canAccess, setCanAccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    console.log('🚦 Checking permissions for:', location.pathname);

    const checkAccess = () => {
      try {
        const email = localStorage.getItem("admin_email");
        const token = localStorage.getItem("admin_token");

        console.log('🔑 Checking credentials:', {
          hasEmail: !!email,
          hasToken: !!token,
          tokenLen: token?.length
        });

        // No credentials
        if (!token || !email) {
          console.log('❌ No credentials found');
          setCanAccess(false);
          setChecking(false);
          return;
        }

        // Invalid token
        if (token.length < 50) {
          console.log('❌ Invalid token, clearing');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_email');
          setCanAccess(false);
          setChecking(false);
          return;
        }

        // Decode token
        const tokenData = decodeToken(token);
        if (!tokenData) {
          console.log('❌ Token decode failed');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_email');
          setCanAccess(false);
          setChecking(false);
          return;
        }

        // Check expiration
        const now = Date.now() / 1000;
        if (tokenData.exp && tokenData.exp < now) {
          console.log('⏰ Token expired');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_email');
          setCanAccess(false);
          setChecking(false);
          return;
        }

        // Check email match
        if (tokenData.email !== email) {
          console.log('❌ Email mismatch');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_email');
          setCanAccess(false);
          setChecking(false);
          return;
        }

        // Public route
        if (PUBLIC_PATHS.includes(location.pathname)) {
          console.log('✅ Public route');
          setCanAccess(true);
          setChecking(false);
          return;
        }

        // Get required permission
        const permission = requiredPermission || PERMISSION_MAP[location.pathname];

        if (!permission) {
          console.log('✅ No permission required');
          setCanAccess(true);
          setChecking(false);
          return;
        }

        // Create user object
        const userObj = {
          _id: tokenData.id,
          email: tokenData.email,
          adminRole: tokenData.adminRole,
          permissions: tokenData.permissions || {}
        };

        console.log('👤 User:', userObj.email, 'Role:', userObj.adminRole);
        console.log('🔐 Required permission:', permission);

        setUser(userObj);

        // Check permission
        const hasAccess = canView(userObj, permission);
        console.log('🎫 Permission result:', permission, '=', hasAccess);

        setCanAccess(hasAccess);

      } catch (error) {
        console.error('💥 Permission check error:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_email');
        setCanAccess(false);
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [location.pathname, requiredPermission]);

  // Loading
  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Checking permissions...</p>
      </div>
    );
  }

  // Access denied
  if (!canAccess) {
    const redirectMap = {
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

    let redirectTo = "/admin/dashboard";

    if (user) {
      for (const [perm, path] of Object.entries(redirectMap)) {
        if (canView(user, perm)) {
          redirectTo = path;
          break;
        }
      }
    }

    console.log('🚫 Redirecting to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // Access granted
  console.log('✅ Access granted');
  return children;
}

export default PermissionRoute;


