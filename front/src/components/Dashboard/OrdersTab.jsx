import { useEffect, useState } from "react";
import { FiClock, FiCheckCircle, FiLoader } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
  const fetchOrders = async () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setError("Please log in to see your orders.");
        setLoading(false);
        return;
      }

      const user = JSON.parse(storedUser);
      const userId = (user._id || user.id)?.toString(); // Convert to string for comparison
      const userEmail = user.email?.toLowerCase(); // Normalize email to lowercase

      const res = await fetch("http://localhost:3000/api/purchased");
      const responseData = await res.json();

      const data = responseData.data || [];
      
      // More robust filtering - check both userId and email (case-insensitive)
      const userOrders = data.filter((order) => {
        const orderUserId = order.userId?.toString();
        const orderEmail = order.email?.toLowerCase();
        
        return (
          orderUserId === userId ||
          orderEmail === userEmail ||
          (order.userId && order.userId.toString() === userId) ||
          (order.email && order.email.toLowerCase() === userEmail)
        );
      });
      
      console.log("User ID:", userId, "User Email:", userEmail);
      console.log("All orders:", data.length, "User orders:", userOrders.length);

      setOrders(userOrders);

      // ⏳ Delay-ka loading-ka (10 seconds)
      setTimeout(() => {
        setLoading(false);
      }, 1000); // 10 seconds

    } catch (err) {
      setError("Something went wrong.");
      setLoading(false);
    }
  };

  fetchOrders();
}, []);


  const formatDate = (date) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(date).toLocaleDateString("en-US", options);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-2 py-1 text-xs rounded">
            <FiClock /> Pending
          </span>
        );
      case "active":
      case "processing":
        return (
          <span className="flex items-center gap-1 text-blue-600 bg-blue-100 px-2 py-1 text-xs rounded">
            <FiLoader /> {status}
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 text-xs rounded">
            <FiCheckCircle /> Completed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  // ❌ Show error
  if (error) {
    return (
      <div className="text-center text-red-500 font-semibold py-10">
        {error}
      </div>
    );
  }

  // 🔄 LOADING FULL PAGE SPINNER
  if (loading) {
    return (
      <div className="flex  border border-gray-300 shadow-md  rounded-lg justify-center items-center py-10">
        <svg
          className="h-12 w-12 animate-spin text-blue-600"
          viewBox="0 0 50 50"
        >
          <circle
            className="opacity-25"
            cx="25"
            cy="25"
            r="20"
            stroke="currentColor"
            strokeWidth="5"
            fill="none"
          />
          <circle
            className="opacity-75"
            cx="25"
            cy="25"
            r="20"
            stroke="currentColor"
            strokeWidth="5"
            strokeDasharray="31.4 188.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  // 🛒 NO ORDERS
  if (orders.length === 0) {
    return (
      <div className="border border-gray-200 rounded-md bg-white py-10 flex flex-col items-center justify-center text-center">
        <h2 className="text-[16px] font-semibold text-gray-800">
          No orders found
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          You haven't placed any orders yet.
        </p>

        <button
          onClick={() => navigate("/books")}
          className="mt-4 px-4 py-2 text-sm font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-500 transition"
        >
          Add new Order
        </button>
      </div>
    );
  }

  // 📦 SHOW ORDERS LIST
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Your Orders</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order._id || order.id}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-4"
          >
            {/* IMAGE */}
            <img
              src={order.cover ? `http://localhost:3000${order.cover}` : 'https://via.placeholder.com/200x300?text=No+Image'}
              className="lg:w-28 md:w-24 w-full lg:h-36 md:h-32 h-auto object-cover rounded mx-auto md:mx-0"
              alt={order.title}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/200x300?text=No+Image';
              }}
            />

            {/* TEXT */}
            <div className="flex-1 lg:text-left ml-2">
              <h3 className="text-lg font-semibold">{order.title}</h3>
              <p className="text-sm text-gray-500">by {order.author}</p>

              <p className="mt-2">
                <span className="text-sm text-gray-500">Price: </span>
                <span className="font-semibold">${order.price}</span>
              </p>

              <p className="mt-1">
                <span className="text-sm text-gray-500">Payment Method: </span>
                {order.paymentmethod}
              </p>

              <p className="mt-1">
                <span className="text-sm text-gray-500">Date: </span>
                <span className="bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold px-1 ml-1 rounded-md shadow-md">
                  {formatDate(order.timestamp)}
                </span>
              </p>
            </div>

            <div className="flex flex-row md:flex-col justify-between items-center gap-2">
              {getStatusBadge(order.status)}

              <button
                onClick={() =>
                  navigate(`/dashboard/orderdetails/${order._id || order.id}`)
                }
                className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 w-[100px] md:w-auto lg:mt-20"
              >
                View details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
