import { useState } from "react";
import { Menu } from "lucide-react";
import SuperAdminSidebar from "../components/SuperAdminSidebar";
import SuperAdminTopBar from "../components/SuperAdminTopBar";

export default function SuperAdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determine if sidebar should be visible (open on mobile, always visible on desktop)
  const isSidebarVisible = sidebarOpen || window.innerWidth >= 1024; // 1024px is lg breakpoint

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <SuperAdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Super Admin Top bar */}
        <SuperAdminTopBar onMenuToggle={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="w-full min-h-full p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile menu button (shown when sidebar is closed on mobile) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-4 right-4 lg:hidden z-30 bg-yellow-600 hover:bg-yellow-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      )}
    </div>
  );
}
