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

    // 2️⃣ Fetch user purchases
    fetch("http://localhost:5001/purchased")
      .then((res) => res.json())
      .then((data) => {
        const userPurchases = data.filter(
          (p) => p.userId === user.id && p.status === "pending"
        );

        setOrderDetails(userPurchases);
        setLoading(false);

        // 3️⃣ If user is logged in BUT has no pending order → redirect home
        if (userPurchases.length === 0) {
          toast.error("No recent orders found.");
          navigate("/books");
        }
      })
      .catch((error) => {
        console.error("Error fetching purchase data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  const handleReturnToShop = () => navigate("/");
  const handleViewOrders = () => navigate("/dashboard");

  const totalAmount = orderDetails
    .reduce((total, item) => total + item.price, 0)
    .toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 shadow-md w-full pt-4 text-center">

        <div className="text-green-500 mb-6">
          <FiCheckCircle className="text-6xl mx-auto mb-4" />
        </div>

        <h1 className="text-3xl font-semibold text-gray-800 mb-4">
          Thank You for Your Purchase, {user?.name}!
        </h1>

        <p className="text-lg text-gray-600 mb-6">
          Your order has been placed. We will notify you once it’s processed.
        </p>

        {/* USER INFO */}
        <div className="bg-white border shadow-md p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">Your Information</h2>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Phone:</strong> {user?.phone || "Not Provided"}</p>
        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-white border shadow-md p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">Order Summary</h2>
          <p><strong>Order ID:</strong> #{orderDetails[0].id}</p>
          <p><strong>Total:</strong> ${totalAmount}</p>
          <p><strong>Payment Method:</strong> {orderDetails[0].paymentmethod}</p>
          <p><strong>Status:</strong> {orderDetails[0].status}</p>
        </div>

        {/* BOOK LIST */}
        <div className="bg-white border shadow p-4 rounded-lg mb-6">
          <h3 className="text-xl font-semibold mb-4">Books in Your Order</h3>

          {orderDetails.map((item) => (
            <div key={item.bookId} className="flex items-center gap-4 mb-4">
              <img
                src={item.cover}
                className="w-16 h-24 rounded-md object-cover"
              />
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-gray-600">By {item.author}</p>
                <p>${item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
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
