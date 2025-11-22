import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [menuOpen, setMenuOpen] = useState(false);
const menuRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
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

  const activeClass = "border-b-2 border-blue-600 text-blue-600 font-bold";
  const normalClass = "hover:text-blue-600 text-gray-600 font-medium";

  return (
    <nav className="w-full bg-white shadow p-4 flex justify-between items-center relative">
      <NavLink to="/" className="text-2xl font-bold text-blue-600">
        BookStore
      </NavLink>

      {/* Hamburger icon for mobile */}
      <div className="md:hidden">
        <button onClick={() => setMenuOpen(!menuOpen)}>
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
          to="/contact"
          className={({ isActive }) => (isActive ? activeClass : normalClass)}
        >
          Contact
        </NavLink>
      </div>

      {/* Auth Buttons for Desktop */}
      <div className="hidden md:flex gap-4 items-center">
        {!user ? (
          <>
            <NavLink
              to="/auth"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Sign Up
            </NavLink>
            <NavLink
              to="/auth"
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded"
            >
              Login
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/dashboard"
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Dashboard
            </NavLink>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Logout
            </button>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
         ref={menuRef}
          className={`fixed lg:hidden md:hidden top-0 left-0 h-full w-[300px] p-4 bg-white shadow-lg z-50 transform transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="flex flex-col mt-16 gap-4 p-4">
            <NavLink
              to="/"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "border-b-2 border-blue-600 w-[50px] text-blue-600 font-bold pb-1"
                  : "text-gray-600 hover:text-blue-600 pb-1"
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/books"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "border-b-2 w-[50px] border-blue-600 text-blue-600 font-bold pb-1"
                  : "text-gray-600 hover:text-blue-600 pb-1"
              }
            >
              Books
            </NavLink>

            <NavLink
              to="/about"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "border-b-2 w-[50px] border-blue-600 text-blue-600 font-bold pb-1"
                  : "text-gray-600 hover:text-blue-600 pb-1"
              }
            >
              About
            </NavLink>

            <NavLink
              to="/contact"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "border-b-2 w-[60px] border-blue-600 text-blue-600 font-bold pb-1"
                  : "text-gray-600 hover:text-blue-600 pb-1"
              }
            >
              Contact
            </NavLink>

            {!user ? (
              <>
                <NavLink
                  to="/auth"
                  className={({ isActive }) =>
                    isActive
                      ? "border-b-2  border-blue-600 px-4 py-2 bg-blue-600 text-white rounded pb-1"
                      : "px-4 py-2 bg-blue-600 text-white rounded pb-1"
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </NavLink>
                <NavLink
                  to="/auth"
                  className={({ isActive }) =>
                    isActive
                      ? "border-b-2 border-blue-600 px-4 py-2 border text-blue-600 rounded pb-1"
                      : "px-4 py-2 border border-blue-600 text-blue-600 rounded pb-1"
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    isActive
                      ? "border-b-2 border-green-600 px-4 py-2 bg-green-600 text-white rounded font-bold pb-1"
                      : "px-4 py-2 bg-green-600 text-white rounded pb-1"
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </NavLink>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </nav>
  );
}
