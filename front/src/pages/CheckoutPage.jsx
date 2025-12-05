import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiShoppingCart } from "react-icons/fi";

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [phone, setPhone] = useState("");
  const [selectedTab, setSelectedTab] = useState("local");
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
      const [cartCount, setCartCount] = useState(0); // Track cart items


  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const navigate = useNavigate();

  // Get cart items from localStorage and calculate total
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(cart);

    let totalPrice = 0;
    // Sum the prices of all items in the cart
    cart.forEach((item) => {
      totalPrice += item.price;
    });

    setTotal(totalPrice);
  }, []);

  // Handle Checkout process

 const handleCheckout = () => {
  if (!user) {
    toast.error("Please log in to complete the checkout!");
    return;
  }

  // Fetch the existing purchases to check for pending orders
  fetch("http://localhost:3000/api/purchased")
    .then((res) => res.json())
    .then((responseData) => {
      const existingPurchases = responseData.data || [];
      let canProceed = true;

      // Loop through cartItems and check if the user already has a pending order for the same book
      cartItems.forEach((item) => {
        const alreadyPurchased = existingPurchases.some(
          (purchase) =>
            (purchase.userId === (user._id || user.id)) &&
            (purchase.bookId === (item._id || item.id)) &&
            purchase.status === "pending"
        );

        // If a pending order exists for the same book, prevent checkout
        if (alreadyPurchased) {
          canProceed = false;
          toast.error(`You have a pending order for "${item.title}". Please wait until it is processed.`);
        }
      });

      if (canProceed) {
        // Loop through cartItems and create the purchase order data
        cartItems.forEach((item) => {
          const purchaseData = {
            userId: (user._id || user.id)?.toString(), // Ensure it's a string
            userName: user.name,
            email: user.email?.toLowerCase(), // Normalize email to lowercase
            phone: phone || "", // Include phone number from checkout form
            bookId: (item._id || item.id)?.toString(), // Ensure it's a string
            title: item.title,
            author: item.author,
            cover: item.cover,
            price: item.price,
            paymentmethod: selectedMethod, // Correctly set the selected payment method here
            isFree: item.price === 0,
            pdfUrl: item.pdfUrl,
            status: "pending", // Set status as "pending"
            timestamp: new Date().toISOString(),
          };

          // Send POST request to save purchase data
          fetch("http://localhost:3000/api/purchased", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(purchaseData),
          })
            .then((res) => res.json())
            .then((data) => {
              toast.success("Purchase recorded successfully!");
            })
            .catch((err) => {
              toast.error("Error recording purchase.");
            });
        });

        // Clear cart after successful checkout
        localStorage.removeItem("cart");

        // Dispatch cartUpdated event to notify the Navbar to update the cart count
        window.dispatchEvent(new Event("cartUpdated"));

        // Set flag in sessionStorage to indicate user just completed checkout
        sessionStorage.setItem("justCompletedCheckout", "true");
        sessionStorage.setItem("checkoutTimestamp", new Date().toISOString());

        // Navigate to the "Thank You" page or confirmation
        navigate("/thank-you");
      }
    })
    .catch((err) => {
      toast.error("Error fetching existing purchase data.");
    });
};




  useEffect(() => {
  const updateCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartCount(cart.length); // Update the cart count based on the current cart
  };

  // Listen for the cartUpdated event to update the cart count
  window.addEventListener("cartUpdated", updateCart);

  // Update on first load
  updateCart();

  return () => {
    window.removeEventListener("cartUpdated", updateCart);
  };
}, []);

  // Enable/Disable button based on input fields
  useEffect(() => {
    const isPhoneValid =
      phone.length >= 8 && phone.length <= 15 && !isNaN(phone);
    const isPaymentMethodSelected = selectedMethod !== null;

    if (isPhoneValid && isPaymentMethodSelected) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [phone, selectedMethod]);

  return (
    <div className="py-10 px-6 max-w-7xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-semibold mb-8 text-gray-800">Checkout</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side (Cart items and Total) */}
        <div className="space-y-6 bg-white p-6 shadow-md rounded-lg">
          <h3 className="text-xl font-semibold text-gray-800">Your Cart</h3>
          {cartItems.map((item) => (
            <div
              key={item._id || item.id}
              className="flex items-center justify-between p-4 border rounded-lg shadow-md bg-white mb-4"
            >
              <img
                src={item.cover ? `http://localhost:3000${item.cover}` : 'https://via.placeholder.com/80x112?text=No+Image'}
                alt={item.title}
                className="w-20 h-28 object-cover rounded-md"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/80x112?text=No+Image';
                }}
              />
              <div className="ml-4 flex-grow">
                <h3 className="text-xl font-semibold text-gray-800">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">By {item.author}</p>
                <p className="text-lg font-bold text-blue-600 mt-2">
                  ${item.price.toFixed(2)}{" "}
                  {/* Just display the original price */}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side (Payment Methods and Coupon) */}
        <div className="shadow-md rounded-lg bg-white p-6">
          {/* Payment Methods Tab */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setSelectedTab("local")}
              className={`flex-1 text-center py-3 cursor-pointer font-medium text-sm border-b-2 transition ${
                selectedTab === "local"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Local Payment
            </button>
            <button
              onClick={() => setSelectedTab("online")}
              className={`flex-1 text-center py-3 cursor-pointer font-medium text-sm border-b-2 transition ${
                selectedTab === "online"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Online Payment
            </button>
          </div>

          {/* Local Payment Methods */}
          {selectedTab === "local" && (
            <>
              <h3 className="text-sm font-semibold mb-2 text-gray-700">
                Payment Method
              </h3>
              <div className="space-y-2 mb-6 relative">
                {[
                  "EVC Plus",
                  "ZAAD Service",
                  "Sahal",
                  "EBIR",
                  "Cash on Delivery",
                ].map((method, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedMethod(method)}
                    className={`w-full relative border rounded-lg cursor-pointer p-3 pl-4 text-left text-sm transition flex flex-col ${
                      selectedMethod === method
                        ? "border-blue-600 bg-blue-100"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <span
                      className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 ${
                        selectedMethod === method
                          ? "border-blue-600"
                          : "border-gray-300"
                      } flex items-center justify-center`}
                    >
                      {selectedMethod === method && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </span>
                    <div className="font-medium text-gray-800 flex items-center gap-2">
                      {method}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {method === "Cash on Delivery"
                        ? "Pay when you receive"
                        : `Pay with ${method} mobile money`}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="E.g. 612345678"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>
            </>
          )}

          {/* Online Payment */}
          {selectedTab === "online" && (
            <div className="border rounded-lg p-3 mb-6 border-blue-600 bg-blue-100">
              <div className="font-medium text-gray-800">Credit/Debit Card</div>
              <p className="text-gray-500 text-xs">
                Pay securely using your credit or debit card
              </p>
            </div>
          )}

          {/* Checkout Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCheckout}
              disabled={isButtonDisabled}
              className={`bg-blue-600 text-white py-2 px-8 rounded-md hover:bg-blue-700 transition duration-300 ${
                isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span className="flex items-center">
                <FiShoppingCart className="mr-2" />
                Pay ${total.toFixed(2)} Now
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
