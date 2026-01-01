import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Settings, Upload, Save, Mail, Phone, MapPin } from "lucide-react";
import { getCurrentAdminUser, canEdit } from "../utils/permissions";
import { handleApiError } from "../utils/apiUtils";

export default function WebsiteSettings() {
  const [settings, setSettings] = useState({
    websiteName: "",
    websiteLogo: "",
    supportEmail: "",
    phoneNumber: "",
    location: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentAdminUser();
      setCurrentUser(user);
    };
    loadUser();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem("admin_token");
      if (!token) {
        console.error("No admin token found");
        return;
      }

      const response = await axios.get("http://localhost:3000/api/website-settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSettings(response.data.data);
        if (response.data.data.websiteLogo) {
          setLogoPreview(`http://localhost:3000${response.data.data.websiteLogo}`);
        }
      }
    } catch (error) {
      handleApiError(error, "website settings");
    } finally {
      setFetching(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("websiteName", settings.websiteName);
      formData.append("supportEmail", settings.supportEmail || "");
      formData.append("phoneNumber", settings.phoneNumber || "");
      // Save location as text to database
      formData.append("location", settings.location ? String(settings.location).trim() : "");
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const token = localStorage.getItem("admin_token");
      if (!token) {
        toast.error("Authentication required. Please login again.");
        setLoading(false);
        return;
      }

      const response = await axios.put(
        "http://localhost:3000/api/website-settings",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Website settings updated successfully!");
        // Update preview if logo was uploaded
        if (logoFile && response.data.data.websiteLogo) {
          setLogoPreview(`http://localhost:3000${response.data.data.websiteLogo}`);
        }
        setLogoFile(null);
        setSettings(response.data.data);
        
        // Dispatch event to update navbar and other components
        window.dispatchEvent(new Event("websiteSettingsUpdated"));
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error(
        error.response?.data?.message || "Failed to update website settings"
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-blue-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Website Settings
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Website Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website Name
            </label>
            <input
              type="text"
              value={settings.websiteName}
              onChange={(e) =>
                setSettings({ ...settings, websiteName: e.target.value })
              }
              className="w-full px-4 py-2 border focus:outline-none border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter website name"
              required
              disabled={!canEdit(currentUser, 'websiteSettings')}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This name will be used across the website and in emails
            </p>
          </div>

          {/* Support Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="inline w-4 h-4 mr-2" />
              Support Email
            </label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) =>
                setSettings({ ...settings, supportEmail: e.target.value })
              }
              className="w-full px-4 py-2 border focus:outline-none border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="support@bookstore.com"
              disabled={!canEdit(currentUser, 'websiteSettings')}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Support email address for customer inquiries
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone className="inline w-4 h-4 mr-2" />
              Phone Number
            </label>
            <input
              type="tel"
              value={settings.phoneNumber}
              onChange={(e) =>
                setSettings({ ...settings, phoneNumber: e.target.value })
              }
              className="w-full px-4 py-2 border focus:outline-none border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="+123 456 789"
              disabled={!canEdit(currentUser, 'websiteSettings')}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Contact phone number for customer support
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="inline w-4 h-4 mr-2" />
              Location
            </label>
            <input
              type="text"
              value={settings.location || ""}
              onChange={(e) =>
                setSettings({ ...settings, location: e.target.value })
              }
              className="w-full px-4 py-2 border focus:outline-none border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Mogadishu - Somalia"
              disabled={!canEdit(currentUser, 'websiteSettings')}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter business location address. It will be saved to database when you click "Save Settings".
            </p>
          </div>

          {/* Website Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website Logo
            </label>
            
            {logoPreview && (
              <div className="mb-4">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="max-w-xs max-h-32 object-contain border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-700"
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 ${
                !canEdit(currentUser, 'websiteSettings') ? 'opacity-50 cursor-not-allowed' : ''
              }`}>
                <Upload size={18} />
                <span>Upload Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  disabled={!canEdit(currentUser, 'websiteSettings')}
                />
              </label>
              {logoFile && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {logoFile.name}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Upload a logo image (max 5MB). This logo will appear in emails and across the website.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !canEdit(currentUser, 'websiteSettings')}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed disabled:hover:bg-blue-400 transition"
              title={!canEdit(currentUser, 'websiteSettings') ? "You don't have permission to edit website settings" : "Save Settings"}
            >
              <Save size={18} />
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Note:
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-400">
          Changes to the website name and logo will be reflected across the entire website, 
          including verification emails, OTP codes, and all public pages. The logo will be 
          automatically included in all email communications sent to users.
        </p>
      </div>
    </div>
  );
}

