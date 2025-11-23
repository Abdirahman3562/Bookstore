import { useState } from "react";
import {
  FiHome,
  FiShoppingCart,
  FiDownload,
  FiMapPin,
  FiUser,
  FiLogOut,
  FiX,
  FiMenu,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DownloadsTab from "../components/Dashboard/DownloadsTab"; // Ensure DownloadsTab is imported properly

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const isMobile = window.innerWidth < 768; // MD breakpoint

  const handleTabClick = (tab) => {
    setActiveTab(tab);

    // Close sidebar when on mobile
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success("Logged out!");
    navigate("/auth");
  };

  const getButtonClass = (tabKey) =>
    `flex items-center gap-2 p-2 border-b border-gray-300 rounded hover:bg-gray-100 ${
      activeTab === tabKey ? "bg-blue-100 font-bold" : ""
    }`;

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />;
      case "orders":
        return <OrdersTab />;
      case "downloads":
        return <DownloadsTab />; // Correctly rendering the DownloadsTab component
      case "addresses":
        return <AddressesTab />;
      case "account":
        return <AccountTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="flex min-h-screen bg-white pt-10">
      {/* MOBILE TOGGLE BUTTON */}
      <button
        className="md:hidden p-3 text-xl absolute right-2 top-20 bg-gray-200 rounded"
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      >
        {isMobileSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`bg-white border shadow-md text-[#2563eb] p-4 flex flex-col gap-2 rounded w-64 md:flex ${isMobileSidebarOpen ? "block" : "hidden"}`}
      >
        <button onClick={() => handleTabClick("dashboard")} className={getButtonClass("dashboard")}>
          <FiHome /> Dashboard
        </button>
        <button onClick={() => handleTabClick("orders")} className={getButtonClass("orders")}>
          <FiShoppingCart /> Orders
        </button>
        <button onClick={() => handleTabClick("downloads")} className={getButtonClass("downloads")}>
          <FiDownload /> Downloads
        </button>
        <button onClick={() => handleTabClick("addresses")} className={getButtonClass("addresses")}>
          <FiMapPin /> Addresses
        </button>
        <button onClick={() => handleTabClick("account")} className={getButtonClass("account")}>
          <FiUser /> Account Details
        </button>
        <button onClick={handleLogout} className={getButtonClass("logout")}>
          <FiLogOut /> Log Out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8">{renderContent()}</main>
    </div>
  );
}

function DashboardTab() {
  return <div>Welcome to your dashboard</div>;
}

function OrdersTab() {
  return <div>Your orders will appear here</div>;
}

function AddressesTab() {
  return <div>Your saved addresses will appear here</div>;
}

function AccountTab() {
  return <div>Your account details go here</div>;
}
