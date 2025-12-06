import { useState, useEffect } from "react";
import { ShoppingCart, Trash2, ArrowLeft, Package, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const storedCartItems = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(storedCartItems);

    const totalPrice = storedCartItems.reduce(
      (acc, item) => acc + item.price,
      0
    );
    setTotal(totalPrice);
  }, []);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      const storedCartItems = JSON.parse(localStorage.getItem("cart")) || [];
      setCartItems(storedCartItems);
      const totalPrice = storedCartItems.reduce(
        (acc, item) => acc + item.price,
        0
      );
      setTotal(totalPrice);
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  const removeFromCart = (id) => {
    const updatedCartItems = cartItems.filter((item) => (item._id || item.id) !== id);
    setCartItems(updatedCartItems);
    localStorage.setItem("cart", JSON.stringify(updatedCartItems));

    const totalPrice = updatedCartItems.reduce(
      (acc, item) => acc + item.price,
      0
    );
    setTotal(totalPrice);

    window.dispatchEvent(new Event("cartUpdated"));
    toast.success("Item removed from cart!");
  };

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-16 h-16 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Your cart is empty</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Looks like you haven't added any books to your cart yet.</p>
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
            onClick={() => navigate("/books")}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Continue Shopping</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item._id || item.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex flex-col sm:flex-row p-6">
                  {/* Book Cover */}
                  <div className="relative flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl transform rotate-3 opacity-20"></div>
                    <img
                      src={item.cover ? `http://localhost:3000${item.cover}` : 'https://via.placeholder.com/120x160?text=No+Image'}
                      alt={item.title}
                      className="relative w-24 h-32 sm:w-28 sm:h-40 object-cover rounded-xl shadow-md"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/120x160?text=No+Image';
                      }}
                    />
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                        <span className="text-sm">By</span>
                        <span className="font-medium">{item.author}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item._id || item.id)}
                      className="mt-4 self-start inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="font-medium">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
                  <span className="font-semibold">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">Free</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <ShoppingCart className="w-5 h-5" />
                Proceed to Checkout
              </button>

              <button
                onClick={() => navigate("/books")}
                className="w-full mt-4 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
