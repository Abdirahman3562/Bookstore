import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async (e) => {
    e?.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", {
        email,
        password,
      });

      if (res.data.success && res.data.token) {
        localStorage.setItem("admin_token", res.data.token);
        localStorage.setItem("admin_email", email); // Store admin email for permissions
        
        // Get user permissions from response
        const adminData = res.data.admin;
        const permissions = adminData?.permissions || {};
        const adminRole = adminData?.adminRole;
        
        // Determine redirect path based on permissions
        let redirectPath = "/admin/dashboard"; // Default
        
        // If user is admin, they have access to dashboard
        if (adminRole === "admin") {
          redirectPath = "/admin/dashboard";
        } else if (adminRole === "author" || permissions) {
          // Check if dashboard permission is granted
          if (permissions.dashboard === true) {
            redirectPath = "/admin/dashboard";
          } else {
            // Find first page they have permission for
            const permissionRoutes = {
              books: "/admin/books",
              downloads: "/admin/downloads",
              purchased: "/admin/purchased",
              testimonials: "/admin/testimonials",
              users: "/admin/users",
              authors: "/admin/authors",
              blogs: "/admin/blogs"
            };
            
            // Find first allowed page
            for (const [key, path] of Object.entries(permissionRoutes)) {
              if (permissions[key] === true) {
                redirectPath = path;
                break;
              }
            }
            
            // If no permissions found, default to blogs (usually allowed for authors)
            if (redirectPath === "/admin/dashboard" && permissions.blogs !== false) {
              redirectPath = "/admin/blogs";
            }
          }
        }
        
        toast.success("Login successful 🎉");
        
        // Small delay to ensure localStorage is set
        setTimeout(() => {
          navigate(redirectPath);
        }, 100);
      } else {
        toast.error("Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.message || "Invalid email or password";
      toast.error(errorMessage);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      login();
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form 
        onSubmit={login}
        className="bg-white shadow p-6 w-80 rounded"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Admin Login</h2>

        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
        />

        <input
          className="border p-2 w-full mb-2 rounded"
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
        />

        <button
          type="submit"
          className="bg-blue-600 text-white p-2 w-full rounded hover:bg-blue-700 transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  );
}
