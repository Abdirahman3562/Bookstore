import { useState, useEffect } from "react";
import { FiShoppingCart, FiTrash } from "react-icons/fi"; // Trash icon for removal
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]); // State to hold cart items
  const [total, setTotal] = useState(0); // State to hold the total price

  useEffect(() => {
    // Fetch cart items from localStorage
    const storedCartItems = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(storedCartItems);

    // Calculate total price
    const totalPrice = storedCartItems.reduce(
      (acc, item) => acc + item.price,
      0
    );
    setTotal(totalPrice);
  }, []);

  // Handle item removal from the cart
  const removeFromCart = (id) => {
    const updatedCartItems = cartItems.filter((item) => (item._id || item.id) !== id);
    setCartItems(updatedCartItems);
    localStorage.setItem("cart", JSON.stringify(updatedCartItems));

    // Recalculate total
    const totalPrice = updatedCartItems.reduce(
      (acc, item) => acc + item.price,
      0
    );
    setTotal(totalPrice);

    // 🔥 Tell Navbar to update count
    window.dispatchEvent(new Event("cartUpdated"));

    toast.success("Item removed from cart!");
  };

  // If no items in the cart, display an empty cart message
  if (cartItems.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <button
          onClick={() => navigate("/")}
          className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition"
        >
          Go to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="py-10 px-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-semibold mb-8 text-gray-800">Your Cart</h2>
      {/* Cart items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cartItems.map((item) => (
          <div
            key={item._id || item.id}
            className="flex items-center justify-between p-4 border rounded-lg shadow-lg bg-white"
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
                ${item.price}
              </p>
            </div>
            <button
              onClick={() => removeFromCart(item._id || item.id)}
              className="text-red-600 hover:text-red-800"
            >
              <FiTrash size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* Total price */}
      <div className="mt-8 flex justify-between items-center">
        <h3 className="text-2xl font-semibold text-gray-800">Total: </h3>
        <p className="text-3xl font-bold text-blue-600">${total.toFixed(2)}</p>
      </div>

      {/* Checkout Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => navigate("/checkout")}
          className="bg-[#2563eb] text-white py-2 px-8 rounded-md hover:bg-blue-700 transition duration-300 flex items-center gap-2"
        >
          <FiShoppingCart size={20} className="text-white" />{" "}
          {/* Add the cart icon */}
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
