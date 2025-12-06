import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { User, Mail, Key, Camera, Save, Shield, Eye, EyeOff, Lock, LockOpen } from "lucide-react";

export default function MyProfile() {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: "" });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
    avatar: "",
    twoStepVerification: false
  });
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const adminEmail = localStorage.getItem("admin_email");
      if (adminEmail) {
        // Try admins API first
        try {
          const adminsResponse = await axios.get("http://localhost:3000/api/admins");
          const admins = adminsResponse.data.data || [];
          const admin = admins.find(a => a.email === adminEmail);
          if (admin) {
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

        // Fallback to users API
        const usersResponse = await axios.get("http://localhost:3000/api/users");
        const users = usersResponse.data.data || [];
        const user = users.find(u => u.email === adminEmail);
        if (user) {
          setCurrentUser(user);
          setFormData({
            name: user.name || "",
            email: user.email || "",
            password: "",
            confirmPassword: "",
            avatar: user.avatar || "",
            twoStepVerification: user.twoStepVerification || false
          });
          setAvatarPreview(user.avatar || "");
        }
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      toast.error("Failed to load profile");
    }
  };

  // Password strength validation
  const validatePasswordStrength = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    return errors;
  };

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, feedback: "", label: "" };
    
    let score = 0;
    const feedback = [];

    if (password.length >= 8) score += 1;
    else feedback.push("At least 8 characters");

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("Lowercase letter");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("Uppercase letter");

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("Number");

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push("Special character");

    const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return {
      score,
      feedback: feedback.length > 0 ? `Missing: ${feedback.join(", ")}` : "Strong password",
      label: strengthLabels[score - 1] || "Very Weak"
    };
  };

  // Update password strength on change
  useEffect(() => {
    if (formData.password) {
      const strength = calculatePasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: "", label: "" });
    }
  }, [formData.password]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setFormData((prev) => ({ ...prev, avatar: base64 }));
        setAvatarPreview(base64);

        // Compress image
        const img = new Image();
        img.src = base64;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > 800) {
            height = (height * 800) / width;
            width = 800;
          }
          if (height > 800) {
            width = (width * 800) / height;
            height = 800;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL("image/jpeg", 0.8);
          setFormData((prev) => ({ ...prev, avatar: compressed }));
          setAvatarPreview(compressed);
        };
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Form submission started", { 
        twoStepVerification: formData.twoStepVerification,
        hasPassword: !!formData.password,
        passwordLength: formData.password?.length || 0
      });

      // If password is being changed, require current password verification
      if (formData.password && formData.password.trim() !== "") {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }

        // Password strength validation
        const passwordErrors = validatePasswordStrength(formData.password);
        if (passwordErrors.length > 0) {
          toast.error(passwordErrors.join(", "));
          setLoading(false);
          return;
        }

        // Check if verification is done
        if (!currentPasswordVerified) {
          toast.error("Please verify your current password first");
          setLoading(false);
          return;
        }
      }

      const updateData = {
        name: formData.name,
        email: formData.email,
        twoStepVerification: formData.twoStepVerification
      };

      if (formData.password && formData.password.trim() !== "") {
        updateData.password = formData.password;
        updateData.currentPassword = formData.currentPassword;
      }

      if (formData.avatar && formData.avatar.trim() !== "") {
        updateData.avatar = formData.avatar;
      }

      console.log("Update data being sent:", { ...updateData, password: updateData.password ? "***" : undefined, currentPassword: updateData.currentPassword ? "***" : undefined });

      // Determine if user is from admins or users collection
      const adminEmail = localStorage.getItem("admin_email");
      let response;

      // Try admins API first
      try {
        const adminsResponse = await axios.get("http://localhost:3000/api/admins");
        const admins = adminsResponse.data.data || [];
        const admin = admins.find(a => a.email === adminEmail);
        
        if (admin) {
          // Update in admins collection
          console.log("Updating admin:", admin._id);
          response = await axios.put(`http://localhost:3000/api/admins/${admin._id}`, updateData);
          console.log("Admin update response:", response.data);
          localStorage.setItem("admin_email", formData.email); // Update stored email
        } else {
          throw new Error("Not in admins");
        }
      } catch (error) {
        // Fallback to users API
        console.log("Trying users API...");
        const usersResponse = await axios.get("http://localhost:3000/api/users");
        const users = usersResponse.data.data || [];
        const user = users.find(u => u.email === adminEmail);
        
        if (user) {
          console.log("Updating user:", user._id);
          response = await axios.put(`http://localhost:3000/api/users/${user._id}`, updateData);
          console.log("User update response:", response.data);
          localStorage.setItem("admin_email", formData.email);
        } else {
          throw new Error("User not found");
        }
      }

      // Check if update was successful (handle both success field and status)
      if (response.data.success !== false && response.status >= 200 && response.status < 300) {
        toast.success("Profile updated successfully!");
        // Reset password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          password: "",
          confirmPassword: ""
        }));
        setCurrentPasswordVerified(false);
        await fetchCurrentUser();
        
        // Get updated user data from response or use formData
        const updatedUser = response.data.data || response.data;
        const updatedAvatar = updatedUser?.avatar || formData.avatar || currentUser?.avatar;
        
        // Notify TopBar to update user data
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: {
            name: updatedUser?.name || formData.name,
            email: updatedUser?.email || formData.email,
            avatar: updatedAvatar
          }
        }));
      } else {
        toast.error(response.data?.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      console.error("Error details:", error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            My Profile
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Update your profile information and settings
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white text-4xl font-bold">
                  {formData.name
                    ? formData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "A"}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-blue-600 dark:bg-blue-700 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Click camera icon to upload</p>
          </div>

          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4" />
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
              placeholder="Your Name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="w-4 h-4" />
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
              placeholder="your@email.com"
            />
          </div>

          {/* Password Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Change Password
            </h3>

            {/* New Password - Only show initial field if not verified and password is empty */}
            {!currentPasswordVerified && !formData.password && (
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Key className="w-4 h-4" />
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (!e.target.value) {
                      setCurrentPasswordVerified(false);
                      setFormData(prev => ({ ...prev, currentPassword: "" }));
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  placeholder="Enter new password to change"
                  minLength={8}
                />
              </div>
            )}

            {/* Current Password - Show when password is entered but not verified */}
            {formData.password && !currentPasswordVerified && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Shield className="w-4 h-4" />
                  Current Password *
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      onBlur={async () => {
                        // Verify current password when user leaves the field
                        if (formData.currentPassword && !currentPasswordVerified) {
                          try {
                            const adminEmail = localStorage.getItem("admin_email");
                            let user = null;
                            
                            // Try to find user
                            try {
                              const adminsResponse = await axios.get("http://localhost:3000/api/admins");
                              const admins = adminsResponse.data.data || [];
                              user = admins.find(a => a.email === adminEmail);
                              
                              if (!user) {
                                const usersResponse = await axios.get("http://localhost:3000/api/users");
                                const users = usersResponse.data.data || [];
                                user = users.find(u => u.email === adminEmail);
                              }
                            } catch (error) {
                              console.error("Error fetching user:", error);
                            }
                            
                            if (user && user.password === formData.currentPassword) {
                              setCurrentPasswordVerified(true);
                              toast.success("Current password verified!");
                            } else if (user && user.password !== formData.currentPassword) {
                              toast.error("Current password is incorrect");
                            }
                          } catch (error) {
                            // Silent fail - user might not have entered password yet
                          }
                        }
                      }}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {currentPasswordVerified && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Current password verified ✓
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* New Password and Confirm Password - Only show after verification */}
            {currentPasswordVerified && (
              <>
                <div className="mb-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Key className="w-4 h-4" />
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                      placeholder="Enter new password (min 8 chars, uppercase, lowercase, number, special char)"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              passwordStrength.score <= 1
                                ? "bg-red-500 dark:bg-red-600"
                                : passwordStrength.score === 2
                                ? "bg-orange-500 dark:bg-orange-600"
                                : passwordStrength.score === 3
                                ? "bg-yellow-500 dark:bg-yellow-600"
                                : passwordStrength.score === 4
                                ? "bg-blue-500 dark:bg-blue-600"
                                : "bg-green-500 dark:bg-green-600"
                            }`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {passwordStrength.label || "Very Weak"}
                        </span>
                      </div>
                      {passwordStrength.feedback && passwordStrength.score < 5 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{passwordStrength.feedback}</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`w-full px-4 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? "border-red-300 dark:border-red-600"
                          : formData.confirmPassword && formData.password === formData.confirmPassword
                          ? "border-green-300 dark:border-green-600"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Confirm new password"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <div className="mt-2">
                      {formData.password === formData.confirmPassword ? (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Passwords match ✓
                        </p>
                      ) : (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Passwords do not match
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 2-Step Verification Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              {formData.twoStepVerification ? (
                <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <LockOpen className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              )}
              Two-Step Verification
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {formData.twoStepVerification ? "Enabled" : "Disabled"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {formData.twoStepVerification
                    ? "You'll receive a verification code via email when logging in"
                    : "Add an extra layer of security to your account"}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.twoStepVerification}
                  onChange={(e) => setFormData({ ...formData, twoStepVerification: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-300 after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-700"></div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={
                loading ||
                (formData.password && formData.password.trim() !== "" &&
                  (formData.password !== formData.confirmPassword ||
                    passwordStrength.score < 5 ||
                    !currentPasswordVerified))
              }
              className="px-6 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

