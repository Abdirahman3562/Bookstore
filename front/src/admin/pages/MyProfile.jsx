import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { handleApiError } from "../utils/apiUtils";
import { User, Mail, Key, Camera, Save, Shield, Eye, EyeOff, Lock, LockOpen } from "lucide-react";

export default function MyProfile() {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
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
      const token = localStorage.getItem("admin_token");

      if (!token) {
        console.log("No admin token found");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`
      };

      if (adminEmail) {
        // Try to get current admin profile (includes password)
        try {
          console.log("Fetching admin profile with email:", adminEmail);
          const profileResponse = await axios.get("http://localhost:3000/api/admins/profile", { headers });
          const admin = profileResponse.data.data;

          if (admin) {
            console.log("Admin profile fetched successfully:", {
              name: admin.name,
              email: admin.email,
              hasPassword: !!admin.password,
              passwordLength: admin.password ? admin.password.length : 0
            });

            setCurrentUser(admin);
            setFormData({
              name: admin.name || "",
              email: admin.email || "",
              password: admin.password || "••••••••", // Show actual password or masked if not available
              avatar: admin.avatar || "",
              twoStepVerification: admin.twoStepVerification || false
            });
            setAvatarPreview(admin.avatar || "");
            return;
          }
        } catch (error) {
          console.log("Admin profile API not available, trying fallback methods");
        }

        // Fallback: Try admins API first
        try {
          const adminsResponse = await axios.get("http://localhost:3000/api/admins", { headers });
          const admins = adminsResponse.data.data || [];
          const admin = admins.find(a => a.email === adminEmail);
          if (admin) {
            setCurrentUser(admin);
            setFormData({
              name: admin.name || "",
              email: admin.email || "",
              password: admin.password || "••••••••", // Show masked password or actual if returned
              avatar: admin.avatar || "",
              twoStepVerification: admin.twoStepVerification || false
            });
            setAvatarPreview(admin.avatar || "");
            return;
          }
        } catch (error) {
          console.log("Admins API not available");
        }

        // Final fallback to users API
        const usersResponse = await axios.get("http://localhost:3000/api/users", { headers });
        const users = usersResponse.data.data || [];
        const user = users.find(u => u.email === adminEmail);
        if (user) {
          setCurrentUser(user);
          setFormData({
            name: user.name || "",
            email: user.email || "",
            password: user.password || "••••••••", // Show masked password or actual if returned
            avatar: user.avatar || "",
            twoStepVerification: user.twoStepVerification || false
          });
          setAvatarPreview(user.avatar || "");
        }
      }
    } catch (error) {
      handleApiError(error, "profile");
    }
  };

  // Password strength validation

  // Calculate password strength

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
        note: "Name, email, and password fields are disabled"
      });

      // Password is disabled, no password validation needed
      // All password-related validations are removed

      const updateData = {
        twoStepVerification: formData.twoStepVerification
        // Note: name and email are disabled, password is also disabled
      };

      // Password is disabled, so we won't include it in updates
      // if (formData.password && formData.password.trim() !== "") {
      //   updateData.password = formData.password;
      // }

      if (formData.avatar && formData.avatar.trim() !== "") {
        updateData.avatar = formData.avatar;
      }

      console.log("Update data being sent:", { ...updateData, password: updateData.password ? "***" : undefined });

      // Determine if user is from admins or users collection
      const adminEmail = localStorage.getItem("admin_email");
      let response;

      // Get authentication token
      const token = localStorage.getItem("admin_token");
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`
      };

      // Try to update using profile endpoint first
      try {
        console.log("Trying to update admin profile directly");
        response = await axios.put("http://localhost:3000/api/admins/profile", updateData, { headers });
        console.log("Profile update response:", response.data);
        localStorage.setItem("admin_email", formData.email); // Update stored email
      } catch (profileError) {
        console.log("Profile update failed, trying alternative methods:", profileError.message);

        // Fallback: Try admins API first
        console.log("Trying admins API with email:", adminEmail);
        try {
          const adminsResponse = await axios.get("http://localhost:3000/api/admins", { headers });
          console.log("Admins API response:", adminsResponse.data);
          const admins = adminsResponse.data.data || [];
          console.log("Found", admins.length, "admins");

          const admin = admins.find(a => a.email === adminEmail);
          console.log("Admin found in admins collection:", admin ? "YES" : "NO");

          if (admin) {
            // Update in admins collection
            console.log("Updating admin:", admin._id);
            response = await axios.put(`http://localhost:3000/api/admins/${admin._id}`, updateData, { headers });
            console.log("Admin update response:", response.data);
            localStorage.setItem("admin_email", formData.email); // Update stored email
          } else {
            console.log("Admin not found in admins collection. Available admin emails:", admins.map(a => a.email));
            throw new Error("Not in admins");
          }
        } catch (error) {
          // Fallback to users API
          console.log("Admins API failed:", error.message);
          console.log("Trying users API with email:", adminEmail);
          const usersResponse = await axios.get("http://localhost:3000/api/users", { headers });
          console.log("Users API response:", usersResponse.data);
          const users = usersResponse.data.data || [];
          console.log("Found", users.length, "users");

          const user = users.find(u => u.email === adminEmail);
          console.log("User found in users collection:", user ? "YES" : "NO");

          if (user) {
            console.log("Updating user:", user._id);
            response = await axios.put(`http://localhost:3000/api/users/${user._id}`, updateData, { headers });
            console.log("User update response:", response.data);
            localStorage.setItem("admin_email", formData.email);
          } else {
            console.log("User not found in users collection. Admin email:", adminEmail);
            console.log("Available user emails:", users.map(u => u.email));
            throw new Error("User not found");
          }
        }
      }

      // Check if update was successful (handle both success field and status)
      if (response.data.success !== false && response.status >= 200 && response.status < 300) {
        toast.success("Profile updated successfully!");
        // Password field is read-only, no need to reset
        await fetchCurrentUser();
        
        // Get updated user data from response or use formData
        const updatedUser = response.data.data || response.data;
        const updatedAvatar = updatedUser?.avatar || formData.avatar || currentUser?.avatar;
        
        // Notify TopBar to update user data
        const profileUpdateData = {
          name: updatedUser?.name || formData.name,
          email: updatedUser?.email || formData.email,
          avatar: updatedAvatar
        };
        console.log("📢 MyProfile: Dispatching profile update event with:", profileUpdateData);

        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: profileUpdateData
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
          Manage your security settings (Two-Step Verification)
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
              readOnly
              disabled
              value={formData.name}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
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
              readOnly
              disabled
              value={formData.email}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              placeholder="your@email.com"
            />
          </div>

          {/* Password Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-gray-400" />
              Current Password
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your current password. Password changes are disabled - contact administrator if needed.
            </p>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Key className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                readOnly
                disabled
                value={formData.password}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                placeholder="Password not available"
              />
            </div>
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
              disabled={loading}
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

