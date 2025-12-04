import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      window.location.href = "/admin";
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content - Takes remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Bar */}
        <TopBar />

        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
