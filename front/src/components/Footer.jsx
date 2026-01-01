import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Footer() {
  const [websiteName, setWebsiteName] = useState("BookStore");
  const currentYear = new Date().getFullYear();

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
          setWebsiteName(response.data.data.websiteName || "BookStore");
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

  return (
    <footer className="bg-[#f8f7f7] dark:bg-gray-800 shadow-md rounded-md border border-gray-200 dark:border-gray-700 shaddow text-[#2563eb] dark:text-blue-400 py-6 mt-10 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* Footer logo */}
        <div className="mb-4">
          <h3 className="text-3xl font-semibold text-gray-900 dark:text-white">{websiteName}</h3>
        </div>

        {/* Footer Links */}
        <div className="flex justify-center gap-8 mb-4">
          <a href="/" className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 transition-colors">Home</a>
          <a href="/books" className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 transition-colors">Books</a>
          <a href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 transition-colors">About</a>
          <a href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 transition-colors">Contact</a>
        </div>

        {/* Footer Text */}
        <p className="text-sm text-[#2563eb] dark:text-blue-400 mb-2">
          © {currentYear} {websiteName}. All rights reserved.
        </p>
        <p className="text-sm text-[#2563eb] dark:text-blue-400">
          Powered by <a href="https://github.com/Abdirahmaan12" className="text-[#2563eb] dark:text-blue-400 hover:underline">Samafale</a>
        </p>
      </div>
    </footer>
  );
}
