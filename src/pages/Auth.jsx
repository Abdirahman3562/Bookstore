import { useState } from "react";
import { useNavigate } from "react-router-dom";
import users from "../data/users.json";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function AuthPage() {
  const navigate = useNavigate();
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // HANDLE SIGNUP
  const handleSignup = () => {
    if (!signupData.name || !signupData.email || !signupData.password) {
      return toast.error("Please fill all fields");
    }

    let storedUsers = JSON.parse(localStorage.getItem("users")) || [];

    const exists = storedUsers.find((u) => u.email === signupData.email);
    if (exists) {
      return toast.error("Email already registered!");
    }

    storedUsers.push(signupData);
    localStorage.setItem("users", JSON.stringify(storedUsers));

    localStorage.setItem("user", JSON.stringify(signupData));

    toast.success("Account created successfully!");
    navigate("/dashboard");
  };

  // HANDLE LOGIN
  const handleLogin = () => {
    let storedUsers = JSON.parse(localStorage.getItem("users")) || [];

    const user = storedUsers.find(
      (u) => u.email === loginData.email && u.password === loginData.password
    );

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      toast.success("Login successful!");
      navigate("/dashboard");
    } else {
      toast.error("Invalid email or password!");
    }
  };

  return (
      <div className="bg-[#ffffff] min-hse mt-10 shadow-xl  rounded-lg p-10  grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* SIGNUP FORM */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-blue-600">
            Create Account
          </h2>

          <input
            type="text"
            placeholder="Full Name"
            className="w-full rounded-lg border border-gray-300 py-2 pl-5 transition focus:ring-2 focus:ring-green-500 focus:outline-none mb-4 "
            onChange={(e) =>
              setSignupData({ ...signupData, name: e.target.value })
            }
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-gray-300 py-2 pl-5 transition focus:ring-2 focus:ring-green-500 focus:outline-none mb-4"
            onChange={(e) =>
              setSignupData({ ...signupData, email: e.target.value })
            }
          />

          <div className="relative">
            <input
              type={showSignupPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-green-500 focus:outline-none mb-4"
              onChange={(e) =>
                setSignupData({ ...signupData, password: e.target.value })
              }
            />

            <button
              type="button"
              onClick={() => setShowSignupPassword(!showSignupPassword)}
              className="absolute right-3 top-2 mt-1 text-green-900 "
            >
              {showSignupPassword ? (
                <FiEyeOff size={18} />
              ) : (
                <FiEye size={18} />
              )}
            </button>
          </div>

          <button
            onClick={handleSignup}
            className="w-full bg-blue-600 text-white py-3 rounded"
          >
            Sign Up
          </button>
        </div>

        {/* LOGIN FORM */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-green-600">Login</h2>

          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-green-500 focus:outline-none mb-4"
            onChange={(e) =>
              setLoginData({ ...loginData, email: e.target.value })
            }
          />

          <div className="relative">
            <input
              type={showLoginPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full rounded-lg border border-gray-300 py-2 pl-5 pr-12 transition focus:ring-2 focus:ring-green-500 focus:outline-none mb-4"
              onChange={(e) =>
                setLoginData({ ...loginData, password: e.target.value })
              }
            />

            <button
              type="button"
              onClick={() => setShowLoginPassword(!showLoginPassword)}
              className="absolute right-3 top-2 text-green-900 mt-1 hover:text-gray-700"
            >
              {showLoginPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-green-600 text-white py-3 rounded"
          >
            Login
          </button>
        </div>
      </div>
  );
}
