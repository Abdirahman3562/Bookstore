// DashboardLayout.jsx
import { useState } from "react";
import {
  FiHome,
  FiShoppingCart,
  FiDownload,
  FiMapPin,
  FiUser,
  FiLogOut,
} from "react-icons/fi";
import toast from "react-hot-toast";

import { Link, useNavigate } from "react-router-dom";

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
 const navigate = useNavigate(); 
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />;
      case "orders":
        return <OrdersTab />;
      case "downloads":
        return <DownloadsTab />;
      case "addresses":
        return <AddressesTab />;
      case "account":
        return <AccountTab />;
      default:
        return <DashboardTab />;
    }
  };

   const handleLogout = () => {
    // Remove user session
    localStorage.removeItem("user");
        toast.success("Logged out!");

    // Redirect to auth page
    navigate("/auth");
  };

  const getButtonClass = (tabKey) =>
    `flex items-center gap-2 p-2 border-b border-gray-300 rounded hover:bg-gray-100 ${
      activeTab === tabKey ? "bg-blue-100 font-bold" : ""
    }`;

  return (
    <div className="flex min-h-screen bg-white pt-10">
      {/* Sidebar */}
      <aside className="w-64 bg-white border border-gray-100 shadow-md text-[#2563eb] p-4 flex flex-col gap-2 rounded">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={getButtonClass("dashboard")}
        >
          <FiHome /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={getButtonClass("orders")}
        >
          <FiShoppingCart /> Orders
        </button>
        <button
          onClick={() => setActiveTab("downloads")}
          className={getButtonClass("downloads")}
        >
          <FiDownload /> Downloads
        </button>
        <button
          onClick={() => setActiveTab("addresses")}
          className={getButtonClass("addresses")}
        >
          <FiMapPin /> Addresses
        </button>
        <button
          onClick={() => setActiveTab("account")}
          className={getButtonClass("account")}
        >
          <FiUser /> Account Details
        </button>
        <button
        onClick={handleLogout} 
          className={getButtonClass("logout")}
        >
          <FiLogOut /> Log Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{renderContent()}</main>
    </div>
  );
}

// Example tab component
function DashboardTab() {
  return <div>Welcome to your dashboard</div>;
}
function OrdersTab() {
  return <div>Your orders will appear here</div>;
}
function DownloadsTab() {
  return <div>Your downloads will appear here</div>;
}
function AddressesTab() {
  return <div>Your saved addresses will appear here</div>;
}
function AccountTab() {
  return <div>Your account details go here</div>;
}
