import { useNavigate } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import { useEffect, useState } from "react";

export default function ThankYouPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [orderDetails, setOrderDetails] = useState([]);

  useEffect(() => {
    // Fetch purchase data after successful checkout
    fetch("http://localhost:5001/purchased")
      .then((res) => res.json())
      .then((data) => {
        const userPurchases = data.filter(
          (purchase) =>
            purchase.userId === user.id && purchase.status === "pending"
        );
        setOrderDetails(userPurchases);
      })
      .catch((error) => {
        console.error("Error fetching purchase data:", error);
      });
  }, []);

  const handleReturnToShop = () => {
    navigate("/"); // Navigate to the homepage or shop page
  };

   const handleViewOrders = () => {
    // Navigate to the Dashboard and set the active tab to "orders"
    navigate("/dashboard");
  };

  const totalAmount = orderDetails
    .reduce((total, item) => total + item.price, 0)
    .toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 shadow-md w-full pt-4 text-center">
        {/* Icon and Heading */}
        <div className="text-green-500 mb-6">
          <FiCheckCircle className="text-6xl mx-auto mb-4" />
        </div>
        <h1 className="text-3xl font-semibold text-gray-800 mb-4">
          Thank You for Your Purchase, {user?.name}!
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Your order has been successfully placed. We're processing it and will
          notify you once it's ready.
        </p>

        {/* User Information */}
        <div className="bg-white border border-gray-200 shadow-md p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Your Information
          </h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>Name:</strong> {user?.name}
            </p>
            <p className="text-gray-700">
              <strong>Email:</strong> {user?.email}
            </p>
            <p className="text-gray-700">
              <strong>Phone:</strong> {user?.phone || "Not Provided"}
            </p>
          </div>
        </div>

        {/* Order Summary or No Orders Message */}
        {orderDetails.length === 0 ? (
          <div className="bg-white border border-gray-200 shadow-md p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No Orders Found
            </h2>
            <p className="text-gray-600">
              You don't have any pending orders. Start shopping now!
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 shadow-md p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Order Summary
            </h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <strong>Order ID:</strong> #{orderDetails[0]?.id || "N/A"}
              </p>
              <p className="text-gray-700">
                <strong>Total:</strong> ${totalAmount}
              </p>
              <p className="text-gray-700">
                <strong>Payment Method:</strong>{" "}
                {orderDetails[0]?.paymentMethod || "Not Provided"}
              </p>
              <p className="text-gray-700">
                <strong>Status:</strong> {orderDetails[0]?.status || "Pending"}
              </p>
            </div>
          </div>
        )}

        {/* Book List */}
        {orderDetails.length > 0 && (
          <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Books in Your Order
            </h3>
            <div className="space-y-4">
              {orderDetails.map((item) => (
                <div key={item.bookId} className="flex items-center space-x-4">
                  <img
                    src={item.cover}
                    alt={item.title}
                    className="w-16 h-24 object-cover rounded-md"
                  />
                  <div className="flex-grow">
                    <p className="text-lg font-semibold text-gray-800">
                      {item.title}
                    </p>
                    <p className="text-gray-600">By {item.author}</p>
                    <p className="text-gray-700">${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="space-x-4 mb-3">
          <button
            onClick={handleReturnToShop}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition"
          >
            Continue Shopping
          </button>
          <button
            onClick={handleViewOrders}
            className="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700 transition"
          >
            View Orders
          </button>
        </div>
      </div>
    </div>
  );
}
