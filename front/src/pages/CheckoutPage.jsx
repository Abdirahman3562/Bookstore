import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ShoppingCart, ArrowLeft, CreditCard, Smartphone, Package, DollarSign, CheckCircle2, Lock } from "lucide-react";

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [phone, setPhone] = useState("");
  const [selectedTab, setSelectedTab] = useState("local");
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [selectedCardType, setSelectedCardType] = useState(null);
  // Bank details - pre-filled and read-only
  const bankAccountNumber = "1234567890123"; // Replace with actual bank account number
  const bankName = "Dahabshiil Bank"; // Replace with actual bank name


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
            paymentmethod: selectedTab === "local" ? selectedMethod : (selectedCardType || "Online Payment"), // Set payment method based on tab
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
    if (selectedTab === "local") {
      const isPhoneValid =
        phone.length >= 8 && phone.length <= 12 && !isNaN(phone);
      const isPaymentMethodSelected = selectedMethod !== null;

      if (isPhoneValid && isPaymentMethodSelected) {
        setIsButtonDisabled(false);
      } else {
        setIsButtonDisabled(true);
      }
    } else if (selectedTab === "online") {
      // For online payment, button is enabled when bank is selected
      const isCardTypeSelected = selectedCardType !== null;

      if (isCardTypeSelected) {
        setIsButtonDisabled(false);
      } else {
        setIsButtonDisabled(true);
      }
    }
  }, [phone, selectedMethod, selectedTab, selectedCardType]);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-16 h-16 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Your cart is empty</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Add some books to your cart before checkout.</p>
          <button
            onClick={() => navigate("/books")}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Package className="w-5 h-5" />
            Browse Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/cart")}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Cart</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Checkout</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Complete your purchase</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Order Summary
              </h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item._id || item.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg transform rotate-3 opacity-20"></div>
                      <img
                        src={item.cover ? `http://localhost:3000${item.cover}` : 'https://via.placeholder.com/100x140?text=No+Image'}
                        alt={item.title}
                        className="relative w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100x140?text=No+Image';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">By {item.author}</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          {item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Payment Section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
              {/* Payment Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button
                  onClick={() => {
                    setSelectedTab("local");
                    setSelectedMethod(null);
                  }}
                  className={`flex-1 text-center py-3 font-semibold text-sm border-b-2 transition-colors ${
                    selectedTab === "local"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Local
                  </div>
                </button>
                <button
                  onClick={() => {
                    setSelectedTab("online");
                    setSelectedMethod(null);
                    setSelectedCardType(null);
                  }}
                  className={`flex-1 text-center py-3 font-semibold text-sm border-b-2 transition-colors ${
                    selectedTab === "online"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Online
                  </div>
                </button>
              </div>

              {/* Local Payment Methods */}
              {selectedTab === "local" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Method</h3>
                  <div className="space-y-3">
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
                        className={`w-full relative border-2 rounded-xl p-4 text-left transition-all duration-200 ${
                          selectedMethod === method
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                            : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white mb-1">
                              {method}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {method === "Cash on Delivery"
                                ? "Pay when you receive"
                                : `Pay with ${method} mobile money`}
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedMethod === method
                              ? "border-blue-600 bg-blue-600"
                              : "border-gray-300 dark:border-gray-500"
                          }`}>
                            {selectedMethod === method && (
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Payment Number Display */}
                  {selectedMethod && selectedMethod !== "Cash on Delivery" && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Send payment to:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-bold text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg">
                          *712*619537487#
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText("*712*619537487#");
                            toast.success("Payment number copied!");
                          }}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        Dial this number on your phone to send payment
                      </p>
                    </div>
                  )}

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                          if (value.length <= 12) {
                            setPhone(value);
                          }
                        }}
                        placeholder="E.g. 612345678"
                        maxLength={12}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 transition-colors"
                      />
                    </div>
                    {phone && phone.length > 0 && phone.length < 8 && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">Phone number must be at least 8 digits</p>
                    )}
                  </div>
                </div>
              )}

              {/* Online Payment */}
              {selectedTab === "online" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Method</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setSelectedCardType("Bank")}
                      className={`w-full relative border-2 rounded-xl p-4 text-left transition-all duration-200 ${
                        selectedCardType === "Bank"
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                          : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              Bank
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Transfer payment to bank account
                            </div>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedCardType === "Bank"
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-300 dark:border-gray-500"
                        }`}>
                          {selectedCardType === "Bank" && (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Bank Details Form */}
                  {selectedCardType === "Bank" && (
                    <div className="mt-6 space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-4">
                        <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bank Transfer Details</span>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={bankName}
                          readOnly
                          disabled
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-300 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={bankAccountNumber}
                          readOnly
                          disabled
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-300 cursor-not-allowed"
                        />
                      </div>

                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Please transfer the payment amount (${total.toFixed(2)}) to the bank account provided above. Your order will be processed after payment confirmation.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Total and Checkout Button */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total</span>
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">${total.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isButtonDisabled}
                  className={`w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 ${
                    isButtonDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:shadow-xl transform hover:scale-105"
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span>Pay ${total.toFixed(2)} Now</span>
                </button>

                {isButtonDisabled && (
                  <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
                    Please fill in all required fields
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
