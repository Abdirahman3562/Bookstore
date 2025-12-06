import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { LogOut, X, UserPlus, Shield } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Download,
  ShoppingCart,
  MessageSquare,
  Users,
  PenTool,
  FileText,
  Settings,
  Mail
} from "lucide-react";
import axios from "axios";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current admin user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const adminEmail = localStorage.getItem("admin_email");
        const token = localStorage.getItem("admin_token");
        
        if (token) {
          if (adminEmail) {
            // Try to find in Admin model first
            try {
              const adminsResponse = await axios.get("http://localhost:3000/api/admins");
              const admins = adminsResponse.data.data || [];
              const admin = admins.find(a => a.email === adminEmail);
              if (admin) {
                setCurrentUser(admin);
                return;
              }
            } catch (error) {
              console.log("Admins API not available, trying users API");
            }

            // Fallback to User model
            const usersResponse = await axios.get("http://localhost:3000/api/users");
            const users = usersResponse.data.data || [];
            const user = users.find(u => u.email === adminEmail);
            if (user) {
              setCurrentUser(user);
            } else {
              // If not found, assume it's from Admin model (legacy)
              setCurrentUser({
                adminRole: "admin",
                permissions: {
                  dashboard: true,
                  books: true,
                  downloads: true,
                  purchased: true,
                  testimonials: true,
                  users: true,
                  authors: true,
                  blogs: true,
                  addAdminUser: true
                }
              });
            }
          } else {
            // No admin_email stored, assume it's from Admin model (legacy admin)
            setCurrentUser({
              adminRole: "admin",
              permissions: {
                dashboard: true,
                books: true,
                downloads: true,
                purchased: true,
                testimonials: true,
                users: true,
                authors: true,
                blogs: true,
                addAdminUser: true
              }
            });
          }
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        // On error, assume it's admin (fallback)
        setCurrentUser({
          adminRole: "admin",
          permissions: {
            dashboard: true,
            books: true,
            downloads: true,
            purchased: true,
            testimonials: true,
            users: true,
            authors: true,
            blogs: true,
            addAdminUser: true
          }
        });
      }
    };
    fetchCurrentUser();
  }, []);

  const allMenuItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: BarChart3, permission: "dashboard" },
    { path: "/admin/books", label: "Books", icon: BookOpen, permission: "books" },
    { path: "/admin/downloads", label: "Downloads", icon: Download, permission: "downloads" },
    { path: "/admin/purchased", label: "Purchased", icon: ShoppingCart, permission: "purchased" },
    { path: "/admin/testimonials", label: "Testimonials", icon: MessageSquare, permission: "testimonials" },
    { path: "/admin/contacts", label: "Contacts", icon: Mail, permission: "contacts" },
    { path: "/admin/users", label: "Users", icon: Users, permission: "users" },
    { path: "/admin/authors", label: "Authors", icon: PenTool, permission: "authors" },
    { path: "/admin/blogs", label: "Blogs", icon: FileText, permission: "blogs" },
    { path: "/admin/website-settings", label: "Website Settings", icon: Settings, permission: "websiteSettings", adminOnly: true },
  ];

  // Filter menu items based on user permissions
  const getFilteredMenuItems = () => {
    if (!currentUser) {
      // If no user data, show all (fallback)
      return allMenuItems;
    }

    // Always check granular permissions, even for admin role
    // Admin role doesn't automatically grant all permissions - must be explicitly set
    if (currentUser.permissions) {
      return allMenuItems.filter(item => {
        // Hide admin-only items if user doesn't have permission
        if (item.adminOnly) {
          const sectionPerms = currentUser.permissions[item.permission];
          if (typeof sectionPerms === 'boolean') {
            return sectionPerms === true;
          }
          if (typeof sectionPerms === 'object' && sectionPerms !== null) {
            return sectionPerms.view === true;
          }
          return false;
        }
        // Check if permission is explicitly set to true (for view access)
        const sectionPerms = currentUser.permissions[item.permission];
        if (typeof sectionPerms === 'boolean') {
          return sectionPerms === true;
        }
        if (typeof sectionPerms === 'object' && sectionPerms !== null) {
          return sectionPerms.view === true;
        }
        return false;
      });
    }

    // Default: show only blogs if no permissions set
    return allMenuItems.filter(item => item.permission === "blogs" && !item.adminOnly);
  };

  const menuItems = getFilteredMenuItems();

  const handleLogout = () => {
    // Save dark mode preference to main darkMode key before logout
    const adminDarkMode = localStorage.getItem('admin_dark_mode');
    if (adminDarkMode) {
      localStorage.setItem('darkMode', adminDarkMode);
    }
    
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    window.location.href = "/admin";
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static top-0 left-0 z-50
        w-64 bg-gray-900 dark:bg-gray-800 text-white h-screen flex flex-col border-r border-gray-800 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-800 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-blue-400 dark:text-blue-500">Admin Panel</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto mt-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition
                ${isActive
                  ? "bg-blue-600 dark:bg-blue-700 text-white"
                  : "text-gray-300 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-700 hover:text-white"
                }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}

        {/* Admin Users Management - Only visible if user has permission */}
        {currentUser && 
         (currentUser.adminRole === "admin" || 
          (currentUser.permissions && currentUser.permissions.addAdminUser)) && (
          <>
            <Link
              to="/admin/admin-users"
              onClick={onClose}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition mt-2
                ${location.pathname === "/admin/admin-users"
                  ? "bg-blue-600 dark:bg-blue-700 text-white"
                  : "text-gray-300 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-700 hover:text-white"
                }`}
            >
              <Shield size={18} />
              Admin Users List
            </Link>
            <Link
              to="/admin/add-admin-user"
              onClick={onClose}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition
                ${location.pathname === "/admin/add-admin-user"
                  ? "bg-blue-600 dark:bg-blue-700 text-white"
                  : "text-gray-300 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-700 hover:text-white"
                }`}
            >
              <UserPlus size={18} />
              Add Admin User
            </Link>
          </>
        )}
      </div>

     
    </div>
    </>
  );
}
