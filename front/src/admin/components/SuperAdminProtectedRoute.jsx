import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

export default function SuperAdminProtectedRoute({ children }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkSuperAdminAccess = async () => {
      try {
        const adminEmail = localStorage.getItem("admin_email");
        const token = localStorage.getItem("admin_token");

        if (!token) {
          setIsSuperAdmin(false);
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
              if (admin.adminRole === "SUPER_ADMIN") {
                setIsSuperAdmin(true);
              } else {
                setIsSuperAdmin(false);
                toast.error("Access denied! Only Super Admin can access this page.");
              }
              setLoading(false);
              return;
            }
          } catch (error) {
            console.log("Admins API not available, trying users API");
          }

          // Fallback to users API (though Super Admin should be in admins collection)
          const usersResponse = await axios.get("http://localhost:3000/api/users");
          const users = usersResponse.data.data || [];
          const user = users.find(u => u.email === adminEmail);

          if (user) {
            setCurrentUser(user);
            if (user.adminRole === "SUPER_ADMIN") {
              setIsSuperAdmin(true);
            } else {
              setIsSuperAdmin(false);
              toast.error("Access denied! Only Super Admin can access this page.");
            }
          } else {
            setIsSuperAdmin(false);
            toast.error("Access denied! Only Super Admin can access this page.");
          }
        } else {
          setIsSuperAdmin(false);
          toast.error("Access denied! Only Super Admin can access this page.");
        }
      } catch (error) {
        console.error("Error checking Super Admin access:", error);
        setIsSuperAdmin(false);
        toast.error("Access denied! Only Super Admin can access this page.");
      } finally {
        setLoading(false);
      }
    };

    checkSuperAdminAccess();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying Super Admin access...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    // Redirect regular admins to their dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}



