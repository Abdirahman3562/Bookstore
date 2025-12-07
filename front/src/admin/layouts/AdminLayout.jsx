import { useEffect, useState } from "react";
import { Menu, Globe } from "lucide-react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [websiteSettings, setWebsiteSettings] = useState({
    websiteName: "Admin Panel",
  });

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      window.location.href = "/admin";
    }
  }, []);

  // Fetch website settings
  useEffect(() => {
    const fetchWebsiteSettings = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/website-settings");
        if (response.data.success) {
          setWebsiteSettings({
            websiteName: response.data.data.websiteName || "Admin Panel",
          });
        }
      } catch (error) {
        console.error("Error fetching website settings:", error);
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content - Takes remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Top Bar */}
        <TopBar />

        {/* Mobile Header */}
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{websiteSettings.websiteName}</h1>
          </div>
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto scrollbar-hide bg-white dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
