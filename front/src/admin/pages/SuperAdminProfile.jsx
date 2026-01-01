import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { handleApiError } from "../utils/apiUtils";
import { User, Mail, Key, Camera, Save, Shield, Eye, EyeOff, Lock, LockOpen, Crown, Globe } from "lucide-react";

export default function SuperAdminProfile() {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: "" });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatar: "",
    twoStepVerification: false
  });
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    fetchCurrentUser();
    // Debug: Check authentication status
    const token = localStorage.getItem("admin_token");
    const email = localStorage.getItem("admin_email");
    console.log('🔍 SuperAdminProfile: Component mounted');
    console.log('🔑 Token exists:', !!token);
    console.log('📧 Email exists:', !!email);
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const adminEmail = localStorage.getItem("admin_email");
      const token = localStorage.getItem("admin_token");

      if (adminEmail && token) {
        // For Super Admin, try to fetch from superadmin/admins API first
        try {
          const adminsResponse = await axios.get("http://localhost:3000/api/superadmin/admins", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const admins = adminsResponse.data.data || [];
          const admin = admins.find(a => a.email === adminEmail);
          if (admin) {
            console.log('✅ SuperAdminProfile: Found admin via superadmin API:', { email: admin.email, role: admin.adminRole });
            setCurrentUser(admin);
            setFormData({
              name: admin.name || "",
              email: admin.email || "",
              password: "",
              confirmPassword: "",
              avatar: admin.avatar || "",
              twoStepVerification: admin.twoStepVerification || false
            });
            setAvatarPreview(admin.avatar || "");
            return;
          }
        } catch (error) {
          console.log("Super admin API not available, trying regular admins API");
        }

        // Fallback to regular admins API
        try {
          const adminsResponse = await axios.get("http://localhost:3000/api/admins", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const admins = adminsResponse.data.data || [];
          const admin = admins.find(a => a.email === adminEmail);
          if (admin) {
            console.log('✅ SuperAdminProfile: Found admin via regular admins API:', { email: admin.email, role: admin.adminRole });
            setCurrentUser(admin);
            setFormData({
              name: admin.name || "",
              email: admin.email || "",
              password: "",
              confirmPassword: "",
              avatar: admin.avatar || "",
              twoStepVerification: admin.twoStepVerification || false
            });
            setAvatarPreview(admin.avatar || "");
            return;
          }
        } catch (error) {
          console.log("Admins API not available");
        }

        // Create default Super Admin object if not found
        const defaultSuperAdmin = {
          name: adminEmail.split('@')[0],
          email: adminEmail,
          adminRole: "SUPER_ADMIN",
          avatar: "",
          twoStepVerification: false
        };
        setCurrentUser(defaultSuperAdmin);
        setFormData({
          name: defaultSuperAdmin.name,
          email: defaultSuperAdmin.email,
          password: "",
          confirmPassword: "",
          avatar: defaultSuperAdmin.avatar,
          twoStepVerification: defaultSuperAdmin.twoStepVerification
        });
        setAvatarPreview(defaultSuperAdmin.avatar);
      }
    } catch (error) {
      console.error("Error fetching current Super Admin user:", error);
      toast.error("Failed to load profile data");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Password strength calculation
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let score = 0;
    let feedback = "";

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        feedback = "Very Weak";
        break;
      case 2:
        feedback = "Weak";
        break;
      case 3:
        feedback = "Fair";
        break;
      case 4:
        feedback = "Good";
        break;
      case 5:
        feedback = "Strong";
        break;
      default:
        feedback = "";
    }

    setPasswordStrength({ score, feedback });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
        setFormData(prev => ({ ...prev, avatar: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");

      // Debug: Check token and current user
      console.log('🔍 SuperAdminProfile: Submitting with token:', !!token);
      console.log('👤 SuperAdminProfile: Current user:', currentUser);

      if (!token) {
        toast.error("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      // Validate passwords if changing
      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }
        if (passwordStrength.score < 3) {
          toast.error("Password is too weak. Please use a stronger password.");
          setLoading(false);
          return;
        }
      }

      const updateData = {
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar,
        twoStepVerification: formData.twoStepVerification
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      // Update via superadmin API if available, fallback to regular admin API
      let response;
      try {
        response = await axios.put("http://localhost:3000/api/superadmin/profile", updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.log("Super admin profile API not available, trying regular admin API");
        response = await axios.put("http://localhost:3000/api/admin/profile", updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (response.data.success) {
        toast.success("Profile updated successfully!");
        setCurrentUser(prev => ({ ...prev, ...updateData }));

        // Notify other components (like SuperAdminTopBar) that profile was updated
        window.dispatchEvent(new CustomEvent('superAdminProfileUpdated', {
          detail: { user: response.data.data }
        }));

        // Clear password fields
        setFormData(prev => ({
          ...prev,
          password: "",
          confirmPassword: ""
        }));

        // Update localStorage if email changed
        if (updateData.email !== currentUser.email) {
          localStorage.setItem("admin_email", updateData.email);
        }
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-700">
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          <div>
            <h1 className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">
              Super Admin Profile
            </h1>
            <p className="text-yellow-600 dark:text-yellow-400">
              Manage your platform administrator account
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Crown className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full cursor-pointer transition-colors">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Click camera to change avatar</p>
              </div>

              <div className="flex-1 space-y-4 w-full sm:w-auto">
                {/* Role Badge */}
                <div className="flex justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-600">
                    <Crown size={16} />
                    SUPER_ADMIN
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Globe className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">Platform</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Manager</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Shield className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">Full</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Access</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5" />
                Change Password
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.score <= 2 ? 'bg-red-500' :
                              passwordStrength.score <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.score <= 2 ? 'text-red-500' :
                          passwordStrength.score <= 3 ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                          {passwordStrength.feedback}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <LockOpen className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Two-Step Verification */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Two-Step Verification</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="twoStepVerification"
                    checked={formData.twoStepVerification}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-600"></div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Update Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
