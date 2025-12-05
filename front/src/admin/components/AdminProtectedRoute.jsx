import { Navigate } from "react-router-dom";
import PermissionProtectedRoute from "./PermissionProtectedRoute";

export default function AdminProtectedRoute({ children, requiredPermission }) {
  const token = localStorage.getItem("admin_token");

  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  // Wrap with permission check if requiredPermission is provided
  if (requiredPermission) {
    return (
      <PermissionProtectedRoute requiredPermission={requiredPermission}>
        {children}
      </PermissionProtectedRoute>
    );
  }

  return children;
}
