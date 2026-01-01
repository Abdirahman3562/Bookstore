import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiClock, FiLoader, FiCheckCircle } from "react-icons/fi";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Get authentication token (admin_token takes priority, then user token)
        const adminToken = localStorage.getItem("admin_token");
        const userToken = localStorage.getItem("token");
        const token = adminToken || userToken;

        if (!token) {
          console.error("No authentication token found");
          setLoading(false);
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`
        };

        const res = await fetch("http://localhost:3000/api/purchased", { headers });
        const responseData = await res.json();
        const data = responseData.data || [];

        if (id) {
          const found = data.find((o) => (o._id || o.id) == id || (o._id || o.id)?.toString() === id);
          setOrder(found || null);
        }

        setTimeout(() => setLoading(false), 800);
      } catch (error) {
        console.error("Error fetching order:", error);
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // ⭐ SAME BADGE AS ORDERS TAB
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 text-xs rounded">
            <FiClock /> Pending
          </span>
        );
      case "active":
      case "processing":
        return (
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs rounded">
            <FiLoader /> {status}
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs rounded">
            <FiCheckCircle /> Completed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  // ❌ No ID
  if (!id) {
    return (
      <div className="p-6 text-center border border-gray-200 dark:border-gray-700 rounded-lg shadow-md bg-white dark:bg-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-3">No order selected.</p>
      </div>
    );
  }

  // 🔄 Loading Spinner
  if (loading) {
    return (
      <div className="flex border border-gray-300 dark:border-gray-700 shadow-md rounded-lg justify-center items-center py-10 bg-white dark:bg-gray-800">
        <svg className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" viewBox="0 0 50 50">
          <circle className="opacity-25" cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" fill="none" />
          <circle className="opacity-75" cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" strokeDasharray="31.4 188.4" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    );
  }

  // ❌ Order Not Found
  if (!order) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h1>
        <p className="text-red-500 dark:text-red-400 mt-3">Order not found.</p>
      </div>
    );
  }

  // 📅 Format Date
  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="p-2">
      <h1 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Order Details</h1>

      <div className="p-5 border dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition bg-white dark:bg-gray-800">
        
        {/* IMAGE + DETAILS */}
        <div className="flex flex-col md:flex-row gap-5">

          <img
            src={order.cover ? `http://localhost:3000${order.cover}` : 'https://via.placeholder.com/200x300?text=No+Image'}
            className="lg:w-32 md:w-32 w-full lg:h-44 md:h-32 h-auto object-cover rounded-md shadow"
            alt={order.title}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/200x300?text=No+Image';
            }}
          />

          <div className="flex-1">
            <div className="flex lg:flex-row md:flex-row flex-col lg:justify-between md:justify-between items-start lg:items-center md:items-center">
              
              <h2 className="lg:text-lg md:text-lg text-[20px] font-bold text-gray-900 dark:text-white">{order.title}</h2>

              {/* ⭐ STATUS BADGE */}
              <div className="mt-2">{getStatusBadge(order.status)}</div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">by {order.author}</p>

            <p className="mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Price: </span>
              <span className="font-semibold text-gray-900 dark:text-white">${order.price}</span>
            </p>

            <p className="mt-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">Payment Method: </span>
              <span className="text-gray-900 dark:text-white">{order.paymentmethod}</span>
            </p>

            <p className="mt-2 flex items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Date: </span>
              <span className="ml-2 bg-blue-600 dark:bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">
                {formatDate(order.timestamp)}
              </span>
            </p>
          </div>
        </div>

        {/* ID + BACK BUTTON */}
        <div className="flex flex-col gap-2 lg:flex-row md:flex-row justify-between mt-5">
          <div className="flex gap-1 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded-md shadow-md mt-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
            <span>Order ID:</span>
            <span>#{order._id || order.id}</span>
          </div>

          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Back to Orders
          </button>
        </div>

      </div>
    </div>
  );
}
