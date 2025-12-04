import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
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
import DownloadsTab from "../components/Dashboard/DownloadsTab";
import OrdersTab from "../components/Dashboard/OrdersTab";
import OrderDetails from "../components/Dashboard/OrderDetails";
import DashboardTab from "../components/Dashboard/DashboardTab";
import AccountDetails  from "../components/Dashboard/AccountDetails";



export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    const path = location.pathname;

    if (path === "/dashboard") {
      setActiveTab("dashboard");
      return;
    }

    if (path.includes("/dashboard/orderdetails")) {
      setActiveTab("orderdetails");
      return;
    }

    if (path.includes("/dashboard/orders")) {
      setActiveTab("orders");
      return;
    }

    if (path.includes("/dashboard/downloads")) {
      setActiveTab("downloads");
      return;
    }

   

    if (path.includes("/dashboard/account")) {
      setActiveTab("account");
      return;
    }
  }, [location.pathname]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    navigate(`/dashboard/${tab}`);

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
      case "orders":
        return <OrdersTab />;
      case "orderdetails":
        return <OrderDetails />;
      case "downloads":
        return <DownloadsTab />;
     
      case "account":
        return <AccountDetails />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="flex min-h-screen bg-white pt-10">
      {/* MOBILE OVERLAY BACKGROUND */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-[998] md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      {/* MOBILE TOGGLE BUTTON */}
      <button
        className="md:hidden py-2 px-2 mt-10 text-xl absolute right-2 top-20  rounded z-[1000]"
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      >
        {isMobileSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* SIDEBAR */}
      <aside
        className={`
          bg-white border shadow-md text-[#2563eb] p-4 flex flex-col gap-2
          w-52 h-full fixed top-0 left-0 z-[999]
          transform transition-transform duration-300
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:h-auto md:flex md:rounded
        `}
      >
        <button
          onClick={() => {
            navigate("/dashboard");
            setActiveTab("dashboard");
            if (isMobile) setIsMobileSidebarOpen(false); // ✔ XALKA CUSUB
          }}
          className={getButtonClass("dashboard")}
        >
          <FiHome /> Dashboard
        </button>

        <button
          onClick={() => handleTabClick("orders")}
          className={getButtonClass("orders")}
        >
          <FiShoppingCart /> Orders
        </button>

        <button
          onClick={() => handleTabClick("orderdetails")}
          className={getButtonClass("orderdetails")}
        >
          <FiShoppingCart /> Order Details
        </button>

        <button
          onClick={() => handleTabClick("downloads")}
          className={getButtonClass("downloads")}
        >
          <FiDownload /> Downloads
        </button>

      

        <button
          onClick={() => handleTabClick("account")}
          className={getButtonClass("account")}
        >
          <FiUser /> Account Details
        </button>

        <button onClick={handleLogout} className={getButtonClass("logout")}>
          <FiLogOut /> Log Out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-8 py-4  md:ml-0 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}






