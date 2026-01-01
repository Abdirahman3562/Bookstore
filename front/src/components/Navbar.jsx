import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiMenu, FiX } from "react-icons/fi";
import { FaShoppingCart } from "react-icons/fa"; // Add shopping cart icon
import { MdDashboard } from "react-icons/md";
import { Moon, Sun } from "lucide-react";
import axios from "axios";

// JWT decode function
const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('❌ Token decode failed:', error.message);
    return null;
  }
};

export default function Navbar() {
  const navigate = useNavigate();
  const regularUser = JSON.parse(localStorage.getItem("user"));
  const [adminUser, setAdminUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0); // Track cart items
  const [websiteSettings, setWebsiteSettings] = useState({
    websiteName: "BookStore",
    websiteLogo: "",
  });
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem("darkMode");
    if (saved === "true" || saved === true) {
      return true;
    }
    return false;
  });

  // Determine if we're dealing with admin or regular user
  const isAdmin = localStorage.getItem("admin_token") && localStorage.getItem("admin_email");
  const user = isAdmin ? adminUser : regularUser;

  const menuRef = useRef(null);

  // Fetch admin user data if admin is logged in
  useEffect(() => {
    const fetchAdminUser = async () => {
      const adminEmail = localStorage.getItem("admin_email");
      const token = localStorage.getItem("admin_token");

      if (adminEmail && token) {
        // Decode JWT token directly
        const payload = decodeToken(token);
        if (!payload) {
          console.log('❌ Invalid admin token in navbar');
          setAdminUser(null);
          return;
        }

        // Check expiration
        if (payload.exp && payload.exp < Date.now() / 1000) {
          console.log('⏰ Admin token expired in navbar');
          setAdminUser(null);
          return;
        }

        // Check email match
        if (payload.email !== adminEmail) {
          console.log('❌ Admin email mismatch in navbar');
          setAdminUser(null);
          return;
        }

        // Set admin data from JWT
        const adminData = {
          _id: payload.id,
          email: payload.email,
          adminRole: payload.adminRole,
          role: payload.adminRole,
          permissions: payload.permissions || {},
          tenantId: payload.tenantId
        };

        console.log('✅ Admin navbar data loaded:', adminData.email, 'Role:', adminData.adminRole);
        setAdminUser(adminData);
      } else {
        setAdminUser(null);
      }
    };

    fetchAdminUser();
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Fetch website settings
  useEffect(() => {
    const fetchWebsiteSettings = async () => {
      try {
        // Check for admin token first, then regular user token
        const adminToken = localStorage.getItem("admin_token");
        const userToken = localStorage.getItem("token");
        const token = adminToken || userToken;

        const response = await axios.get("http://localhost:3000/api/website-settings", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (response.data.success) {
          setWebsiteSettings({
            websiteName: response.data.data.websiteName || "BookStore",
            websiteLogo: response.data.data.websiteLogo || "",
          });
        }
      } catch (error) {
        console.error("Error fetching website settings:", error);
        // Keep default "BookStore" if fetch fails
      }
    };

    fetchWebsiteSettings();

    // Listen for website settings updates
    const handleSettingsUpdate = () => {
      fetchWebsiteSettings();
    };

    window.addEventListener("websiteSettingsUpdated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("websiteSettingsUpdated", handleSettingsUpdate);
    };
  }, []);

  // Update cart count from localStorage when the component mounts
  // Listen for cart updates in real-time
  useEffect(() => {
    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      setCartCount(cart.length);
    };

    // Update when event fires
    window.addEventListener("cartUpdated", updateCart);

    // Update on first load
    updateCart();

    return () => {
      window.removeEventListener("cartUpdated", updateCart);
    };
  }, []);

  const handleLogout = () => {
    // Clear regular user data
    localStorage.removeItem("user");

    // Clear admin data
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    setAdminUser(null);

    toast.success("Logged out!");
    navigate("/auth");
  };

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const activeClass = "border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-bold";
  const normalClass = "hover:text-blue-600 dark:hover:text-blue-400 text-gray-600 dark:text-gray-300 font-medium";

  // Handle add to cart
  const addToCart = (book) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const bookExists = cart.find((item) => (item._id || item.id) === (book._id || book.id));
    if (!bookExists) {
      cart.push(book);
      localStorage.setItem("cart", JSON.stringify(cart));

      // Update cart count
      setCartCount(cart.length);
      toast.success("Item added to cart!");
    } else {
      toast.error("This book is already in your cart!");
    }
  };

  return (
    <nav className="w-full max-w-8xl bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center relative transition-colors duration-200">
      <NavLink to="/" className="flex items-center gap-2">
        {/* {websiteSettings.websiteLogo && (
          <img
            src={`http://localhost:3000${websiteSettings.websiteLogo}`}
            alt={websiteSettings.websiteName}
            className="h-8 w-auto object-contain"
          />
        )} */}
        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {websiteSettings.websiteName}
        </span>
      </NavLink>

      {/* Hamburger icon for mobile */}
      <div className="md:hidden flex gap-5 items-center">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
        {/* Cart Icon */}
        <div className="flex gap-4 items-center">
          <button onClick={() => navigate("/cart")} className="relative">
            <FaShoppingCart size={24} className="text-blue-500 dark:text-blue-400" />
            <span className="absolute top-0 right-0 bg-blue-500 dark:bg-blue-600 text-white text-xs rounded-full px-1 py-0.5">
              {cartCount}
            </span>
          </button>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-700 dark:text-gray-300">
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Desktop Links */}
      <div className="hidden md:flex gap-6">
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? activeClass : normalClass)}
        >
          Home
        </NavLink>
        <NavLink
          to="/books"
          className={({ isActive }) => (isActive ? activeClass : normalClass)}
        >
          Books
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) => (isActive ? activeClass : normalClass)}
        >
          About
        </NavLink>

         <NavLink
          to="/blog"
          className={({ isActive }) => (isActive ? activeClass : normalClass)}
        >
          Blog
        </NavLink>
        <NavLink
          to="/contact"
          className={({ isActive }) => (isActive ? activeClass : normalClass)}
        >
          Contact
        </NavLink>
      </div>

      {/* Auth Buttons for Desktop */}
      <div className="hidden md:flex gap-6 items-center">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
        {!user ? (
          <>
            <NavLink
              to="/auth"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Sign Up
            </NavLink>
            <NavLink
              to="/auth"
              className="px-4 py-2 border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Login
            </NavLink>
          </>
        ) : (
          <>
            {/* User Profile */}
            <div className="flex items-center gap-3">
              {/* User Avatar */}
              {user && user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 flex-shrink-0"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0" style={{ display: user && user.avatar ? 'none' : 'flex' }}>
                <div className={`w-full h-full flex items-center justify-center text-white font-semibold text-sm ${user && user.role === 'premium' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                  {user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>

              {/* User Info */}
              <div className="hidden lg:flex flex-col">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user ? user.name : 'Loading...'}
                </span>
                <div className="flex items-center gap-2">
                  {user && (
                    <>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        user.role === 'premium'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {user.role === 'premium' ? 'Premium' : 'Regular'}
                      </span>
                      {user.adminRole && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          user.adminRole === 'SUPER_ADMIN'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : user.adminRole === 'admin'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : user.adminRole === 'author'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {user.adminRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' :
                           user.adminRole === 'admin' ? 'Admin' :
                           user.adminRole === 'author' ? 'Author' :
                           user.adminRole}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Dashboard Link */}
              <NavLink
                to="/dashboard"
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 shadow-md text-[#2563eb] dark:text-blue-400 rounded flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Dashboard"
              >
                <MdDashboard size={22} />
              </NavLink>
            </div>
          </>
        )}
        {/* Cart Icon */}
        <div className="flex gap-4 items-center">
          <button onClick={() => navigate("/cart")} className="relative">
            <FaShoppingCart size={24} className="text-[#2563eb] dark:text-blue-400" />
            <span className="absolute top-0 right-0 bg-[#2563eb] dark:bg-blue-600 text-white text-xs rounded-full px-1 py-0.5">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className={`fixed lg:hidden md:hidden top-0 left-0 h-full w-[300px] p-4 bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="flex flex-col mt-16 gap-4 p-4">
            {/* Dark Mode Toggle in Mobile Menu */}
            <button
              onClick={() => {
                toggleDarkMode();
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mb-4"
            >
              {darkMode ? (
                <>
                  <Sun className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-700 dark:text-gray-300">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
                </>
              )}
            </button>
            <NavLink
              to="/"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "border-b-2 border-blue-600 dark:border-blue-400 w-[50px] text-blue-600 dark:text-blue-400 font-bold pb-1"
                  : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 pb-1"
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/books"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "border-b-2 w-[50px] border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-bold pb-1"
                  : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 pb-1"
              }
            >
              Books
            </NavLink>
            <NavLink
              to="/about"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "border-b-2 w-[50px] border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-bold pb-1"
                  : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 pb-1"
              }
            >
              About
            </NavLink>

            <NavLink
              to="/blog"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "border-b-2 w-[50px] border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-bold pb-1"
                  : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 pb-1"
              }
            >
              Blog
            </NavLink>

            <NavLink
              to="/contact"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "border-b-2 w-[60px] border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-bold pb-1"
                  : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 pb-1"
              }
            >
              Contact
            </NavLink>

            {/* Auth Section for Mobile */}
            {!user ? (
              <>
                <NavLink
                  to="/auth"
                  className="border-b-2 border-blue-600 dark:border-blue-400 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded pb-1 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </NavLink>
                <NavLink
                  to="/auth"
                  className="border-b-2 border-blue-600 dark:border-blue-400 px-4 py-2 border text-blue-600 dark:text-blue-400 rounded pb-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/dashboard"
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 shadow-md text-[#2563eb] dark:text-blue-400 rounded flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <MdDashboard size={22} />
                  Dashboard
                </NavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </nav>
  );
}
