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
    // 1️⃣ If user is not logged in → redirect to login
    if (!user) {
      toast.error("Please log in to view your order details.");
      navigate("/auth");
      return;
    }

    // 2️⃣ Check if user just completed checkout
    const justCompletedCheckout = sessionStorage.getItem("justCompletedCheckout") === "true";
    const checkoutTimestamp = sessionStorage.getItem("checkoutTimestamp");
    
    // 3️⃣ Fetch user purchases from backend
    const userId = (user._id || user.id)?.toString();
    const userEmail = user.email?.toLowerCase();
    
    fetch("http://localhost:3000/api/purchased")
      .then((res) => res.json())
      .then((responseData) => {
        const data = responseData.data || [];
        
        // Filter by userId or email
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
          // Get orders created around the checkout time (within 2 minutes before/after)
          const twoMinutesBefore = new Date(checkoutTime.getTime() - 2 * 60 * 1000);
          const twoMinutesAfter = new Date(checkoutTime.getTime() + 2 * 60 * 1000);
          
          userPurchases = userPurchases.filter((p) => {
            const orderDate = new Date(p.timestamp || p.createdAt);
            return orderDate >= twoMinutesBefore && orderDate <= twoMinutesAfter && p.status === "pending";
          });
          
          // Clear the flag after using it
          sessionStorage.removeItem("justCompletedCheckout");
          sessionStorage.removeItem("checkoutTimestamp");
        } else {
          // If visiting/refreshing without checkout, only show recent pending orders (last 10 minutes)
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
          userPurchases = userPurchases.filter((p) => {
            const orderDate = new Date(p.timestamp || p.createdAt);
            const isRecent = orderDate > tenMinutesAgo;
            const isPending = p.status === "pending";
            return isRecent && isPending;
          });
        }

        // Sort by most recent first
        userPurchases.sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt);
          const dateB = new Date(b.timestamp || b.createdAt);
          return dateB - dateA;
        });

        setOrderDetails(userPurchases);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching purchase data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 shadow-md rounded-lg w-full max-w-2xl p-8 text-center">
          <div className="text-gray-400 mb-6">
            <FiCheckCircle className="text-6xl mx-auto mb-4" />
          </div>

          <h1 className="text-3xl font-semibold text-gray-800 mb-4">
            No Recent Orders Found
          </h1>

          <p className="text-lg text-gray-600 mb-6">
            You haven't placed any orders recently. Start shopping to see your order confirmation here!
          </p>

          <div className="space-x-4 mt-8">
            <button
              onClick={handleReturnToShop}
              className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition"
            >
              Start Shopping
            </button>

            <button
              onClick={handleViewOrders}
              className="bg-gray-700 text-white py-2 px-6 rounded-md hover:bg-gray-800 transition"
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white border border-gray-200 shadow-md rounded-lg w-full max-w-4xl p-6 sm:p-8 text-center">

        <div className="text-green-500 mb-6">
          <FiCheckCircle className="text-6xl mx-auto mb-4" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
          Thank You for Your Purchase, {user?.name}!
        </h1>

        <p className="text-base sm:text-lg text-gray-600 mb-6">
          Your order has been placed successfully. We will notify you once it's processed.
        </p>

        {/* USER INFO */}
        <div className="bg-white border shadow-md p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">Your Information</h2>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Phone:</strong> {orderDetails[0]?.phone || user?.phone || "Not Provided"}</p>
        </div>

        {/* ORDER SUMMARY */}
        {orderDetails.length > 0 && (
          <div className="bg-white border shadow-md p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Order Summary</h2>
            <p><strong>Order ID:</strong> #{orderDetails[0]._id || orderDetails[0].id}</p>
            <p><strong>Total:</strong> ${totalAmount}</p>
            <p><strong>Payment Method:</strong> {orderDetails[0].paymentmethod}</p>
            <p><strong>Status:</strong> {orderDetails[0].status}</p>
          </div>
        )}

        {/* BOOK LIST */}
        <div className="bg-white border shadow p-4 rounded-lg mb-6">
          <h3 className="text-xl font-semibold mb-4">Books in Your Order</h3>

          {orderDetails.length > 0 ? (
            orderDetails.map((item) => (
              <div key={item._id || item.id || item.bookId} className="flex items-center gap-4 mb-4">
                <img
                  src={item.cover ? `http://localhost:3000${item.cover}` : 'https://via.placeholder.com/64x96?text=No+Image'}
                  className="w-16 h-24 rounded-md object-cover"
                  alt={item.title}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/64x96?text=No+Image';
                  }}
                />
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-gray-600">By {item.author}</p>
                <p>${item.price.toFixed(2)}</p>
              </div>
            </div>
            ))
          ) : (
            <p className="text-gray-600">No pending orders found.</p>
          )}
        </div>

        {/* BUTTONS */}
        <div className="space-x-4 mb-3">
          <button
            onClick={handleReturnToShop}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
          >
            Continue Shopping
          </button>

          <button
            onClick={handleViewOrders}
            className="bg-gray-700 text-white py-2 px-6 rounded-md hover:bg-gray-800"
          >
            View Orders
          </button>
        </div>
      </div>
    </div>
  );
}
