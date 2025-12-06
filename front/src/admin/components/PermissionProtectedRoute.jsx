import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

// Map routes to their required permissions
const routePermissions = {
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
  "/admin/add-admin-user": "addAdminUser",
  "/admin/admin-users": "addAdminUser"
};

// Routes that don't require specific permissions (accessible to all logged-in admins)
const publicAdminRoutes = [
  "/admin/my-profile",
  "/admin/notifications"
];

export default function PermissionProtectedRoute({ children, requiredPermission }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const adminEmail = localStorage.getItem("admin_email");
        const token = localStorage.getItem("admin_token");

        if (!token) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        // Check if route is public
        if (publicAdminRoutes.includes(location.pathname)) {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // Get required permission for current route
        const routePermission = requiredPermission || routePermissions[location.pathname];

        if (!routePermission) {
          // No permission required for this route
          setHasAccess(true);
          setLoading(false);
          return;
        }

        if (adminEmail) {
          // Try to fetch from admins API first
          try {
            const adminsResponse = await axios.get("http://localhost:3000/api/admins");
            const admins = adminsResponse.data.data || [];
            const admin = admins.find(a => a.email === adminEmail);
            
            if (admin) {
              setCurrentUser(admin);
              // Check if user has permission - always check granular permissions
              if (admin.permissions) {
                // Check for granular permissions (view action)
                const sectionPerms = admin.permissions[routePermission];
                if (sectionPerms && (sectionPerms.view === true || sectionPerms === true)) {
                  setHasAccess(true);
                } else {
                  setHasAccess(false);
                  toast.error("You don't have permission to access this page");
                }
              } else {
                setHasAccess(false);
                toast.error("You don't have permission to access this page");
              }
              setLoading(false);
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
            // Check if user has permission - always check granular permissions
            if (user.permissions) {
              // Check for granular permissions (view action)
              const sectionPerms = user.permissions[routePermission];
              if (sectionPerms && (sectionPerms.view === true || sectionPerms === true)) {
                setHasAccess(true);
              } else {
                setHasAccess(false);
                toast.error("You don't have permission to access this page");
              }
            } else {
              setHasAccess(false);
              toast.error("You don't have permission to access this page");
            }
          } else {
            setHasAccess(false);
          }
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [location.pathname, requiredPermission]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    // Find first page user has permission for
    const permissionRoutes = {
      dashboard: "/admin/dashboard",
      books: "/admin/books",
      downloads: "/admin/downloads",
      purchased: "/admin/purchased",
      testimonials: "/admin/testimonials",
      users: "/admin/users",
      authors: "/admin/authors",
      blogs: "/admin/blogs",
      contacts: "/admin/contacts",
      websiteSettings: "/admin/website-settings"
    };

    let redirectPath = "/admin/blogs"; // Default fallback

    if (currentUser && currentUser.permissions) {
      // Find first allowed page based on permissions
      for (const [key, path] of Object.entries(permissionRoutes)) {
        const sectionPerms = currentUser.permissions[key];
        if (sectionPerms && (sectionPerms.view === true || sectionPerms === true)) {
          redirectPath = path;
          break;
        }
      }
    }

    return <Navigate to={redirectPath} replace />;
  }

  return children;
}


