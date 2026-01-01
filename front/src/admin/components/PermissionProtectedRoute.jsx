import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { canView } from "../utils/permissions";

// FORCE CACHE CLEAR - VERSION 2.0 - COMPLETE REWRITE
console.log('🚀🚀🚀 PermissionProtectedRoute.jsx - FORCE CACHE CLEAR v2.0 🚀🚀🚀');

// JWT decode function - completely rewritten
function decodeJWTToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decodedPayload);

    console.log('🔓 Permission JWT decoded:', {
      id: parsed.id,
      email: parsed.email,
      adminRole: parsed.adminRole,
      permissions: parsed.permissions
    });

    return parsed;
  } catch (error) {
    console.error('❌ Permission JWT decode failed:', error.message);
    return null;
  }
}

// Route permission mapping
const ROUTE_PERMISSIONS = {
  // Regular admin routes (tenant-scoped content management)
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
  "/admin/author-users": "addAdminUser",

  // Super admin routes (platform management - SUPER_ADMIN role required)
  "/superadmin/dashboard": "superadmin",
  "/superadmin/tenants": "superadmin",
  "/superadmin/subscriptions": "superadmin",
  "/superadmin/plans": "superadmin",
  "/superadmin/analytics": "superadmin",
  "/superadmin/admins": "superadmin",
  "/superadmin/admins/create": "superadmin"
};

// Public routes accessible to all logged-in admins
const PUBLIC_ROUTES = [
  "/admin/my-profile",
  "/admin/notifications"
];

export default function PermissionProtectedRoute({ children, requiredPermission }) {
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [verifyingAccess, setVerifyingAccess] = useState(true);

  useEffect(() => {
    console.log('🔐 Starting permission verification...');

    const verifyPermissions = () => {
      try {
        const email = localStorage.getItem("admin_email");
        const jwtToken = localStorage.getItem("admin_token");

        console.log('📋 Permission check credentials:', {
          email: email,
          tokenExists: !!jwtToken,
          tokenLength: jwtToken?.length
        });

        // Validate credentials exist
        if (!jwtToken || !email) {
          console.log('❌ Missing credentials for permission check');
          setAccessGranted(false);
          setVerifyingAccess(false);
          return;
        }

        // Basic token validation
        if (jwtToken.length < 50) {
          console.log('❌ Token too short, clearing credentials');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_email');
          setAccessGranted(false);
          setVerifyingAccess(false);
          return;
        }

        // Decode JWT token
        const tokenData = decodeJWTToken(jwtToken);
        if (!tokenData) {
          console.log('❌ Token decode failed');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_email');
          setAccessGranted(false);
          setVerifyingAccess(false);
          return;
        }

        // Check token expiration
        const currentTimestamp = Date.now() / 1000;
        if (tokenData.exp && tokenData.exp < currentTimestamp) {
          console.log('⏰ Permission token expired');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_email');
          setAccessGranted(false);
          setVerifyingAccess(false);
          return;
        }

        // Validate email consistency
        if (tokenData.email !== email) {
          console.log('❌ Email mismatch in permission check');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_email');
          setAccessGranted(false);
          setVerifyingAccess(false);
          return;
        }

        // Check if route is public
        if (PUBLIC_ROUTES.includes(location.pathname)) {
          console.log('✅ Public route - access granted');
          setAccessGranted(true);
          setVerifyingAccess(false);
          return;
        }

        // Determine required permission
        const neededPermission = requiredPermission || ROUTE_PERMISSIONS[location.pathname];

        if (!neededPermission) {
          console.log('✅ No specific permission required');
          setAccessGranted(true);
          setVerifyingAccess(false);
          return;
        }

        // Build user object from token
        const user = {
          _id: tokenData.id,
          email: tokenData.email,
          adminRole: tokenData.adminRole,
          permissions: tokenData.permissions || {}
        };

        console.log('👤 User permissions:', {
          email: user.email,
          role: user.adminRole,
          permissions: user.permissions,
          requiredPermission: neededPermission
        });

        setUserData(user);

        // SPECIAL HANDLING: Super admin routes require SUPER_ADMIN role
        if (neededPermission === "superadmin") {
          const isSuperAdmin = user.adminRole === "SUPER_ADMIN";
          console.log('👑 Super admin route access check:', {
            route: location.pathname,
            userRole: user.adminRole,
            isSuperAdmin,
            accessGranted: isSuperAdmin
          });

          if (!isSuperAdmin) {
            console.log('🚫 Access DENIED: Super admin route requires SUPER_ADMIN role');
            setAccessGranted(false);
            setVerifyingAccess(false);
            return;
          }

          // Super admin has access to all super admin routes
          setAccessGranted(true);
          setVerifyingAccess(false);
          return;
        }

        // Regular routes use permission-based access
        const hasPermission = canView(user, neededPermission);
        console.log('🔍 Permission result:', neededPermission, '=', hasPermission);

        setAccessGranted(hasPermission);

      } catch (error) {
        console.error('💥 Permission verification error:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_email');
        setAccessGranted(false);
      } finally {
        setVerifyingAccess(false);
      }
    };

    verifyPermissions();
  }, [location.pathname, requiredPermission]);

  // Loading state
  if (verifyingAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
            Verifying Permissions...
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Checking your access rights
          </p>
        </div>
      </div>
    );
  }

  // Access denied - redirect to appropriate page
  if (!accessGranted) {
    const REDIRECT_ROUTES = {
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

    let targetPath = "/admin/dashboard"; // Default fallback

    if (userData) {
      // Find first accessible page
      for (const [permission, path] of Object.entries(REDIRECT_ROUTES)) {
        if (canView(userData, permission)) {
          targetPath = path;
          break;
        }
      }
    }

    console.log('🚫 Access denied, redirecting to:', targetPath);
    return <Navigate to={targetPath} replace />;
  }

  // Access granted
  console.log('✅ Permission granted - rendering protected content');
  return children;
}


