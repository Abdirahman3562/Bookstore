import { Navigate } from "react-router-dom";
import PermissionRoute from "./PermissionRoute";

// ✅ FORCE IMPORT - Using PermissionRoute (no API calls)

export default function AdminProtectedRoute({ children, requiredPermission }) {
  const token = localStorage.getItem("admin_token");

  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  // Wrap with permission check if requiredPermission is provided
  if (requiredPermission) {
    return (
      <PermissionRoute requiredPermission={requiredPermission}>
        {children}
      </PermissionRoute>
    );
  }

  return children;
}
