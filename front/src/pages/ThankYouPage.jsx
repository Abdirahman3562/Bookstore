import { useNavigate } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ThankYouPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // 1️⃣ If user is not logged in → redirect to login
        if (!user) {
          toast.error("Please log in to view your order details.");
          navigate("/auth");
          return;
        }

        // Get authentication token (admin_token takes priority, then user token)
        const adminToken = localStorage.getItem("admin_token");
        const userToken = localStorage.getItem("token");
        const token = adminToken || userToken;

        if (!token) {
          toast.error("Authentication required. Please log in again.");
          navigate("/auth");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`
        };

        // 2️⃣ Check if user just completed checkout
        const justCompletedCheckout = sessionStorage.getItem("justCompletedCheckout") === "true";
        const checkoutTimestamp = sessionStorage.getItem("checkoutTimestamp");

        // 3️⃣ Fetch user purchases from backend
        const userId = (user._id || user.id)?.toString();
        const userEmail = user.email?.toLowerCase();

        const res = await fetch("http://localhost:3000/api/purchased", { headers });
        const responseData = await res.json();

        if (!responseData.success) {
          throw new Error("Failed to fetch order data");
        }

        const data = responseData.data || [];

        // Filter by userId or email with robust matching
        let userPurchases = data.filter((p) => {
          const orderUserId = p.userId?.toString();
          const orderEmail = p.email?.toLowerCase();
          return (
            orderUserId === userId ||
            orderEmail === userEmail ||
            (p.userId && p.userId.toString() === userId) ||
            (p.email && p.email.toLowerCase() === userEmail)
          );
        });

        // If user just completed checkout, show their most recent pending orders
        if (justCompletedCheckout && checkoutTimestamp) {
          const checkoutTime = new Date(checkoutTimestamp);
          // Get orders created around the checkout time (within 10 minutes for reliability)
          const tenMinutesBefore = new Date(checkoutTime.getTime() - 10 * 60 * 1000);
          const tenMinutesAfter = new Date(checkoutTime.getTime() + 10 * 60 * 1000);

          userPurchases = userPurchases.filter((p) => {
            const orderDate = new Date(p.timestamp || p.createdAt);
            return orderDate >= tenMinutesBefore && orderDate <= tenMinutesAfter && p.status === "pending";
          });

          // Clear the flag after using it
          sessionStorage.removeItem("justCompletedCheckout");
          sessionStorage.removeItem("checkoutTimestamp");

          // If no recent orders found but user just checked out, show all pending orders
          if (userPurchases.length === 0) {
            userPurchases = data.filter((p) => {
              const orderUserId = p.userId?.toString();
              const orderEmail = p.email?.toLowerCase();
              return (
                (orderUserId === userId || orderEmail === userEmail) &&
                p.status === "pending"
              );
            });
          }
        } else {
          // If visiting/refreshing without checkout, show all pending orders for this user
          userPurchases = userPurchases.filter((p) => p.status === "pending");
        }

        // Sort by most recent first
        userPurchases.sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt);
          const dateB = new Date(b.timestamp || b.createdAt);
          return dateB - dateA;
        });

        setOrderDetails(userPurchases);

        // Success toast already shown in checkout, no need to show again
        // The checkout page already shows success toast when order is completed
      } catch (error) {
        console.error("Error fetching purchase data:", error);
        toast.error("Failed to load order details. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  const handleReturnToShop = () => navigate("/");
  const handleViewOrders = () => navigate("/dashboard");

  const totalAmount = orderDetails.length > 0
    ? orderDetails.reduce((total, item) => total + item.price, 0).toFixed(2)
    : "0.00";

  // If no orders found, show different design
  if (orderDetails.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors duration-200">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-lg w-full max-w-2xl p-8 text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-6">
            <FiCheckCircle className="text-6xl mx-auto mb-4" />
          </div>

          <h1 className="text-3xl font-semibold text-gray-800 dark:text-white mb-4">
            No Recent Orders Found
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            You haven't placed any orders recently. Start shopping to see your order confirmation here!
          </p>

          <div className="space-x-4 mt-8">
            <button
              onClick={handleReturnToShop}
              className="bg-blue-600 dark:bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition"
            >
              Start Shopping
            </button>

            <button
              onClick={handleViewOrders}
              className="bg-gray-700 dark:bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-800 dark:hover:bg-gray-700 transition"
            >
              View All Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show thank you page with order details
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-lg w-full max-w-4xl p-6 sm:p-8 text-center">

        <div className="text-green-500 dark:text-green-400 mb-6">
          <FiCheckCircle className="text-6xl mx-auto mb-4" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white mb-4">
          Thank You for Your Purchase, {user?.name}!
        </h1>

        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6">
          Your order has been placed successfully. We will notify you once it's processed.
        </p>

        {/* USER INFO */}
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-md p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Your Information</h2>
          <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Name:</strong> {user?.name}</p>
          <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Email:</strong> {user?.email}</p>
          <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Phone:</strong> {orderDetails[0]?.phone || user?.phone || "Not Provided"}</p>
        </div>

        {/* ORDER SUMMARY */}
        {orderDetails.length > 0 && (
          <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-md p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Order Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Total Items:</strong> {orderDetails.length}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Total Amount:</strong> ${totalAmount}</p>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Payment Method:</strong> {orderDetails[0].paymentmethod}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Status:</strong>
                  <span className="ml-2 px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                    {orderDetails[0].status}
                  </span>
                </p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mt-2"><strong className="text-gray-900 dark:text-white">Order Date:</strong> {new Date(orderDetails[0].timestamp || orderDetails[0].createdAt).toLocaleString()}</p>
          </div>
        )}

        {/* BOOK LIST */}
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow p-4 rounded-lg mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Books in Your Order ({orderDetails.length})</h3>

          {orderDetails.length > 0 ? (
            <div className="space-y-4">
              {orderDetails.map((item, index) => (
                <div key={item._id || item.id || item.bookId || index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                  <div className="flex-shrink-0">
                    <img
                      src={item.cover ? `http://localhost:3000${item.cover}` : 'https://via.placeholder.com/64x96?text=No+Image'}
                      className="w-16 h-24 rounded-md object-cover shadow-sm"
                      alt={item.title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/64x96?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-2">{item.title}</p>
                        <p className="text-gray-600 dark:text-gray-400">By {item.author}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Order ID: #{item._id || item.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">${item.price.toFixed(2)}</p>
                        <span className="inline-block px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 mt-1">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 text-lg">No pending orders found.</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Your orders may have been processed already.</p>
            </div>
          )}
        </div>

        {/* BUTTONS */}
        <div className="space-x-4 mb-3">
          <button
            onClick={handleReturnToShop}
            className="bg-blue-600 dark:bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition"
          >
            Continue Shopping
          </button>

          <button
            onClick={handleViewOrders}
            className="bg-gray-700 dark:bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-800 dark:hover:bg-gray-700 transition"
          >
            View Orders
          </button>
        </div>
      </div>
    </div>
  );
}
