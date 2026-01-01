import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

// FORCE CACHE CLEAR - VERSION 2.0 - COMPLETE REWRITE
console.log('🚀🚀🚀 SuperAdminProtectedRoute.jsx - FORCE CACHE CLEAR v2.0 🚀🚀🚀');

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

    console.log('🔓 JWT decoded successfully:', {
      id: parsed.id,
      email: parsed.email,
      adminRole: parsed.adminRole,
      exp: parsed.exp
    });

    return parsed;
  } catch (error) {
    console.error('❌ JWT decode failed:', error.message);
    return null;
  }
}

export default function SuperAdminProtectedRoute({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [hasSuperAdminAccess, setHasSuperAdminAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    console.log('🔍 Starting SuperAdmin access check...');

    const performAccessCheck = () => {
      try {
        const storedEmail = localStorage.getItem("admin_email");
        const storedToken = localStorage.getItem("admin_token");

        console.log('📋 Stored credentials:', {
          email: storedEmail,
          tokenExists: !!storedToken,
          tokenLength: storedToken?.length
        });

        // Check if credentials exist
        if (!storedToken || !storedEmail) {
          console.log('❌ Missing credentials');
          setHasSuperAdminAccess(false);
          setIsChecking(false);
          return;
        }

        // Validate token format
        if (storedToken.length < 50) {
          console.log('❌ Token too short, clearing...');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_email');
          setHasSuperAdminAccess(false);
          setIsChecking(false);
          return;
        }

        // Decode and validate JWT
        const decoded = decodeJWTToken(storedToken);
        if (!decoded) {
          console.log('❌ Token decode failed');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_email');
          setHasSuperAdminAccess(false);
          setIsChecking(false);
          return;
        }

        // Check expiration
        const now = Date.now() / 1000;
        if (decoded.exp && decoded.exp < now) {
          console.log('⏰ Token expired');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_email');
          setHasSuperAdminAccess(false);
          setIsChecking(false);
          return;
        }

        // Check email match
        if (decoded.email !== storedEmail) {
          console.log('❌ Email mismatch');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_email');
          setHasSuperAdminAccess(false);
          setIsChecking(false);
          return;
        }

        // Check Super Admin role
        const isSuperAdmin = decoded.adminRole === "SUPER_ADMIN";
        console.log('👑 Role check:', decoded.adminRole, 'Is Super Admin:', isSuperAdmin);

        setUser({
          id: decoded.id,
          email: decoded.email,
          adminRole: decoded.adminRole,
          permissions: decoded.permissions || {}
        });

        setHasSuperAdminAccess(isSuperAdmin);

        if (!isSuperAdmin) {
          console.log('🚫 Access denied - not a Super Admin');
        } else {
          console.log('✅ Access granted - Super Admin confirmed');
        }

      } catch (error) {
        console.error('💥 Access check error:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_email');
        setHasSuperAdminAccess(false);
      } finally {
        setIsChecking(false);
      }
    };

    performAccessCheck();
  }, [location.pathname]);

  // Loading state
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
            Verifying Super Admin Access...
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Checking credentials and permissions
          </p>
        </div>
      </div>
    );
  }

  // Access denied - redirect
  if (!hasSuperAdminAccess) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Access granted
  return children;
}









