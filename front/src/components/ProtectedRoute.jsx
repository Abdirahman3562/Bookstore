import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    toast.error("Please login first!");
    return <Navigate to="/auth" replace />;
  }

  return children;
}
