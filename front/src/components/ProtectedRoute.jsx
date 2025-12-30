import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  console.log("ProtectedRoute - User:", user ? "Present" : "Missing");
  console.log("ProtectedRoute - Token:", token ? "Present" : "Missing");

  if (!user || !token) {
    toast.error("Please login first!");
    return <Navigate to="/auth" replace />;
  }

  return children;
}
