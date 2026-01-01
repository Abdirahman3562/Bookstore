import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

// 🔥 SIMPLIFIED AccessGuard v5.0 - No Router Hooks 🔥
console.log('🔥🔥🔥🔥 SIMPLIFIED AccessGuard.jsx v5.0 LOADED 🔥🔥🔥🔥');

// Simple JWT decode function - minimal
function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('❌ Token decode failed:', error.message);
    return null;
  }
}

// Main component - no useLocation hook to avoid Router context issues
function AccessGuard({ children, superAdminOnly = false }) {
  const [authState, setAuthState] = useState({
    hasAccess: false,
    isLoading: true,
    redirectTo: null
  });

  useEffect(() => {
    console.log('🛡️ AccessGuard checking access (simplified)');

    const checkAccess = () => {
      try {
        const token = localStorage.getItem("admin_token");
        const email = localStorage.getItem("admin_email");

        if (!token || !email) {
          console.log('❌ No credentials');
          setAuthState({
            hasAccess: false,
            isLoading: false,
            redirectTo: "/admin"
          });
          return;
        }

        const payload = decodeToken(token);
        if (!payload) {
          console.log('❌ Invalid token');
          setAuthState({
            hasAccess: false,
            isLoading: false,
            redirectTo: "/admin"
          });
          return;
        }

        // Check expiration
        if (payload.exp && payload.exp < Date.now() / 1000) {
          console.log('⏰ Token expired');
          setAuthState({
            hasAccess: false,
            isLoading: false,
            redirectTo: "/admin"
          });
          return;
        }

        // Check email match
        if (payload.email !== email) {
          console.log('❌ Email mismatch');
          setAuthState({
            hasAccess: false,
            isLoading: false,
            redirectTo: "/admin"
          });
          return;
        }

        console.log('👤 User:', payload.email, 'Role:', payload.adminRole);

        // Check super admin requirement
        if (superAdminOnly && payload.adminRole !== "SUPER_ADMIN") {
          console.log('🚫 Super admin access denied');
          setAuthState({
            hasAccess: false,
            isLoading: false,
            redirectTo: "/admin/dashboard"
          });
          return;
        }

        console.log('✅ Access granted');
        setAuthState({
          hasAccess: true,
          isLoading: false,
          redirectTo: null
        });

      } catch (error) {
        console.error('💥 Access check error:', error);
        setAuthState({
          hasAccess: false,
          isLoading: false,
          redirectTo: "/admin"
        });
      }
    };

    checkAccess();
  }, [superAdminOnly]);

  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!authState.hasAccess && authState.redirectTo) {
    return <Navigate to={authState.redirectTo} replace />;
  }

  return children;
}

export default AccessGuard;





